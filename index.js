import "dotenv/config";
import {
  Client, GatewayIntentBits, Partials, Collection,
  Events
} from "discord.js";

import { CONFIG } from "./src/config.js";
import { log, warn, error } from "./src/utils/logger.js";
import * as Info from "./src/commands/info.js";
import * as Setup from "./src/commands/setup.js";
import * as PostPanels from "./src/commands/postpanels.js";
import { resolveChannel } from "./src/utils/resolve.js";
import { sendVerificationPanel, buildWhitelistModal } from "./src/handlers/verification.js";
import { handleWhitelistModal, handleWhitelistReview } from "./src/handlers/whitelist-rp.js";
import { sendPvePanel, buildPveModal, handlePveModal } from "./src/handlers/pve-handler.js";
import { sendTicketsPanel, openTicketThread } from "./src/handlers/tickets.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
client.commands.set(Info.data.name, Info);
client.commands.set(Setup.data.name, Setup);
client.commands.set(PostPanels.data.name, PostPanels);

client.once(Events.ClientReady, async (c) => {
  log(`✅ Bot online como ${c.user.tag}`);
  try {
    const guildId = process.env.GUILD_ID;
    if (guildId) {
      const guild = await client.guilds.fetch(guildId);
      await guild.commands.set([Info.data.toJSON(), Setup.data.toJSON(), PostPanels.data.toJSON()]);
      log("Slash commands registrados no GUILD.");
      const verif = resolveChannel(guild, CONFIG.CHANNELS.VERIFICACAO || CONFIG.CHANNEL_NAMES.VERIFICACAO_NAME);
      const pve   = resolveChannel(guild, CONFIG.CHANNELS.PVE_REGISTRO || CONFIG.CHANNEL_NAMES.PVE_REGISTRO_NAME);
      const tik   = resolveChannel(guild, CONFIG.CHANNELS.ABRIR_TICKET || CONFIG.CHANNEL_NAMES.ABRIR_TICKET_NAME);
      if (verif) await sendVerificationPanel(verif);
      if (pve)   await sendPvePanel(pve);
      if (tik)   await sendTicketsPanel(tik);
    } else {
      warn("GUILD_ID não definido — pulei auto-post. Use /postpanels.");
      await client.application.commands.set([Info.data.toJSON(), Setup.data.toJSON(), PostPanels.data.toJSON()]);
    }
  } catch (e) { error("Falha ao registrar comandos:", e); }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) return await command.execute(interaction);
    }
    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id === "black_rp") return interaction.showModal(buildWhitelistModal());
      if (id === "black_pve") {
        const pveCh = resolveChannel(interaction.guild, CONFIG.CHANNELS.PVE_REGISTRO || CONFIG.CHANNEL_NAMES.PVE_REGISTRO_NAME);
        if (pveCh) await sendPvePanel(pveCh);
        return interaction.reply({ ephemeral: true, content: "Siga para o canal de cadastro PVE indicado." });
      }
      if (id === "pve_cadastrar") return interaction.showModal(buildPveModal());
      if (id.startsWith("wl_approve") || id.startsWith("wl_reject")) return handleWhitelistReview(interaction);
      if (id === "tickets_panel") { await sendTicketsPanel(interaction.channel); return interaction.reply({ ephemeral: true, content: "Painel de tickets enviado." }); }
      if (id === "ticket_doacoes") return openTicketThread(interaction, "Doações");
      if (id === "ticket_denuncia") return openTicketThread(interaction, "Denúncia");
      if (id === "ticket_suporte")  return openTicketThread(interaction, "Suporte Técnico");
    }
    if (interaction.isModalSubmit()) {
      if (interaction.customId === "modal_whitelist_rp") return handleWhitelistModal(interaction);
      if (interaction.customId === "modal_pve") return handlePveModal(interaction);
    }
  } catch (e) {
    error("Erro em InteractionCreate:", e);
    if (interaction.isRepliable()) {
      try { await interaction.reply({ ephemeral: true, content: "Ocorreu um erro. Avise a staff." }); } catch {}
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
