
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

// Types
interface PaymentRequest {
  amount: number
  ref_command: string
  terrain_name: string
  reservation_date: string
  reservation_hours: string
  reservationData: {
    terrain_id: string
    reserviste_id: string
    date_reservation: string
    heure_debut: string
    nombre_heures: number
    montant_total: number
    statut: string
  }
  cancel_url: string
}

interface WebhookResponse {
  type_event: string
  ref_command?: string
  custom_field?: string
  api_key_sha256: string
  api_secret_sha256: string
  payment_method: string
  client_phone: string
  [key: string]: any
}

// Configuration
const CONFIG = {
  baseUrl: "https://preview--kaay-foot-dev.lovable.app",
  maxRetries: 3,
  retryDelay: 1000,
  timeoutDuration: 30000, // 30 seconds
}

// Utilitaires
class PaymentError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message)
    this.name = 'PaymentError'
  }
}

async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Service de base de données
class DatabaseService {
  private supabase
  private retryCount = 0

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
  }

  async getPendingReservation(ref: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('reservations_pending')
      .select('*')
      .or(`ref_command.eq.${ref},paytech_token.eq.${ref}`)
      .single()

    if (error) {
      console.error('Error fetching pending reservation:', error)
      throw new PaymentError(
        'Erreur lors de la récupération de la réservation',
        'DB_FETCH_ERROR',
        error
      )
    }

    return data
  }

  async createReservation(data: any): Promise<any> {
    try {
      const { data: reservation, error } = await this.supabase
        .from('reservations')
        .insert([data])
        .select()
        .single()

      if (error) throw error
      return reservation
    } catch (error) {
      if (this.retryCount < CONFIG.maxRetries) {
        this.retryCount++
        console.log(`Retry attempt ${this.retryCount} for createReservation`)
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay))
        return this.createReservation(data)
      }
      throw new PaymentError(
        'Erreur lors de la création de la réservation',
        'DB_INSERT_ERROR',
        error
      )
    }
  }

  async deletePendingReservation(ref: string): Promise<void> {
    const { error } = await this.supabase
      .from('reservations_pending')
      .delete()
      .eq('ref_command', ref)

    if (error) {
      console.warn('Warning: Could not delete pending reservation:', error)
    }
  }
}

// Service de paiement
class PaymentService {
  private db: DatabaseService
  
  constructor() {
    this.db = new DatabaseService()
  }

  async verifyPaytechCredentials(webhookData: WebhookResponse): Promise<boolean> {
    const apiKey = Deno.env.get('PAYTECH_API_KEY')
    const apiSecret = Deno.env.get('PAYTECH_API_SECRET')

    if (!apiKey || !apiSecret) {
      throw new PaymentError('Configuration PayTech manquante', 'CONFIG_ERROR')
    }

    const apiKeyHash = await sha256(apiKey)
    const apiSecretHash = await sha256(apiSecret)

    return (
      apiKeyHash === webhookData.api_key_sha256 &&
      apiSecretHash === webhookData.api_secret_sha256
    )
  }

  async processPaymentWebhook(webhookData: WebhookResponse): Promise<any> {
    console.log('Processing webhook data:', webhookData)

    if (webhookData.type_event !== 'sale_complete') {
      console.log('Ignoring non-sale_complete event:', webhookData.type_event)
      return { status: 'ignored', message: 'Event type non traité' }
    }

    const isValid = await this.verifyPaytechCredentials(webhookData)
    if (!isValid) {
      throw new PaymentError('Identifiants PayTech invalides', 'AUTH_ERROR')
    }

    const ref = webhookData.ref_command || 
                (typeof webhookData.custom_field === 'string' ? 
                  JSON.parse(webhookData.custom_field).ref_command : 
                  webhookData.custom_field?.ref_command)

    if (!ref) {
      throw new PaymentError('Référence de commande manquante', 'MISSING_REF')
    }

    const pendingReservation = await this.db.getPendingReservation(ref)
    if (!pendingReservation) {
      throw new PaymentError('Réservation en attente non trouvée', 'NOT_FOUND')
    }

    const reservationData = {
      ...pendingReservation.reservation_data,
      statut: 'validee',
      payment_status: 'completed',
      payment_ref: ref,
      payment_method: webhookData.payment_method,
      client_phone: webhookData.client_phone,
      payment_details: webhookData,
      confirmed_at: new Date().toISOString()
    }

    const confirmedReservation = await this.db.createReservation(reservationData)
    await this.db.deletePendingReservation(ref)

    return confirmedReservation
  }
}

// Handler principal
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('=== PAYTECH WEBHOOK HANDLER STARTED ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  try {
    // Timeout handler
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new PaymentError('Request timeout', 'TIMEOUT')), CONFIG.timeoutDuration)
    })

    const webhookData = await Promise.race([
      req.json(),
      timeoutPromise
    ]) as WebhookResponse

    const paymentService = new PaymentService()
    const result = await paymentService.processPaymentWebhook(webhookData)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    
    const statusCode = error instanceof PaymentError ? 400 : 500
    const errorResponse = {
      success: false,
      error: error.message,
      code: error instanceof PaymentError ? error.code : 'INTERNAL_ERROR',
      details: error instanceof PaymentError ? error.details : undefined
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode
      }
    )
  }
})
