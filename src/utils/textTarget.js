import { ChannelType } from "discord.js";
export function pickTextTarget(input) {
  if (!input) return null;
  if (typeof input.isTextBased === "function" && input.isTextBased()) return input;
  if (input.type === ChannelType.GuildCategory) {
    const children = input.guild.channels.cache.filter(c => c.parentId === input.id);
    const textChild = children.find(c => typeof c.isTextBased === "function" && c.isTextBased());
    if (textChild) return textChild;
  }
  return null;
}
