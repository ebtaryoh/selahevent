"use client";

import { MessageSquare, ExternalLink } from "lucide-react";
import { generateWhatsAppTicketLink, type WhatsAppTicketPayload } from "@/lib/whatsapp";

interface WhatsAppShareButtonProps {
  payload: WhatsAppTicketPayload;
  compact?: boolean;
}

export function WhatsAppShareButton({ payload, compact = false }: WhatsAppShareButtonProps) {
  const url = generateWhatsAppTicketLink(payload);

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors"
        title="Send ticket pass directly via WhatsApp"
      >
        <MessageSquare size={13} className="text-emerald-600" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors"
    >
      <MessageSquare size={13} className="text-emerald-600" />
      <span>Send via WhatsApp</span>
    </a>
  );
}
