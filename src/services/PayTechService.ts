import { PayTechConfig, PayTechPaymentRequest, PayTechResponse } from '../types/paytech';
import { toast } from "sonner";

const PAYTECH_API_URL = 'https://paytech.sn/api/payment/request-payment';

export class PayTechService {
  private config: PayTechConfig;

  constructor(config: PayTechConfig) {
    this.config = config;
  }

  async initiatePayment(request: PayTechPaymentRequest): Promise<PayTechResponse> {
    try {
      console.log("Initiating PayTech payment with config:", {
        apiKey: this.config.apiKey.substring(0, 10) + '...',
        url: PAYTECH_API_URL
      });
      
      const requestBody = {
        item_name: request.description,
        item_price: request.amount,
        currency: request.currency,
        ref_command: `CMD-${Date.now()}`,
        command_name: request.description,
        env: 'test',
        success_url: window.location.origin + '/payment/success',
        cancel_url: window.location.origin + '/payment/cancel',
        ipn_url: window.location.origin + '/api/paytech/ipn',
        custom_field: JSON.stringify({
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        })
      };

      console.log("PayTech request body:", requestBody);

      const response = await fetch(PAYTECH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API_KEY': this.config.apiKey,
          'API_SECRET': this.config.apiSecret,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("PayTech HTTP error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("PayTech error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("PayTech successful response:", data);
      
      if (data.success) {
        return {
          success: true,
          token: data.token,
          redirectUrl: data.redirect_url,
        };
      } else {
        const errorMessage = data.errors?.[0] || data.message || "Échec de l'initialisation du paiement";
        console.error("PayTech API error:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("PayTech service error:", error);
      console.error("Full error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast.error("Erreur lors du paiement");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors du paiement",
      };
    }
  }
}