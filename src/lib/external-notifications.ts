export type NotificationDispatch = {
  id: string;
  channel: "whatsapp" | "email";
  recipientRole: "prestador" | "cliente" | "admin";
  recipientName: string;
  recipientContact: string;
  subject?: string;
  message: string;
  whatsappUrl?: string;
  orderId?: string;
  requestId?: string;
  status: "enviado" | "simulado";
  createdAt: number;
};

const DISPATCH_STORAGE_KEY = "konekta_dispatched_notifications_v1";

export function loadDispatchedNotifications(): NotificationDispatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISPATCH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotificationDispatch[]) : [];
  } catch {
    return [];
  }
}

export function saveDispatchedNotifications(list: NotificationDispatch[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore
  }
}

export function recordDispatch(
  entry: Omit<NotificationDispatch, "id" | "createdAt" | "status">,
): NotificationDispatch {
  const full: NotificationDispatch = {
    ...entry,
    id: `disp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    status: "enviado",
    createdAt: Date.now(),
  };
  const list = [full, ...loadDispatchedNotifications()];
  saveDispatchedNotifications(list);
  return full;
}

export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function notifyProviderOnRequestApproved(input: {
  requestId: string;
  requestTitle: string;
  categoryName: string;
  district: string;
  budget?: number;
  providerName: string;
  providerPhone?: string;
  providerEmail?: string;
}): { whatsapp: NotificationDispatch; email: NotificationDispatch } {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://konekta-stp.app";
  const budgetStr = input.budget ? `${input.budget} Db` : "A combinar";
  const phone = input.providerPhone || "+2399845678";
  const email = input.providerEmail || "prestador@konekta-stp.com";

  const waText = `🔔 *KONEKTA STP: Novo Pedido Aprovado!*\n\nOlá ${input.providerName}, um novo serviço na sua categoria (*${input.categoryName}*) foi validado pela administração.\n\n📋 *${input.requestTitle}*\n📍 Distrito: ${input.district}\n💰 Orçamento: ${budgetStr}\n\n👉 Para aceitar este trabalho, abra:\n${origin}/pro/trabalhos`;

  const wa = recordDispatch({
    channel: "whatsapp",
    recipientRole: "prestador",
    recipientName: input.providerName,
    recipientContact: phone,
    message: waText,
    whatsappUrl: generateWhatsAppLink(phone, waText),
    requestId: input.requestId,
  });

  const mailSubject = `[KONEKTA STP] Novo Pedido Aprovado: ${input.requestTitle}`;
  const mailBody = `Olá ${input.providerName},\n\nO pedido "${input.requestTitle}" em ${input.district} foi aprovado pela administração da KONEKTA STP e está pronto para receber propostas.\n\nCategoria: ${input.categoryName}\nValor estimado: ${budgetStr}\n\nAceda a ${origin}/pro/trabalhos para aceitar ou agendar o serviço.`;

  const em = recordDispatch({
    channel: "email",
    recipientRole: "prestador",
    recipientName: input.providerName,
    recipientContact: email,
    subject: mailSubject,
    message: mailBody,
    requestId: input.requestId,
  });

  return { whatsapp: wa, email: em };
}

export function notifyClientOnProviderAccepted(input: {
  requestId: string;
  orderId: string;
  requestTitle: string;
  providerName: string;
  providerPhone?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  scheduledFor: string;
  price: number;
}): { whatsapp: NotificationDispatch; email: NotificationDispatch } {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://konekta-stp.app";
  const clientPhone = input.clientPhone || "+2399918273";
  const clientEmail = input.clientEmail || "cliente@konekta-stp.com";

  const waText = `🎉 *KONEKTA STP: O seu pedido foi aceite!*\n\nOlá ${input.clientName}, o prestador verificado *${input.providerName}* aceitou o seu pedido:\n\n📋 *${input.requestTitle}*\n💰 Valor acordado: ${input.price} Db\n📅 Horário previsto: ${input.scheduledFor}\n\n👉 Aceda ao chat seguro para combinar com o técnico:\n${origin}/chat/${input.orderId}`;

  const wa = recordDispatch({
    channel: "whatsapp",
    recipientRole: "cliente",
    recipientName: input.clientName,
    recipientContact: clientPhone,
    message: waText,
    whatsappUrl: generateWhatsAppLink(clientPhone, waText),
    orderId: input.orderId,
    requestId: input.requestId,
  });

  const mailSubject = `[KONEKTA STP] O seu pedido "${input.requestTitle}" foi aceite por ${input.providerName}`;
  const mailBody = `Olá ${input.clientName},\n\nO prestador ${input.providerName} aceitou o seu pedido "${input.requestTitle}".\n\nDetalhes:\n- Valor: ${input.price} Db\n- Horário agendado: ${input.scheduledFor}\n- Serviço: ${input.requestTitle}\n\nPode conversar com o prestador diretamente no chat protegido KONEKTA em ${origin}/pedidos.`;

  const em = recordDispatch({
    channel: "email",
    recipientRole: "cliente",
    recipientName: input.clientName,
    recipientContact: clientEmail,
    subject: mailSubject,
    message: mailBody,
    orderId: input.orderId,
    requestId: input.requestId,
  });

  return { whatsapp: wa, email: em };
}
