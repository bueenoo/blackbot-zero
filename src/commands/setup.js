import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { loadConfig, saveConfig } from "../utils/store.js";
import { CONFIG } from "../config.js";
import { sendVerificationPanel } from "../handlers/verification.js";
import { sendPvePanel } from "../handlers/pve-handler.js";
import { sendTicketsPanel } from "../handlers/tickets.js";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Configura IPs e posta painéis (admin).")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(o => o.setName("rp_ip").setDescription("IP:PORT do servidor RP").setRequired(false))
  .addStringOption(o => o.setName("pve_ip").setDescription("IP:PORT do servidor PVE").setRequired(false))
  .addBooleanOption(o => o.setName("postar_paineis").setDescription("Publicar painéis agora").setRequired(false));

export async function execute(interaction) {
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
  if (!isAdmin) return interaction.reply({ ephemeral: true, content: "Apenas administradores podem usar este comando." });

  const rp_ip = interaction.options.getString("rp_ip");
  const pve_ip = interaction.options.getString("pve_ip");
  const postar = interaction.options.getBoolean("postar_paineis") ?? false;

  const current = loadConfig();
  if (rp_ip) current.SERVER_RP_IP = rp_ip;
  if (pve_ip) current.SERVER_PVE_IP = pve_ip;

  saveConfig(current);

  let msg = "✅ Configuração salva.";
  if (current.SERVER_RP_IP || current.SERVER_PVE_IP) {
    msg += `\n• RP: \`${current.SERVER_RP_IP || "env/indefinido"}\`\n• PVE: \`${current.SERVER_PVE_IP || "env/indefinido"}\``;
  }

  if (postar) {
    const guild = interaction.guild;
    const chanRP = guild.channels.cache.get(CONFIG.CHANNELS.VERIFICACAO);
    const chanPVE = guild.channels.cache.get(CONFIG.CHANNELS.PVE_REGISTRO);
    if (chanRP) await sendVerificationPanel(chanRP);
    if (chanPVE) await sendPvePanel(chanPVE);
    const here = interaction.channel;
    if (here) await sendTicketsPanel(here);
    msg += "\n🧩 Painéis publicados.";
  }

  return interaction.reply({ ephemeral: true, content: msg });
}
