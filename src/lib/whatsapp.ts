/** Número oficial Zavo — (62) 99435-6950 */
export const WHATSAPP_PHONE_E164 = "5562994356950";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE_E164}`;

export function buildWhatsAppUrl(message?: string): string {
  if (!message?.trim()) return WHATSAPP_URL;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message.trim())}`;
}

export const WHATSAPP_REFERRAL_MESSAGE =
  "Olá! Vim pelo portal Zavo e gostaria de saber mais sobre o programa de indicação de amigos e benefícios.";

export const WHATSAPP_HELP_MESSAGE =
  "Olá! Preciso de ajuda com minha conta no portal Zavo.";
