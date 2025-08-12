export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          id: string
          message: string | null
          role: string | null
          session_id: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message?: string | null
          role?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message?: string | null
          role?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_orders: {
        Row: {
          actual_delivery_time: string | null
          created_at: string
          current_location_lat: number | null
          current_location_lng: number | null
          delivery_fee: number
          delivery_location_address: string
          delivery_location_lat: number
          delivery_location_lng: number
          delivery_personnel_id: string | null
          distance_km: number
          estimated_delivery_time: string | null
          id: string
          order_id: string
          pickup_location_address: string
          pickup_location_lat: number
          pickup_location_lng: number
          status: string
          tracking_updates: Json | null
          updated_at: string
        }
        Insert: {
          actual_delivery_time?: string | null
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          delivery_fee: number
          delivery_location_address: string
          delivery_location_lat: number
          delivery_location_lng: number
          delivery_personnel_id?: string | null
          distance_km: number
          estimated_delivery_time?: string | null
          id?: string
          order_id: string
          pickup_location_address: string
          pickup_location_lat: number
          pickup_location_lng: number
          status?: string
          tracking_updates?: Json | null
          updated_at?: string
        }
        Update: {
          actual_delivery_time?: string | null
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          delivery_fee?: number
          delivery_location_address?: string
          delivery_location_lat?: number
          delivery_location_lng?: number
          delivery_personnel_id?: string | null
          distance_km?: number
          estimated_delivery_time?: string | null
          id?: string
          order_id?: string
          pickup_location_address?: string
          pickup_location_lat?: number
          pickup_location_lng?: number
          status?: string
          tracking_updates?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_delivery_personnel_id_fkey"
            columns: ["delivery_personnel_id"]
            isOneToOne: false
            referencedRelation: "delivery_personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_personnel: {
        Row: {
          admin_notes: string | null
          constituency: string
          county: string
          created_at: string
          current_location_lat: number | null
          current_location_lng: number | null
          drivers_license_url: string
          email: string
          first_name: string
          id: string
          id_card_url: string
          is_available: boolean
          is_online: boolean
          last_name: string
          phone_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          constituency: string
          county: string
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          drivers_license_url: string
          email: string
          first_name: string
          id?: string
          id_card_url: string
          is_available?: boolean
          is_online?: boolean
          last_name: string
          phone_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          constituency?: string
          county?: string
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          drivers_license_url?: string
          email?: string
          first_name?: string
          id?: string
          id_card_url?: string
          is_available?: boolean
          is_online?: boolean
          last_name?: string
          phone_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      delivery_tracking: {
        Row: {
          accuracy: number | null
          delivery_order_id: string
          delivery_personnel_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          speed: number | null
          timestamp: string
        }
        Insert: {
          accuracy?: number | null
          delivery_order_id: string
          delivery_personnel_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          timestamp?: string
        }
        Update: {
          accuracy?: number | null
          delivery_order_id?: string
          delivery_personnel_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tracking_delivery_personnel_id_fkey"
            columns: ["delivery_personnel_id"]
            isOneToOne: false
            referencedRelation: "delivery_personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      jumia_product_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_data: Json | null
          interaction_type: string
          jumia_product_id: string
          jumia_product_image: string | null
          jumia_product_link: string
          jumia_product_name: string
          jumia_product_price: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          jumia_product_id: string
          jumia_product_image?: string | null
          jumia_product_link: string
          jumia_product_name: string
          jumia_product_price: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          jumia_product_id?: string
          jumia_product_image?: string | null
          jumia_product_link?: string
          jumia_product_name?: string
          jumia_product_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jumia_product_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          product_image: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          total_price: number
          unit_price: number
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          billing_address: Json
          created_at: string | null
          currency: string | null
          customer_email: string
          customer_phone: string | null
          delivery_fee: number | null
          delivery_location_address: string | null
          delivery_location_lat: number | null
          delivery_location_lng: number | null
          delivery_type: string | null
          discount_amount: number | null
          estimated_delivery_date: string | null
          fulfillment_method: string
          id: string
          mpesa_transaction_id: string | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          pickup_location: string | null
          pickup_phone: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_delivery_date?: string | null
          billing_address?: Json
          created_at?: string | null
          currency?: string | null
          customer_email: string
          customer_phone?: string | null
          delivery_fee?: number | null
          delivery_location_address?: string | null
          delivery_location_lat?: number | null
          delivery_location_lng?: number | null
          delivery_type?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          fulfillment_method: string
          id?: string
          mpesa_transaction_id?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_location?: string | null
          pickup_phone?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_delivery_date?: string | null
          billing_address?: Json
          created_at?: string | null
          currency?: string | null
          customer_email?: string
          customer_phone?: string | null
          delivery_fee?: number | null
          delivery_location_address?: string | null
          delivery_location_lat?: number | null
          delivery_location_lng?: number | null
          delivery_type?: string | null
          discount_amount?: number | null
          estimated_delivery_date?: string | null
          fulfillment_method?: string
          id?: string
          mpesa_transaction_id?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_location?: string | null
          pickup_phone?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          id: string
          order_id: string
          payment_method: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          id?: string
          order_id: string
          payment_method?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          id?: string
          order_id?: string
          payment_method?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      points_config: {
        Row: {
          created_at: string
          first_purchase_points: number
          id: string
          point_value_kes: number
          points_expiry_months: number
          quiz_completion_points: number
          referral_purchase_points: number
          referral_signup_points: number
          spending_points_per_100_kes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_purchase_points?: number
          id?: string
          point_value_kes?: number
          points_expiry_months?: number
          quiz_completion_points?: number
          referral_purchase_points?: number
          referral_signup_points?: number
          spending_points_per_100_kes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_purchase_points?: number
          id?: string
          point_value_kes?: number
          points_expiry_months?: number
          quiz_completion_points?: number
          referral_purchase_points?: number
          referral_signup_points?: number
          spending_points_per_100_kes?: number
          updated_at?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          points: number
          reason: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points: number
          reason: string
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points?: number
          reason?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          attribute_name: string
          attribute_value: string
          created_at: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          attribute_name: string
          attribute_value: string
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          attribute_name?: string
          attribute_value?: string
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_description: string | null
          image_url: string
          is_main_image: boolean
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_description?: string | null
          image_url: string
          is_main_image?: boolean
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_description?: string | null
          image_url?: string
          is_main_image?: boolean
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_verified_purchase: boolean | null
          product_id: string | null
          rating: number
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating: number
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          banned: boolean
          banned_reason: string | null
          brand: string | null
          category: string
          commission_percentage: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_size: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          main_category: string | null
          main_image: string | null
          name: string
          original_price: number | null
          pickup_location: string | null
          pickup_phone: string | null
          pickup_phone_number: string | null
          price: number
          processor: string | null
          ram: string | null
          rating: number | null
          review_count: number | null
          sku: string | null
          specifications: Json | null
          stock_quantity: number | null
          storage: string | null
          sub_subcategory: string | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          banned?: boolean
          banned_reason?: string | null
          brand?: string | null
          category: string
          commission_percentage?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_size?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          main_category?: string | null
          main_image?: string | null
          name: string
          original_price?: number | null
          pickup_location?: string | null
          pickup_phone?: string | null
          pickup_phone_number?: string | null
          price: number
          processor?: string | null
          ram?: string | null
          rating?: number | null
          review_count?: number | null
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          storage?: string | null
          sub_subcategory?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          banned?: boolean
          banned_reason?: string | null
          brand?: string | null
          category?: string
          commission_percentage?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_size?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          main_category?: string | null
          main_image?: string | null
          name?: string
          original_price?: number | null
          pickup_location?: string | null
          pickup_phone?: string | null
          pickup_phone_number?: string | null
          price?: number
          processor?: string | null
          ram?: string | null
          rating?: number | null
          review_count?: number | null
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          storage?: string | null
          sub_subcategory?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_setup_completed: boolean | null
          admin_notes: string | null
          age: number | null
          avatar_url: string | null
          business_type: string | null
          chat_count: number | null
          company: string | null
          company_website: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          location: string | null
          phone_number: string | null
          plan: string | null
          plan_expiry: string | null
          preferences: Json | null
          rejection_reason: string | null
          role: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          account_setup_completed?: boolean | null
          admin_notes?: string | null
          age?: number | null
          avatar_url?: string | null
          business_type?: string | null
          chat_count?: number | null
          company?: string | null
          company_website?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          location?: string | null
          phone_number?: string | null
          plan?: string | null
          plan_expiry?: string | null
          preferences?: Json | null
          rejection_reason?: string | null
          role?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          account_setup_completed?: boolean | null
          admin_notes?: string | null
          age?: number | null
          avatar_url?: string | null
          business_type?: string | null
          chat_count?: number | null
          company?: string | null
          company_website?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          phone_number?: string | null
          plan?: string | null
          plan_expiry?: string | null
          preferences?: Json | null
          rejection_reason?: string | null
          role?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      shipping: {
        Row: {
          actual_delivery_date: string | null
          carrier: string
          created_at: string | null
          estimated_delivery_date: string | null
          id: string
          order_id: string
          shipping_method: string
          status: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          carrier: string
          created_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          order_id: string
          shipping_method: string
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          carrier?: string
          created_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          order_id?: string
          shipping_method?: string
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      style_quiz_questions: {
        Row: {
          created_at: string
          gender: string
          id: string
          is_active: boolean
          options: Json
          question_order: number
          question_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gender: string
          id?: string
          is_active?: boolean
          options: Json
          question_order: number
          question_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gender?: string
          id?: string
          is_active?: boolean
          options?: Json
          question_order?: number
          question_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          phone_number: string
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          phone_number: string
          request_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          phone_number?: string
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          module_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          module_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          module_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_cart_items: {
        Row: {
          added_at: string | null
          id: string
          price: number | null
          product_category: string | null
          product_id: string
          product_name: string | null
          quantity: number | null
          removed_at: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          price?: number | null
          product_category?: string | null
          product_id: string
          product_name?: string | null
          quantity?: number | null
          removed_at?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          price?: number | null
          product_category?: string | null
          product_id?: string
          product_name?: string | null
          quantity?: number | null
          removed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "user_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_likes: {
        Row: {
          created_at: string | null
          id: string
          product_category: string | null
          product_id: string
          product_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_category?: string | null
          product_id: string
          product_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_category?: string | null
          product_id?: string
          product_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "user_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          available_points: number
          created_at: string
          id: string
          lifetime_earned: number
          lifetime_redeemed: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_redeemed?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_redeemed?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_product_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_product_interactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_interactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_popularity"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "user_product_interactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          id: string
          price: number | null
          product_category: string | null
          product_id: string
          product_name: string | null
          purchase_date: string | null
          quantity: number | null
          user_id: string | null
        }
        Insert: {
          id?: string
          price?: number | null
          product_category?: string | null
          product_id: string
          product_name?: string | null
          purchase_date?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Update: {
          id?: string
          price?: number | null
          product_category?: string | null
          product_id?: string
          product_name?: string | null
          purchase_date?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_responses: {
        Row: {
          completed_at: string
          id: string
          question_id: string
          selected_option: Json
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          question_id: string
          selected_option: Json
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          question_id?: string
          selected_option?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "style_quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referrals: {
        Row: {
          created_at: string
          id: string
          purchase_points_awarded: boolean
          referral_code: string
          referred_id: string
          referrer_id: string
          signup_points_awarded: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          purchase_points_awarded?: boolean
          referral_code: string
          referred_id: string
          referrer_id: string
          signup_points_awarded?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          purchase_points_awarded?: boolean
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          signup_points_awarded?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_searches: {
        Row: {
          created_at: string | null
          id: string
          search_category: string | null
          search_query: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          search_category?: string | null
          search_query: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          search_category?: string | null
          search_query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean
          billing_cycle: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          price_kes: number | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          billing_cycle?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type: string
          price_kes?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          billing_cycle?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          price_kes?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_training_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_application_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          step_data: Json | null
          step_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          step_data?: Json | null
          step_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          step_data?: Json | null
          step_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_commissions: {
        Row: {
          category: string
          created_at: string
          freemium_commission_rate: number
          id: string
          premium_commission_rate: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          freemium_commission_rate?: number
          id?: string
          premium_commission_rate?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          freemium_commission_rate?: number
          id?: string
          premium_commission_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      vendor_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          expires_at: string | null
          id: string
          monthly_fee_usd: number
          plan_type: string
          started_at: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          monthly_fee_usd?: number
          plan_type: string
          started_at?: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          monthly_fee_usd?: number
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          mpesa_number: string
          processed_at: string | null
          status: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          mpesa_number: string
          processed_at?: string | null
          status?: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          mpesa_number?: string
          processed_at?: string | null
          status?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      product_popularity: {
        Row: {
          brand: string | null
          category: string | null
          conversion_rate: number | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          last_updated_at: string | null
          like_count: number | null
          main_image: string | null
          name: string | null
          original_price: number | null
          price: number | null
          product_id: string | null
          purchase_count: number | null
          rating: number | null
          review_count: number | null
          sku: string | null
          specifications: Json | null
          stock_quantity: number | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string | null
          vendor_id: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_vendor_application: {
        Args: { application_id: string; admin_notes?: string }
        Returns: boolean
      }
      award_spending_points: {
        Args: { user_id_param: string; amount_spent: number }
        Returns: undefined
      }
      calculate_delivery_fee: {
        Args: { distance_km: number }
        Returns: number
      }
      calculate_distance_km: {
        Args: { lat1: number; lng1: number; lat2: number; lng2: number }
        Returns: number
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_vendor_applications_with_emails: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone_number: string
          company: string
          business_type: string
          status: string
          created_at: string
        }[]
      }
      has_admin_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      has_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_vendor_order: {
        Args:
          | { order_id: number }
          | {
              order_row: Database["public"]["Tables"]["orders"]["Row"]
              vendor: string
            }
        Returns: boolean
      }
      redeem_points: {
        Args: {
          user_id_param: string
          points_to_redeem: number
          order_id_param?: string
        }
        Returns: boolean
      }
      reject_vendor_application: {
        Args: { application_id: string; admin_notes?: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
