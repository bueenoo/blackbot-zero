import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { isValidSteamId64, clampText } from "../utils/validate.js";
import { getConfiguredChannel } from "../utils/chanmap.js";
import { pickTextTarget } from "../utils/textTarget.js";

export async function handleWhitelistModal(interaction) {
  const nome = interaction.fields.getTextInputValue("wl_nome");
  const idade = interaction.fields.getTextInputValue("wl_idade");
  const steam = interaction.fields.getTextInputValue("wl_steamid");
  const exp = interaction.fields.getTextInputValue("wl_exp");
  const hist = clampText(interaction.fields.getTextInputValue("wl_hist"), 250);

  if (!isValidSteamId64(steam)) {
    return interaction.reply({ ephemeral: true, content: "SteamID64 inválido. Deve começar com 7656 e ter 17 dígitos." });
  }

  const staffRaw = getConfiguredChannel(interaction.guild, "STAFF_ANALISE_RP", "STAFF_ANALISE_RP_NAME");
  const staffChannel = pickTextTarget(staffRaw);
  if (!staffChannel) {
    return interaction.reply({ ephemeral: true, content: "Canal de análise não é de texto ou não encontrado (/setchannels)." });
  }

  const embed = new EmbedBuilder()
    .setTitle("Análise — Whitelist RP (Black)")
    .addFields(
      { name: "Jogador", value: `${interaction.user} (id: ${interaction.user.id})` },
      { name: "Nome", value: nome, inline: true },
      { name: "Idade", value: idade, inline: true },
      { name: "SteamID64", value: steam, inline: false },
      { name: "Experiência", value: exp, inline: true },
      { name: "História", value: hist, inline: false }
    )
    .setTimestamp(new Date())
    .setColor(0x202020);

  const approve = new ButtonBuilder().setCustomId(`wl_approve:${interaction.user.id}`).setLabel("Aprovar").setStyle(ButtonStyle.Success);
  const reject  = new ButtonBuilder().setCustomId(`wl_reject:${interaction.user.id}`).setLabel("Reprovar").setStyle(ButtonStyle.Danger);

  await staffChannel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(approve, reject)] });

  const esperaRaw = getConfiguredChannel(interaction.guild, "ESPERA_RP", "ESPERA_RP_NAME");
  const espera = pickTextTarget(esperaRaw);
  if (espera) await espera.send(`📩 ${interaction.user} sua whitelist foi enviada. Aguarde análise da staff.`);

  return interaction.reply({ ephemeral: true, content: "Whitelist enviada com sucesso! Aguarde a análise." });
}

export async function handleWhitelistReview(interaction) {
  const [action, userId] = interaction.customId.split(":");
  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!member) return interaction.reply({ ephemeral: true, content: "Usuário não encontrado no servidor." });

  if (action === "wl_approve") {
    const role = interaction.guild.roles.cache.find(r => r.name === "Sobrevivente RP");
    if (!role) return interaction.reply({ ephemeral: true, content: "Cargo RP não encontrado." });
    await member.roles.add(role).catch(()=>{});
    await interaction.reply({ content: `✅ Aprovado: ${member}. Cargo **Sobrevivente RP** atribuído.` });
    try { await member.send("✅ Você foi aprovado na whitelist RP do Black. Bom jogo!"); } catch {}
  } else if (action === "wl_reject") {
    const reprovadosRaw = getConfiguredChannel(interaction.guild, "REPROVADOS_RP", "REPROVADOS_RP_NAME");
    const reprovados = pickTextTarget(reprovadosRaw);
    await interaction.reply({ ephemeral: true, content: "Reprovação registrada." });
    if (reprovados) await reprovados.send(`❌ <@${userId}> sua whitelist foi reprovada. Tente novamente futuramente.`);
    try { await member.send("❌ Sua whitelist RP no Black foi reprovada. Você pode tentar novamente no futuro."); } catch {}
  }
}
