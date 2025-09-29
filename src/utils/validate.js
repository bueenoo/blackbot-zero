// Validação simples de SteamID64 (17 dígitos começando por 7656...)
export function isValidSteamId64(id) {
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  return /^7656\d{13}$/.test(trimmed);
}

// Limita texto a N caracteres (remove quebras extras)
export function clampText(text, max=250) {
  if (!text) return "";
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max);
}
