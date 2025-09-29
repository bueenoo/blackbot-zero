import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { CONFIG } from "../config.js";
import { isValidSteamId64 } from "../utils/validate.js";
import { resolveChannel } from "../utils/resolve.js";

export async function sendPvePanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("Cadastro PVE — Black")
    .setDescription("Clique no botão abaixo e informe **sua SteamID64** para receber o cargo PVE.")
    .setColor(0x222222);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("pve_cadastrar").setLabel("Enviar SteamID64").setStyle(ButtonStyle.Primary)
  );
  await channel.send({ embeds: [embed], components: [row] });
}

export function buildPveModal() {
  const modal = new ModalBuilder().setCustomId("modal_pve").setTitle("Cadastro PVE");
  const steam = new TextInputBuilder().setCustomId("pve_steamid").setLabel("SteamID64 (17 dígitos)").setStyle(TextInputStyle.Short).setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(steam));
  return modal;
}

export async function handlePveModal(interaction) {
  const steam = interaction.fields.getTextInputValue("pve_steamid");
  if (!isValidSteamId64(steam)) {
    return interaction.reply({ ephemeral: true, content: "SteamID64 inválido. Deve começar com 7656 e ter 17 dígitos." });
  }
  const role = interaction.guild.roles.cache.find(r => r.name === CONFIG.ROLES.PVE);
  if (!role) return interaction.reply({ ephemeral: true, content: "Cargo PVE não encontrado. Avise a administração." });
  const member = interaction.member;
  await member.roles.add(role).catch(()=>{});

  const logChan = resolveChannel(interaction.guild, CONFIG.CHANNELS.LOG_PVE || CONFIG.CHANNEL_NAMES.LOG_PVE_NAME);
  if (logChan) {
    const when = new Date().toLocaleString(process.env.LOG_TIMEZONE || "America/Argentina/Buenos_Aires");
    await logChan.send(`🧾 Registro PVE — **Usuário:** ${interaction.user} — **SteamID64:** \`${steam}\` — **Data:** ${when}`);
  }
  return interaction.reply({ ephemeral: true, content: "✅ Cadastro PVE concluído! Cargo aplicado." });
}
