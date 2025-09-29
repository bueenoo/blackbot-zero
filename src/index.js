import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Routes, REST, SlashCommandBuilder, MessageFlags } from "discord.js";
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

  // Registra /ticket no GUILD
  try {
    const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);
    const commands = [
      new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Abrir um ticket privado")
        .addStringOption(o =>
          o.setName("tipo").setDescription("Selecione o tipo do ticket").setRequired(true)
            .addChoices(
              { name: "Doações", value: "doacoes" },
              { name: "Denúncia", value: "denuncia" },
              { name: "Suporte Técnico", value: "suporte" }
            )
        ).toJSON()
    ];
    await rest.put(Routes.applicationGuildCommands(client.user.id, CONFIG.GUILD_ID), { body: commands });
    console.log("[BLACKBOT] Slash commands registrados no GUILD.");
  } catch (e) {
    console.error("[BLACKBOT:ERR] Falha ao registrar comandos:", e);
  }

  await sendVerificationPanel(client);
});

client.on("interactionCreate", async (interaction) => {
  // Debug para ver o evento chegando e o customId
  try {
    console.log("[DEBUG interaction]", {
      isButton: interaction.isButton?.(),
      isCommand: interaction.isChatInputCommand?.(),
      customId: interaction.customId,
      channel: interaction.channel?.id
    });
  } catch {}
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticket") {
        const tipo = interaction.options.getString("tipo");
        await openTicket(interaction, tipo);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId?.startsWith("open_ticket_")) {
        const tipo = interaction.customId.replace("open_ticket_", "");
        await openTicket(interaction, tipo);
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
