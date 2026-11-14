// Database types for the tables in supabase/migrations. Keep in sync with the SQL.
// You can regenerate them with: npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; created_at: string };
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; created_at?: string };
        Update: { full_name?: string | null; avatar_url?: string | null };
        Relationships: [];
      };
      sites: {
        Row: { id: string; user_id: string; name: string; url: string; created_at: string };
        Insert: { id?: string; user_id: string; name: string; url: string; created_at?: string };
        Update: { name?: string; url?: string };
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Site = Database["public"]["Tables"]["sites"]["Row"];
