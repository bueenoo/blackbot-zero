import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Routes, REST, SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from "discord.js";
import { CONFIG } from "./config.js";
import { openTicket } from "./handlers/tickets.js";
import { sendVerificationPanel } from "./handlers/verification.js";
import http from "http";

// Healthcheck HTTP (Railway)
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Blackbot OK");
}).listen(PORT, () => console.log(`[HEALTH] HTTP on :${PORT}`));

process.on("SIGTERM", () => { console.log("[PROCESS] SIGTERM recebido. Encerrando..."); process.exit(0); });
process.on("SIGINT", () => { console.log("[PROCESS] SIGINT recebido. Encerrando..."); process.exit(0); });

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.once("clientReady", async () => {
  console.log(`[BLACKBOT] ✅ Bot online como ${client.user.tag}`);

  // Registra comandos no GUILD
  try {
    const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);

    const cmdTicket = new SlashCommandBuilder()
      .setName("ticket")
      .setDescription("Abrir um ticket privado")
      .addStringOption(o =>
        o.setName("tipo").setDescription("Selecione o tipo do ticket").setRequired(true)
          .addChoices(
            { name: "Doações", value: "doacoes" },
            { name: "Denúncia", value: "denuncia" },
            { name: "Suporte Técnico", value: "suporte" }
          )
      );

    const cmdPainel = new SlashCommandBuilder()
      .setName("painel")
      .setDescription("Reinstalar o painel de botões de tickets")
      .addChannelOption(o =>
        o.setName("canal")
          .setDescription("Canal onde enviar o painel")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addBooleanOption(o =>
        o.setName("limpar")
          .setDescription("Apagar mensagens antigas do bot no canal antes")
          .setRequired(false)
      );

    await rest.put(Routes.applicationGuildCommands(client.user.id, CONFIG.GUILD_ID), {
      body: [cmdTicket.toJSON(), cmdPainel.toJSON()]
    });
    console.log("[BLACKBOT] Slash commands registrados no GUILD.");
  } catch (e) {
    console.error("[BLACKBOT:ERR] Falha ao registrar comandos:", e);
  }

  // Opcional: envia painel automático
  if (CONFIG.CHANNELS.VERIFICATION) {
    await sendVerificationPanel(client).catch(() => {});
  }
});

client.on("interactionCreate", async (interaction) => {
  // Debug
  try { console.log("[DEBUG interaction]", { isButton: interaction.isButton?.(), isCommand: interaction.isChatInputCommand?.(), customId: interaction.customId, channel: interaction.channel?.id }); } catch {}

  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticket") {
        const tipo = interaction.options.getString("tipo");
        return await openTicket(interaction, tipo);
      }
      if (interaction.commandName === "painel") {
        // Validação de permissão em runtime
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", flags: MessageFlags.Ephemeral });
        }

        const canal = interaction.options.getChannel("canal") || null;
        const limpar = interaction.options.getBoolean("limpar") || false;

        await interaction.reply({ content: "⏳ Instalando painel...", flags: MessageFlags.Ephemeral });

        let target = canal;
        if (!target && CONFIG.CHANNELS.VERIFICATION) {
          try { target = await interaction.client.channels.fetch(CONFIG.CHANNELS.VERIFICATION); } catch {}
        }
        if (!target || !target.isTextBased()) {
          return interaction.editReply("❌ Defina um canal válido (use a opção `canal` ou a variável VERIFICATION_CHANNEL_ID).");
        }

        if (limpar) {
          try {
            const msgs = await target.messages.fetch({ limit: 50 });
            const toDelete = msgs.filter(m => m.author?.id === interaction.client.user.id && (m.components?.length || (m.content || '').includes("Central de Atendimentos")));
            for (const msg of toDelete.values()) {
              await msg.delete().catch(() => {});
            }
          } catch (e) {
            console.warn("[PAINEL] Falha ao limpar mensagens:", e.message);
          }
        }

        const res = await sendVerificationPanel(interaction.client, target);
        if (res?.ok) return interaction.editReply(`✅ Painel enviado em <#${res.channelId}>.`);
        else return interaction.editReply(`❌ Falha ao enviar painel: ${res?.reason || "erro desconhecido"}`);
      }
    } else if (interaction.isButton()) {
      // Suporta "open_ticket_*" e "ticket_*"
      const id = interaction.customId || "";
      let tipo = null;
      if (id.startsWith("open_ticket_")) tipo = id.slice("open_ticket_".length);
      else if (id.startsWith("ticket_")) tipo = id.slice("ticket_".length);

      if (tipo) {
        return await openTicket(interaction, tipo);
      } else {
        console.log("[BUTTON] customId sem handler:", id);
      }
    }
  } catch (err) {
    console.error("[INTERACTION ERROR]", err);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: "❌ Ocorreu um erro ao processar sua interação.", flags: MessageFlags.Ephemeral });
    }
  }
});

client.login(CONFIG.TOKEN);
