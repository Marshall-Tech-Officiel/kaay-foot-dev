export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      droits_gerants: {
        Row: {
          created_at: string | null
          gerant_id: string | null
          id: string
          peut_annuler_reservations: boolean | null
          peut_gerer_reservations: boolean | null
          peut_modifier_terrain: boolean | null
          terrain_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gerant_id?: string | null
          id?: string
          peut_annuler_reservations?: boolean | null
          peut_gerer_reservations?: boolean | null
          peut_modifier_terrain?: boolean | null
          terrain_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gerant_id?: string | null
          id?: string
          peut_annuler_reservations?: boolean | null
          peut_gerer_reservations?: boolean | null
          peut_modifier_terrain?: boolean | null
          terrain_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "droits_gerants_gerant_id_fkey"
            columns: ["gerant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "droits_gerants_terrain_id_fkey"
            columns: ["terrain_id"]
            isOneToOne: false
            referencedRelation: "terrains"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          created_at: string | null
          id: string
          montant: number
          reference_wave: string | null
          reservation_id: string | null
          statut: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          montant: number
          reference_wave?: string | null
          reservation_id?: string | null
          statut: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          montant?: number
          reference_wave?: string | null
          reservation_id?: string | null
          statut?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      photos_terrain: {
        Row: {
          created_at: string | null
          id: string
          terrain_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          terrain_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          terrain_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_terrain_terrain_id_fkey"
            columns: ["terrain_id"]
            isOneToOne: false
            referencedRelation: "terrains"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nom: string
          prenom: string
          proprietaire_id: string | null
          role: string
          telephone: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nom: string
          prenom: string
          proprietaire_id?: string | null
          role: string
          telephone: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string
          prenom?: string
          proprietaire_id?: string | null
          role?: string
          telephone?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          id: string
          nom: string
        }
        Insert: {
          id?: string
          nom: string
        }
        Update: {
          id?: string
          nom?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string | null
          date_reservation: string
          heure_debut: string
          id: string
          montant_total: number
          nombre_heures: number
          payment_details: Json | null
          payment_ref: string | null
          payment_status: string | null
          ref_paiement: string | null
          reserviste_id: string | null
          statut: string
          terrain_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_reservation: string
          heure_debut: string
          id?: string
          montant_total: number
          nombre_heures: number
          payment_details?: Json | null
          payment_ref?: string | null
          payment_status?: string | null
          ref_paiement?: string | null
          reserviste_id?: string | null
          statut: string
          terrain_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_reservation?: string
          heure_debut?: string
          id?: string
          montant_total?: number
          nombre_heures?: number
          payment_details?: Json | null
          payment_ref?: string | null
          payment_status?: string | null
          ref_paiement?: string | null
          reserviste_id?: string | null
          statut?: string
          terrain_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_reserviste_id_fkey"
            columns: ["reserviste_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_terrain_id_fkey"
            columns: ["terrain_id"]
            isOneToOne: false
            referencedRelation: "terrains"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations_pending: {
        Row: {
          created_at: string | null
          id: string
          payment_details: Json | null
          payment_ref: string | null
          payment_status: string | null
          ref_command: string
          reservation_data: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_ref?: string | null
          payment_status?: string | null
          ref_command: string
          reservation_data: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_ref?: string | null
          payment_status?: string | null
          ref_command?: string
          reservation_data?: Json
        }
        Relationships: []
      }
      terrain_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number | null
          terrain_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating?: number | null
          terrain_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number | null
          terrain_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terrain_ratings_terrain_id_fkey"
            columns: ["terrain_id"]
            isOneToOne: false
            referencedRelation: "terrains"
            referencedColumns: ["id"]
          },
        ]
      }
      terrains: {
        Row: {
          created_at: string | null
          description: string | null
          heure_debut_nuit: string
          heure_fin_nuit: string
          id: string
          latitude: number | null
          localisation: string | null
          longitude: number | null
          nom: string
          numero_wave: string
          prix_jour: number
          prix_nuit: number
          proprietaire_id: string | null
          region_id: string | null
          taille: string
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          heure_debut_nuit: string
          heure_fin_nuit: string
          id?: string
          latitude?: number | null
          localisation?: string | null
          longitude?: number | null
          nom: string
          numero_wave: string
          prix_jour: number
          prix_nuit: number
          proprietaire_id?: string | null
          region_id?: string | null
          taille: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          heure_debut_nuit?: string
          heure_fin_nuit?: string
          id?: string
          latitude?: number | null
          localisation?: string | null
          longitude?: number | null
          nom?: string
          numero_wave?: string
          prix_jour?: number
          prix_nuit?: number
          proprietaire_id?: string | null
          region_id?: string | null
          taille?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terrains_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terrains_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terrains_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          id: string
          nom: string
          region_id: string | null
        }
        Insert: {
          id?: string
          nom: string
          region_id?: string | null
        }
        Update: {
          id?: string
          nom?: string
          region_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      send_welcome_email: {
        Args: {
          email: string
          password: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
