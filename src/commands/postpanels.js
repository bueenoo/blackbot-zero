import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { CONFIG } from "../config.js";
import { resolveChannel } from "../utils/resolve.js";
import { sendVerificationPanel } from "../handlers/verification.js";
import { sendPvePanel } from "../handlers/pve-handler.js";
import { sendTicketsPanel } from "../handlers/tickets.js";

export const data = new SlashCommandBuilder()
  .setName("postpanels")
  .setDescription("Publica painéis (Verificação, PVE, Tickets) nos canais corretos (admin).")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const g = interaction.guild;
  const verif = resolveChannel(g, CONFIG.CHANNELS.VERIFICACAO || CONFIG.CHANNEL_NAMES.VERIFICACAO_NAME);
  const pve   = resolveChannel(g, CONFIG.CHANNELS.PVE_REGISTRO || CONFIG.CHANNEL_NAMES.PVE_REGISTRO_NAME);
  const tik   = resolveChannel(g, CONFIG.CHANNELS.ABRIR_TICKET || CONFIG.CHANNEL_NAMES.ABRIR_TICKET_NAME);

  if (verif) await sendVerificationPanel(verif);
  if (pve)   await sendPvePanel(pve);
  if (tik)   await sendTicketsPanel(tik);

  return interaction.reply({ ephemeral: true, content: "✅ Painéis publicados (quando canais encontrados)." });
}
