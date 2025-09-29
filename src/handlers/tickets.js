import { ChannelType, PermissionFlagsBits, MessageFlags } from "discord.js";
import { CONFIG } from "../config.js";

/**
 * Abre um ticket PRIVADO criando um canal na categoria definida por TICKETS_CATEGORY_ID.
 * Para cliques em botões, tenta deferReply(ephemeral). Se o bot não puder enviar mensagens no canal,
 * faz fallback para deferUpdate() e notifica o usuário por DM.
 */
export async function openTicket(interaction, tipo) {
  let mode = "reply"; // "reply" | "update"
  try {
    // Se for botão e o bot NÃO puder enviar mensagem no canal, use deferUpdate
    const me = interaction.client.user?.id;
    const canSendHere = interaction.channel?.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages);

    try {
      if (interaction.isButton() && !canSendHere) {
        await interaction.deferUpdate();
        mode = "update";
      } else {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        mode = "reply";
      }
    } catch {
      // Fallback final
      try { await interaction.deferUpdate(); mode = "update"; } catch {}
    }

    const guild = interaction.guild;
    if (!guild) {
      if (mode === "reply") return interaction.editReply("❌ Não consegui identificar o servidor.");
      else return interaction.user.send("❌ Não consegui identificar o servidor para abrir seu ticket.");
    }

    // Valida categoria
    const categoryId = CONFIG.TICKETS_CATEGORY_ID;
    const category = await guild.channels.fetch(categoryId).catch(() => null);

    if (!category) {
      const msg = "❌ Categoria de tickets não encontrada. Verifique TICKETS_CATEGORY_ID.";
      if (mode === "reply") return interaction.editReply(msg);
      else return interaction.user.send(msg);
    }
    if (category.type !== ChannelType.GuildCategory) {
      const msg = "❌ O ID informado não é uma **Categoria**. Crie uma categoria normal (não fórum) e use o ID dela.";
      if (mode === "reply") return interaction.editReply(msg);
      else return interaction.user.send(msg);
    }

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

    await channel.setParent(categoryId, { lockPermissions: false });

    await channel.send({
      content: `👋 Olá <@${interaction.user.id}>, que bom que você está aqui!\n\n` +
        `Em breve um membro da nossa **staff** vai te auxiliar.\n` +
        `👉 Descreva por favor **o que você necessita** e, se tiver algum **anexo**, já nos envie.`
    });

    if (mode === "reply") {
      return interaction.editReply(`✅ Seu ticket foi aberto: ${channel}`);
    } else {
      try { await interaction.user.send(`✅ Seu ticket foi aberto: ${channel}`); } catch {}
      return;
    }

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
      if (mode === "reply") await interaction.editReply(msg);
      else await interaction.user.send(msg);
    } catch {}
  }
}
