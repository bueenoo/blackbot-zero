import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getConfiguredChannel } from "../utils/chanmap.js";
import { sendVerificationPanel } from "../handlers/verification.js";
import { sendPvePanel } from "../handlers/pve-handler.js";
import { sendTicketsPanel } from "../handlers/tickets.js";

export const data = new SlashCommandBuilder()
  .setName("postpanels")
  .setDescription("Publica painéis (Verificação, PVE, Tickets) nos canais corretos (admin).")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const g = interaction.guild;
  const verif = getConfiguredChannel(g, "VERIFICACAO", "VERIFICACAO_NAME");
  const pve   = getConfiguredChannel(g, "PVE_REGISTRO", "PVE_REGISTRO_NAME");
  const tik   = getConfiguredChannel(g, "ABRIR_TICKET", "ABRIR_TICKET_NAME");

  if (verif) await sendVerificationPanel(verif);
  if (pve)   await sendPvePanel(pve);
  if (tik)   await sendTicketsPanel(tik);

  return interaction.reply({ ephemeral: true, content: "✅ Painéis publicados (quando canais encontrados)." });
}
