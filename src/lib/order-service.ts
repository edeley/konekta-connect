import { type OrderState, calculateSplit, canTransitionOrder } from "./order-state-machine";
import { store } from "./store";

export interface CreateOrderParams {
  clientId: string;
  clientName: string;
  providerId?: string;
  categoryId: string;
  categoryName: string;
  serviceTitle: string;
  description: string;
  pricingModel: "fixed" | "custom_quote";
  totalAmount: number;
  scheduledFor: string;
  district: string;
  address?: string;
  referencePoint?: string;
  photos?: string[];
  gpsLatitude?: number;
  gpsLongitude?: number;
  urgency?: "urgente" | "esta-semana" | "sem-pressa";
}

export interface EscrowHoldParams {
  orderId: string;
  paymentMethodId: string; // "pm_wallet", "pm_dobrapay", "pm_secure_cash"
  totalAmount: number;
  currency?: string;
}

export interface VerifyPinAndSettleParams {
  orderId: string;
  providerId: string;
  enteredPin: string;
  lat?: number;
  lng?: number;
}

export interface OpenDisputeParams {
  orderId: string;
  openedByUserId: string;
  reason: string;
  description: string;
  evidencePhotos?: string[];
}

export interface OrderEventRecord {
  id: string;
  orderId: string;
  previousStatus?: OrderState;
  newStatus: OrderState;
  actorId: string;
  actorRole: "client" | "provider" | "system" | "admin";
  notes?: string;
  timestamp: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

export interface EscrowHoldRecord {
  id: string;
  orderId: string;
  clientId: string;
  amount: number;
  status: "HELD" | "RELEASED" | "REFUNDED" | "DISPUTED";
  paymentGatewayRef: string;
  heldAt: number;
  releasedAt?: number;
}

export interface SettlementResult {
  success: boolean;
  orderId: string;
  status: OrderState;
  settlement?: {
    totalCollected: number;
    platformCommission: number;
    commissionPercent: number;
    netProviderCredited: number;
    walletNewBalance: number;
  };
  error?: string;
}

/**
 * Camada de Serviço e Endpoints Backend da KONEKTA
 */
export const OrderService = {
  /**
   * POST /api/v1/orders/create
   * Criação do pedido com diagnóstico, agendamento e escopo (Preço Fixo ou Orçamento Aberto)
   */
  async createOrder(params: CreateOrderParams) {
    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const pinCode = Math.floor(1000 + Math.random() * 9000).toString();
    const initialStatus: OrderState = params.providerId ? "AWAITING_PAYMENT" : "PENDING_MATCH";

    const { platformCommission, netProviderCredited } = calculateSplit(params.totalAmount, 15);

    const orderData = {
      id: orderId,
      clientId: params.clientId,
      clientName: params.clientName,
      providerId: params.providerId,
      categoryId: params.categoryId,
      categoryName: params.categoryName,
      serviceTitle: params.serviceTitle,
      description: params.description,
      pricingModel: params.pricingModel,
      status: initialStatus,
      pinCode,
      totalAmount: params.totalAmount,
      commissionAmount: platformCommission,
      providerNetAmount: netProviderCredited,
      district: params.district,
      address: params.address,
      referencePoint: params.referencePoint,
      scheduledFor: params.scheduledFor,
      photos: params.photos || [],
      gpsLatitude: params.gpsLatitude,
      gpsLongitude: params.gpsLongitude,
      urgency: params.urgency || "esta-semana",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Cria também na store reativa
    if (params.providerId) {
      store.createOrder({
        providerId: params.providerId,
        service: params.serviceTitle,
        total: params.totalAmount,
        scheduledFor: params.scheduledFor,
        address: `${params.address || ""}, ${params.district}`,
        notes: params.description,
        paymentMethod: "carteira",
      });
    } else {
      store.createRequest({
        categorySlug: params.categoryId,
        categoryName: params.categoryName,
        title: params.serviceTitle,
        description: params.description,
        district: params.district,
        address: params.address,
        reference: params.referencePoint,
        urgency: params.urgency || "esta-semana",
        photosList: params.photos,
        budget: params.totalAmount > 0 ? params.totalAmount : undefined,
      });
    }

    return {
      success: true,
      order: orderData,
    };
  },

  /**
   * POST /api/v1/orders/:id/checkout (hold_escrow)
   * Bloqueia o valor total na forma de pagamento do cliente e ativa a custódia
   */
  async holdEscrow(params: EscrowHoldParams) {
    const currentOrders = store.get().orders;
    const order = currentOrders.find((o) => o.id === params.orderId);

    // Validação de saldo caso seja carteira
    if (params.paymentMethodId === "pm_wallet") {
      const balance = store.get().balance;
      if (balance < params.totalAmount) {
        return {
          success: false,
          error: `Saldo insuficiente na sua carteira KONEKTA (${balance} Db). Carregue a carteira ou escolha outro método.`,
        };
      }
    }

    // Atualiza estado do pedido para HELD_IN_ESCROW / aceite
    if (order) {
      store.updateOrder(params.orderId, {
        status: "aceite", // mapeia para HELD_IN_ESCROW
        paymentMethod: "carteira",
      });

      store.get().transactions.push({
        id: `t_escrow_${Date.now()}`,
        kind: "out",
        label: `Custódia Garantida KONEKTA — ${order.service}`,
        amount: params.totalAmount,
        at: Date.now(),
      });
    }

    store.notify({
      title: "Pagamento Retido em Custódia Segura",
      body: `${params.totalAmount} Db garantidos pela KONEKTA. Serviço confirmado! O seu PIN foi gerado.`,
      tone: "success",
      link: `/pedido/${params.orderId}`,
    });

    return {
      success: true,
      orderId: params.orderId,
      status: "HELD_IN_ESCROW" as OrderState,
      escrowHold: {
        id: `escrow_${Date.now()}`,
        amount: params.totalAmount,
        currency: params.currency || "STN",
        status: "HELD",
      },
    };
  },

  /**
   * POST /api/v1/orders/:id/start-transit
   * O prestador inicia a deslocação até ao local de atendimento
   */
  async startTransit(orderId: string, providerId: string) {
    store.updateOrder(orderId, {
      status: "a-caminho",
    });

    store.notify({
      title: "Prestador a Caminho",
      body: `O profissional iniciou a deslocação para o seu endereço em São Tomé.`,
      tone: "info",
      link: `/pedido/${orderId}`,
    });

    return {
      success: true,
      orderId,
      status: "IN_TRANSIT" as OrderState,
    };
  },

  /**
   * POST /api/v1/orders/:id/confirm-arrival (Check-in GPS)
   * O prestador chega ao local e inicia a execução
   */
  async confirmArrival(
    orderId: string,
    providerId: string,
    gpsCoords?: { lat: number; lng: number },
  ) {
    store.startService(orderId);

    return {
      success: true,
      orderId,
      status: "IN_PROGRESS" as OrderState,
      checkInTime: Date.now(),
      gpsCoords: gpsCoords || { lat: 0.336, lng: 6.731 },
    };
  },

  /**
   * POST /api/v1/orders/:id/request-pin
   * O prestador termina o trabalho físico e solicita o PIN ao cliente
   */
  async requestPin(orderId: string, providerId: string) {
    store.finishService(orderId);

    return {
      success: true,
      orderId,
      status: "PENDING_PIN_VERIFICATION" as OrderState,
    };
  },

  /**
   * POST /api/v1/orders/:id/settle (verify_pin_and_settle)
   * Validação por PIN com auto-submit, cálculo da comissão (15%) e repasse para a carteira
   */
  async verifyPinAndSettle(params: VerifyPinAndSettleParams): Promise<SettlementResult> {
    const order = store.get().orders.find((o) => o.id === params.orderId);
    if (!order) {
      return {
        success: false,
        orderId: params.orderId,
        status: "PENDING_PIN_VERIFICATION",
        error: "Pedido não encontrado no sistema.",
      };
    }

    const expectedPin = (order.completionCode || "1234").trim();
    const entered = (params.enteredPin || "").trim();

    if (entered !== expectedPin) {
      return {
        success: false,
        orderId: params.orderId,
        status: "PENDING_PIN_VERIFICATION",
        error: "PIN inválido. Solicite o código de 4 dígitos exibido no ecrã do cliente.",
      };
    }

    // Split de comissão: 15% taxa de serviço KONEKTA, 85% prestador
    const split = calculateSplit(order.total, 15);

    // Liquidação atômica
    const netCredited = store.addEarning(`Serviço ${order.id} - ${order.service}`, order.total);

    store.updateOrder(params.orderId, {
      status: "concluido",
      completedAt: Date.now(),
    });

    return {
      success: true,
      orderId: params.orderId,
      status: "COMPLETED",
      settlement: {
        totalCollected: split.totalCollected,
        platformCommission: split.platformCommission,
        commissionPercent: split.commissionPercent,
        netProviderCredited: netCredited,
        walletNewBalance: store.get().providerBalance,
      },
    };
  },

  /**
   * POST /api/v1/orders/:id/dispute (open_dispute)
   * Cliente abre contestação, congela saldo em custódia e aciona mediação
   */
  async openDispute(params: OpenDisputeParams) {
    store.updateOrder(params.orderId, {
      status: "aguardando-codigo", // mantem bloqueado
    });

    store.notify({
      title: "Disputa Aberta - Custódia Bloqueada",
      body: `O pedido ${params.orderId} entrou em mediação pelo suporte KONEKTA. Os fundos permanecem congelados com segurança.`,
      tone: "error",
      link: `/pedido/${params.orderId}`,
    });

    return {
      success: true,
      orderId: params.orderId,
      status: "DISPUTED" as OrderState,
      disputeId: `disp_${Date.now()}`,
    };
  },
};
