// Database types for the tables in supabase/migrations. Keep in sync with the SQL.
// You can regenerate them with: npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          auto_scans: boolean;
          alerts_email: string | null;
          alert_new_critical: boolean;
          alert_site_down: boolean;
          created_at: string;
        };
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; created_at?: string };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          auto_scans?: boolean;
          alerts_email?: string | null;
          alert_new_critical?: boolean;
          alert_site_down?: boolean;
        };
        Relationships: [];
      };
      sites: {
        Row: { id: string; user_id: string; name: string; url: string; created_at: string };
        Insert: { id?: string; user_id: string; name: string; url: string; created_at?: string };
        Update: { name?: string; url?: string };
        Relationships: [];
      };
      scans: {
        Row: {
          id: string;
          site_id: string;
          user_id: string;
          source: string;
          score: number;
          pages: number;
          duration_ms: number;
          response_ms: number | null;
          status_code: number | null;
          issues: unknown;
          changes: unknown;
          report: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          user_id?: string;
          source?: string;
          score: number;
          pages?: number;
          duration_ms?: number;
          response_ms?: number | null;
          status_code?: number | null;
          issues?: unknown;
          changes?: unknown;
          report?: unknown;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      monitors: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          target: string;
          interval_minutes: number;
          ports: number[];
          last_checked_at: string | null;
          last_status: string | null;
          last_result: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type: string;
          target: string;
          interval_minutes?: number;
          ports?: number[];
          last_checked_at?: string | null;
          last_status?: string | null;
          last_result?: unknown;
          created_at?: string;
        };
        Update: {
          interval_minutes?: number;
          ports?: number[];
          last_checked_at?: string | null;
          last_status?: string | null;
          last_result?: unknown;
        };
        Relationships: [];
      };
      monitor_checks: {
        Row: { id: number; monitor_id: string; user_id: string; checked_at: string; ok: boolean; status: string; response_ms: number | null };
        Insert: { monitor_id: string; user_id: string; checked_at?: string; ok: boolean; status: string; response_ms?: number | null };
        Update: Record<string, never>;
        Relationships: [];
      };
      contact_messages: {
        Row: { id: string; name: string; email: string; message: string; created_at: string };
        Insert: { id?: string; name: string; email: string; message: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      monitor_stats: { Args: Record<string, never>; Returns: { monitor_id: string; total: number; ok_count: number }[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Site = Database["public"]["Tables"]["sites"]["Row"];
