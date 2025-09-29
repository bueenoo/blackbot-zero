import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import { CONFIG } from "../config.js";

export async function sendTicketsPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle(CONFIG.TEXTS.TICKETS_TITULO)
    .setDescription(CONFIG.TEXTS.TICKETS_DESC)
    .setColor(0x151515);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_doacoes").setLabel("💰 Doações").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("ticket_denuncia").setLabel("🚨 Denúncia").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("ticket_suporte").setLabel("⚙️ Suporte Técnico").setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

export async function openTicketThread(interaction, tipo) {
  const name = `[TICKET] ${tipo} — ${interaction.user.username}`.slice(0, 90);
  const thread = await interaction.channel.threads.create({
    name,
    autoArchiveDuration: 1440,
    reason: `Ticket ${tipo} de ${interaction.user.tag}`
  });

  await thread.members.add(interaction.user.id).catch(() => {});
  await thread.send(`🎫 Ticket **${tipo}** aberto por ${interaction.user}. Um membro da staff responderá em breve.`);
  return interaction.reply({ ephemeral: true, content: `Ticket **${tipo}** criado: ${thread.toString()}` });
}
