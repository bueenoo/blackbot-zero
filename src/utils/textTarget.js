import { ChannelType, PermissionFlagsBits } from "discord.js";

export function pickTextTarget(input) {
  if (!input) return null;

  // If it's text-based: good
  if (typeof input.isTextBased === "function" && input.isTextBased()) return input;

  // If it's a Category, try to find a child text channel we can send to
  if (input.type === ChannelType.GuildCategory) {
    const children = input.guild.channels.cache.filter(c => c.parentId === input.id);
    const textChild = children.find(c => typeof c.isTextBased === "function" && c.isTextBased());
    if (textChild) return textChild;
  }

  // If it's a Forum, we can't send directly — skip (user should choose outro canal)
  return null;
}
