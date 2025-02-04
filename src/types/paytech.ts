export interface PayTechConfig {
  apiKey: string;
  apiSecret: string;
}

export interface PayTechPaymentRequest {
  description: string;
  amount: number;
  currency: string;
}

export interface PayTechResponse {
  success: boolean;
  token?: string;
  redirectUrl?: string;
  error?: string;
}