export function isValidSteamId64(id) {
  if (typeof id !== "string") return false;
  const s = id.trim();
  return /^7656\d{13}$/.test(s);
}
export function clampText(text, max=250) {
  if (!text) return "";
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max);
}
