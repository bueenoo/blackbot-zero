import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { loadConfig, saveConfig } from "../utils/store.js";

export const data = new SlashCommandBuilder()
  .setName("setchannels")
  .setDescription("Mapeia canais por ID para o bot usar (admin).")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(o => o.setName("verificacao").setDescription("Canal para painel RP").addChannelTypes(ChannelType.GuildText).setRequired(false))
  .addChannelOption(o => o.setName("pve_registro").setDescription("Canal para painel PVE").addChannelTypes(ChannelType.GuildText).setRequired(false))
  .addChannelOption(o => o.setName("abrir_ticket").setDescription("Canal para painel de tickets").addChannelTypes(ChannelType.GuildText).setRequired(false))
  .addChannelOption(o => o.setName("staff_analise_rp").setDescription("Canal de análise de whitelist (staff)").addChannelTypes(ChannelType.GuildText).setRequired(false))
  .addChannelOption(o => o.setName("espera_rp").setDescription("Canal de espera da whitelist").addChannelTypes(ChannelType.GuildText).setRequired(false))
  .addChannelOption(o => o.setName("reprovados_rp").setDescription("Canal de reprovados RP").addChannelTypes(ChannelType.GuildText).setRequired(false))
  .addChannelOption(o => o.setName("log_pve").setDescription("Canal de logs PVE").addChannelTypes(ChannelType.GuildText).setRequired(false))
  .addChannelOption(o => o.setName("log_tickets").setDescription("Canal de logs de tickets").addChannelTypes(ChannelType.GuildText).setRequired(false))
  .addChannelOption(o => o.setName("info_channel").setDescription("Canal permitido para /info").addChannelTypes(ChannelType.GuildText).setRequired(false));

export async function execute(interaction) {
  const opts = interaction.options;
  const cfg = loadConfig();

  const fields = [
    ["VERIFICACAO", "verificacao"],
    ["PVE_REGISTRO", "pve_registro"],
    ["ABRIR_TICKET", "abrir_ticket"],
    ["STAFF_ANALISE_RP", "staff_analise_rp"],
    ["ESPERA_RP", "espera_rp"],
    ["REPROVADOS_RP", "reprovados_rp"],
    ["LOG_PVE", "log_pve"],
    ["LOG_TICKETS", "log_tickets"],
    ["INFO_COMMAND_CHANNEL", "info_channel"]
  ];

  let changed = 0;
  for (const [key, opt] of fields) {
    const ch = opts.getChannel(opt);
    if (ch) {
      cfg[key] = ch.id;
      changed++;
    }
  }
  saveConfig(cfg);

  return interaction.reply({ ephemeral: true, content: `✅ Mapeamento salvo (${changed} canais). Use /postpanels para republicar os painéis.` });
}
