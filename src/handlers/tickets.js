import { ChannelType, PermissionFlagsBits } from "discord.js";
import { CONFIG } from "../config.js";

/**
 * Abre um ticket PRIVADO criando um canal na categoria definida por TICKETS_CATEGORY_ID.
 * O canal é visível somente para o autor do ticket e para o cargo da staff (STAFF_ROLE_ID).
 */
export async function openTicket(interaction, tipo) {
  try {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: "❌ Não consegui identificar o servidor.", ephemeral: true });
    }

    const channelName = `ticket-${tipo}-${interaction.user.username}`
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .slice(0, 90);

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CONFIG.TICKETS_CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        { id: CONFIG.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] }
      ]
    });

    await channel.send({
      content: `👋 Olá <@${interaction.user.id}>, que bom que você está aqui!

` +
        `Em breve um membro da nossa **staff** vai te auxiliar.
` +
        `👉 Descreva por favor **o que você necessita** e, se tiver algum **anexo**, já nos envie.`
    });

    await interaction.reply({ content: `✅ Seu ticket foi aberto: ${channel}`, ephemeral: true });
  } catch (err) {
    console.error("[TICKETS:ERR]", err);
    try {
      await interaction.reply({ content: "❌ Erro ao abrir o ticket. Verifique se o bot tem **Gerenciar Canais** e **Ver Canal** na categoria.", ephemeral: true });
    } catch {}
  }
}
