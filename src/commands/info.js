import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import process from "node:process";
import { CONFIG } from "../config.js";
import { loadConfig } from "../utils/store.js";

export const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("Mostra IPs dos servidores e membros online");

export async function execute(interaction) {
  const allowedChannel = CONFIG.CHANNELS.INFO_COMMAND_CHANNEL;
  if (allowedChannel && interaction.channelId !== allowedChannel) {
    return interaction.reply({ ephemeral: true, content: "Use este comando no canal autorizado." });
  }

  const persisted = loadConfig();
  const rp = persisted.SERVER_RP_IP || process.env.SERVER_RP_IP || "não configurado";
  const pve = persisted.SERVER_PVE_IP || process.env.SERVER_PVE_IP || "não configurado";

  const guild = interaction.guild;
  await guild.members.fetch();
  const online = guild.members.cache.filter(m => m.presence && m.presence.status !== "offline").size;

  const embed = new EmbedBuilder()
    .setTitle("Informações do Servidor Black")
    .setDescription("IPs e membros online no Discord")
    .addFields(
      { name: "RP", value: `\`${rp}\`` , inline: true },
      { name: "PVE", value: `\`${pve}\`` , inline: true },
      { name: "Membros online", value: String(online), inline: false }
    )
    .setTimestamp(new Date());

  return interaction.reply({ embeds: [embed] });
}
