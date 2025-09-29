import "dotenv/config";
import {
  Client, GatewayIntentBits, Partials, Collection,
  Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder
} from "discord.js";

import { CONFIG } from "./src/config.js";
import { log, warn, error } from "./src/utils/logger.js";
import * as Info from "./src/commands/info.js";
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

client.once(Events.ClientReady, async (c) => {
  log(`✅ Bot online como ${c.user.tag}`);

  // registra comandos no guild (escopo local)
  try {
    const guildId = process.env.GUILD_ID;
    if (guildId) {
      const guild = await client.guilds.fetch(guildId);
      await guild.commands.set([Info.data.toJSON()]);
      log("Slash commands registrados no GUILD.");
    } else {
      warn("GUILD_ID não definido — comandos não registrados.");
    }
  } catch (e) {
    error("Falha ao registrar comandos:", e);
  }

  // Envia/atualiza paineis nos canais definidos (opcional, com try/catch)
  try {
    const guild = process.env.GUILD_ID ? await client.guilds.fetch(process.env.GUILD_ID) : null;
    if (guild) {
      const chanRP = guild.channels.cache.get(CONFIG.CHANNELS.VERIFICACAO);
      const chanPVE = guild.channels.cache.get(CONFIG.CHANNELS.PVE_REGISTRO);
      if (chanRP) await sendVerificationPanel(chanRP);
      if (chanPVE) await sendPvePanel(chanPVE);
    }
  } catch (e) {
    warn("Não foi possível enviar painéis automaticamente (verifique IDs e permissões).");
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) return await command.execute(interaction);
    }

    // Buttons
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id === "black_rp") {
        // abre modal whitelist RP
        return interaction.showModal(buildWhitelistModal());
      }

      if (id === "black_pve") {
        const pveChannel = interaction.guild.channels.cache.get(CONFIG.CHANNELS.PVE_REGISTRO);
        if (pveChannel) {
          await pveChannel.send(`${interaction.user}, use o botão abaixo para enviar sua SteamID64.`);
        }
        return interaction.reply({ ephemeral: true, content: "Siga para o canal de cadastro PVE indicado." });
      }

      if (id === "pve_cadastrar") {
        return interaction.showModal(buildPveModal());
      }

      if (id.startsWith("wl_approve") || id.startsWith("wl_reject")) {
        return handleWhitelistReview(interaction);
      }

      if (id === "tickets_panel") {
        await sendTicketsPanel(interaction.channel);
        return interaction.reply({ ephemeral: true, content: "Painel de tickets enviado." });
      }

      if (id === "ticket_doacoes") return openTicketThread(interaction, "Doações");
      if (id === "ticket_denuncia") return openTicketThread(interaction, "Denúncia");
      if (id === "ticket_suporte")  return openTicketThread(interaction, "Suporte Técnico");
    }

    // Modals
    if (interaction.isModalSubmit()) {
      if (interaction.customId === "modal_whitelist_rp") {
        return handleWhitelistModal(interaction);
      }
      if (interaction.customId === "modal_pve") {
        return handlePveModal(interaction);
      }
    }
  } catch (e) {
    error("Erro em InteractionCreate:", e);
    if (interaction.isRepliable()) {
      try { await interaction.reply({ ephemeral: true, content: "Ocorreu um erro. Avise a staff." }); } catch {}
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
