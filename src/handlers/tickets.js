import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { getConfiguredChannel } from "../utils/chanmap.js";
import { pickTextTarget } from "../utils/textTarget.js";

export async function sendTicketsPanel(channel) {
  const target = pickTextTarget(channel);
  if (!target) return;
  const embed = new EmbedBuilder()
    .setTitle("Central de Atendimentos — Black")
    .setDescription("Abra um ticket e nossa staff irá ajudá-lo.")
    .setColor(0x151515);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_doacoes").setLabel("💰 Doações").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("ticket_denuncia").setLabel("🚨 Denúncia").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("ticket_suporte").setLabel("⚙️ Suporte Técnico").setStyle(ButtonStyle.Primary)
  );
  await target.send({ embeds: [embed], components: [row] });
}

export async function openTicketThread(interaction, tipo) {
  const name = `[TICKET] ${tipo} — ${interaction.user.username}`.slice(0, 90);
  const thread = await interaction.channel.threads.create({
    name,
    autoArchiveDuration: 1440,
    reason: `Ticket ${tipo} de ${interaction.user.tag}`
  });
  await thread.members.add(interaction.user.id).catch(() => {});
  const logRaw = getConfiguredChannel(interaction.guild, "LOG_TICKETS", "LOG_TICKETS_NAME");
  const logChan = pickTextTarget(logRaw);
  await thread.send(`🎫 Ticket **${tipo}** aberto por ${interaction.user}. Um membro da staff responderá em breve.`);
  if (logChan) await logChan.send(`📝 Ticket **${tipo}** criado por ${interaction.user} em ${interaction.channel}. Thread: ${thread}`);
  return interaction.reply({ ephemeral: true, content: `Ticket **${tipo}** criado: ${thread.toString()}` });
}
