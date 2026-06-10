import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { WHATSAPP_URL } from "@/lib/whatsapp";

export { WHATSAPP_URL, buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a Zavo no WhatsApp"
      className="fixed bottom-[5.25rem] sm:bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </a>
  );
}

/** FAB em todas as rotas, exceto área admin. */
export function AppWhatsAppFab() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <WhatsAppFloatingButton />;
}
