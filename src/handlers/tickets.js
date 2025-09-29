import { ChannelType, PermissionFlagsBits } from "discord.js";
import { CONFIG } from "../config.js";

/**
 * Abre um ticket PRIVADO criando um canal na categoria definida por TICKETS_CATEGORY_ID.
 * Responde rapidamente com deferReply(ephemeral) para evitar "Esta interação falhou".
 */
export async function openTicket(interaction, tipo) {
  let replied = false;
  try {
    await interaction.deferReply({ ephemeral: true });
    replied = true;

    const guild = interaction.guild;
    if (!guild) return interaction.editReply("❌ Não consegui identificar o servidor.");

    // Valida categoria
    const categoryId = CONFIG.TICKETS_CATEGORY_ID;
    const category = await guild.channels.fetch(categoryId).catch(() => null);

    if (!category) return interaction.editReply("❌ Categoria de tickets não encontrada. Verifique TICKETS_CATEGORY_ID.");
    if (category.type !== ChannelType.GuildCategory)
      return interaction.editReply("❌ O ID informado não é uma **Categoria**. Crie uma categoria normal (não fórum) e use o ID dela.");

    // Nome do canal
    const channelName = `ticket-${tipo}-${interaction.user.username}`
      .toLowerCase().replace(/[^a-z0-9-_]/g, "-").slice(0, 90);

    // Cria o canal
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        { id: CONFIG.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] }
      ]
    });

    // Move explicitamente para a categoria
    await channel.setParent(categoryId, { lockPermissions: false });

    await channel.send({
      content: `👋 Olá <@${interaction.user.id}>, que bom que você está aqui!\n\n` +
        `Em breve um membro da nossa **staff** vai te auxiliar.\n` +
        `👉 Descreva por favor **o que você necessita** e, se tiver algum **anexo**, já nos envie.`
    });

    return interaction.editReply(`✅ Seu ticket foi aberto: ${channel}`);
  } catch (err) {
    console.error("[TICKETS:ERR]", err);
    const msg = [
      "❌ Erro ao abrir o ticket.",
      "Verifique:",
      "• Se o **TICKETS_CATEGORY_ID** é uma **Categoria** (não fórum/canal de texto).",
      "• Se o bot tem **Gerenciar Canais** e **Ver Canal** na categoria.",
      "• Se o cargo do bot está **acima** do cargo da staff."
    ].join("\n");
    try {
      if (replied) await interaction.editReply(msg);
      else await interaction.reply({ content: msg, ephemeral: true });
    } catch {}
  }
}
