import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Routes, REST, SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from "discord.js";
import { CONFIG } from "./config.js";
import { openTicket, closeTicket } from "./handlers/tickets.js";
import { sendTicketPanel } from "./handlers/panels.js";
import { sendWelcomePanel, handleWlStart, handleWlSubmit, approveWl, openRejectModal, submitRejectReason } from "./handlers/whitelist.js";
import http from "http";

const PORT = process.env.PORT || 3000;
http.createServer((_, res) => { res.writeHead(200, { "Content-Type": "text/plain" }); res.end("Blackbot OK"); }).listen(PORT, () => console.log(`[HEALTH] HTTP on :${PORT}`));

process.on("SIGTERM", () => { console.log("[PROCESS] SIGTERM recebido. Encerrando..."); process.exit(0); });
process.on("SIGINT", () => { console.log("[PROCESS] SIGINT recebido. Encerrando..."); process.exit(0); });

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });

client.once("clientReady", async () => {
  console.log(`[BLACKBOT] ✅ Bot online como ${client.user.tag}`);
  try {
    const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);

    const cmdTicket = new SlashCommandBuilder()
      .setName("ticket")
      .setDescription("Abrir um ticket privado")
      .addStringOption(o =>
        o.setName("tipo").setDescription("Selecione o tipo do ticket").setRequired(true)
          .addChoices({ name: "Doações", value: "doacoes" }, { name: "Denúncia", value: "denuncia" }, { name: "Suporte Técnico", value: "suporte" })
      );

    const cmdPainel = new SlashCommandBuilder()
      .setName("painel")
      .setDescription("Instalar o painel de tickets em um canal")
      .addChannelOption(o => o.setName("canal").setDescription("Canal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement).setRequired(true))
      .addBooleanOption(o => o.setName("limpar").setDescription("Apagar painéis antigos do bot").setRequired(false));

    const cmdInstalarTodos = new SlashCommandBuilder()
      .setName("instalar_paineis")
      .setDescription("Instala todos os painéis (Tickets + Boas-vindas/WL)")
      .addChannelOption(o => o.setName("tickets").setDescription("Canal para painel de Tickets").addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement).setRequired(true))
      .addChannelOption(o => o.setName("boasvindas").setDescription("Canal para painel de Boas-vindas/WL").addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement).setRequired(true));

    const cmdReWelcome = new SlashCommandBuilder()
      .setName("reinstalar_welcome")
      .setDescription("Reinstala o painel de Boas-vindas/WL em um canal")
      .addChannelOption(o => o.setName("canal").setDescription("Canal").addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement).setRequired(true))
      .addBooleanOption(o => o.setName("limpar").setDescription("Apagar painéis antigos do bot").setRequired(false));

    await rest.put(Routes.applicationGuildCommands(client.user.id, CONFIG.GUILD_ID), { body: [cmdTicket.toJSON(), cmdPainel.toJSON(), cmdInstalarTodos.toJSON(), cmdReWelcome.toJSON()] });
    console.log("[BLACKBOT] Slash commands registrados no GUILD.");
  } catch (e) { console.error("[BLACKBOT:ERR] Falha ao registrar comandos:", e); }

  if (CONFIG.CHANNELS.VERIFICATION) { try { await sendTicketPanel(client, CONFIG.CHANNELS.VERIFICATION); } catch {} }
  if (CONFIG.WELCOME_CHANNEL_ID) { try { await sendWelcomePanel(client, CONFIG.WELCOME_CHANNEL_ID); } catch {} }
});

client.on("interactionCreate", async (interaction) => {
  try { console.log("[DEBUG interaction]", { isButton: interaction.isButton?.(), isCommand: interaction.isChatInputCommand?.(), isModal: interaction.isModalSubmit?.(), customId: interaction.customId, channel: interaction.channel?.id }); } catch {}

  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticket") {
        const tipo = interaction.options.getString("tipo");
        return await openTicket(interaction, tipo);
      }
      if (interaction.commandName === "painel") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: "❌ Você não tem permissão.", flags: MessageFlags.Ephemeral });
        const canal = interaction.options.getChannel("canal");
        const limpar = interaction.options.getBoolean("limpar") || false;
        await interaction.reply({ content: "⏳ Instalando painel...", flags: MessageFlags.Ephemeral });
        if (limpar && canal.isTextBased?.()) {
          try {
            const msgs = await canal.messages.fetch({ limit: 50 });
            const toDelete = msgs.filter(m => m.author?.id === interaction.client.user.id && (m.components?.length || (m.content || '').includes("Central de Atendimentos")));
            for (const msg of toDelete.values()) await msg.delete().catch(() => {});
          } catch (e) { console.warn("[PAINEL] Falha ao limpar mensagens:", e.message); }
        }
        const res = await sendTicketPanel(interaction.client, canal);
        return interaction.editReply(res?.ok ? `✅ Painel de tickets enviado em <#${res.channelId}>.` : `❌ Falha ao enviar painel: ${res?.reason || "erro desconhecido"}`);
      }
      if (interaction.commandName === "instalar_paineis") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: "❌ Você não tem permissão.", flags: MessageFlags.Ephemeral });
        const cTickets = interaction.options.getChannel("tickets");
        const cWelcome = interaction.options.getChannel("boasvindas");
        await interaction.reply({ content: "⏳ Instalando painéis...", flags: MessageFlags.Ephemeral });
        const r1 = await sendTicketPanel(interaction.client, cTickets);
        const r2 = await sendWelcomePanel(interaction.client, cWelcome);
        return interaction.editReply(`${r1?.ok ? "✅ Tickets" : "❌ Tickets"} • ${r2?.ok ? "✅ Boas-vindas/WL" : "❌ Boas-vindas/WL"}`);
      }
      if (interaction.commandName === "reinstalar_welcome") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: "❌ Você não tem permissão.", flags: MessageFlags.Ephemeral });
        const canal = interaction.options.getChannel("canal");
        const limpar = interaction.options.getBoolean("limpar") || false;
        await interaction.reply({ content: "⏳ Reinstalando painel de boas-vindas...", flags: MessageFlags.Ephemeral });
        if (limpar && canal.isTextBased?.()) {
          try {
            const msgs = await canal.messages.fetch({ limit: 50 });
            const toDelete = msgs.filter(m => m.author?.id === interaction.client.user.id && (m.components?.length || (m.embeds?.[0]?.title || '').includes("Bem-vindo(a) ao Black!") || (m.content || '').includes("Bem-vindo(a) ao Black!")));
            for (const msg of toDelete.values()) await msg.delete().catch(() => {});
          } catch (e) { console.warn("[WELCOME] Falha ao limpar mensagens:", e.message); }
        }
        const res = await sendWelcomePanel(interaction.client, canal);
        return interaction.editReply(res?.ok ? `✅ Painel de boas-vindas enviado em <#${res.channelId}>.` : `❌ Falha ao enviar painel: ${res?.reason || "erro desconhecido"}`);
      }
    }

    if (interaction.isButton()) {
      const id = interaction.customId || "";
      if (id === "ticket_close") return await closeTicket(interaction);

      let tipo = null;
      if (id.startsWith("open_ticket_")) tipo = id.slice("open_ticket_".length);
      else if (id.startsWith("ticket_")) tipo = id.slice("ticket_".length);
      if (tipo) return await openTicket(interaction, tipo);

      if (id === "wl_start" || id === "black_rp") return await handleWlStart(interaction);
      if (id === "pve_info") return interaction.reply({ content: "ℹ️ Info do PVE: em breve.", flags: MessageFlags.Ephemeral });
      if (id.startsWith("wl_approve:")) return await approveWl(interaction, id.split(":")[1]);
      if (id.startsWith("wl_reject:")) return await openRejectModal(interaction, id.split(":")[1]);
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "wl_modal") return await handleWlSubmit(interaction);
      if (interaction.customId.startsWith("wl_reject_reason:")) return await submitRejectReason(interaction, interaction.customId.split(":")[1]);
    }
  } catch (err) {
    console.error("[INTERACTION ERROR]", err);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply("❌ Ocorreu um erro ao processar sua interação.");
      else await interaction.reply({ content: "❌ Ocorreu um erro ao processar sua interação.", flags: MessageFlags.Ephemeral });
    } catch {}
  }
});

client.login(CONFIG.TOKEN);
