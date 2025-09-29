import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { loadConfig, saveConfig } from "../utils/store.js";
import { CONFIG } from "../config.js";
import { sendVerificationPanel } from "../handlers/verification.js";
import { sendPvePanel } from "../handlers/pve-handler.js";
import { sendTicketsPanel } from "../handlers/tickets.js";
import { resolveChannel } from "../utils/resolve.js";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Define IPs e posta painéis (admin).")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(o => o.setName("rp_ip").setDescription("IP:PORT do servidor RP").setRequired(false))
  .addStringOption(o => o.setName("pve_ip").setDescription("IP:PORT do servidor PVE").setRequired(false))
  .addBooleanOption(o => o.setName("postar_paineis").setDescription("Publicar painéis agora").setRequired(false));

export async function execute(interaction) {
  const rp_ip = interaction.options.getString("rp_ip");
  const pve_ip = interaction.options.getString("pve_ip");
  const postar = interaction.options.getBoolean("postar_paineis") ?? false;

  const current = loadConfig();
  if (rp_ip) current.SERVER_RP_IP = rp_ip;
  if (pve_ip) current.SERVER_PVE_IP = pve_ip;
  saveConfig(current);

  if (postar) {
    const g = interaction.guild;
    const verif = resolveChannel(g, CONFIG.CHANNELS.VERIFICACAO || CONFIG.CHANNEL_NAMES.VERIFICACAO_NAME);
    const pveCh = resolveChannel(g, CONFIG.CHANNELS.PVE_REGISTRO || CONFIG.CHANNEL_NAMES.PVE_REGISTRO_NAME);
    const tik = resolveChannel(g, CONFIG.CHANNELS.ABRIR_TICKET || CONFIG.CHANNEL_NAMES.ABRIR_TICKET_NAME);
    if (verif) await sendVerificationPanel(verif);
    if (pveCh) await sendPvePanel(pveCh);
    if (tik) await sendTicketsPanel(tik);
  }

  return interaction.reply({ ephemeral: true, content: "✅ Config salvo. Use /info para verificar. Painéis publicados se você marcou a opção." });
}
