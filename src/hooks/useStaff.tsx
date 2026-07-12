import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  category: string;
  bio: string | null;
  photo_url: string | null;
  whatsapp_number: string | null;
  email: string | null;
  specialties: string[] | null;
  years_experience: number | null;
  is_bookable: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export function useStaff(opts?: { activeOnly?: boolean; category?: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any).from("staff_members").select("*").order("sort_order").order("name");
    if (opts?.activeOnly) query = query.eq("is_active", true);
    if (opts?.category) query = query.eq("category", opts.category);
    const { data } = await query;
    setStaff((data as StaffMember[]) || []);
    setLoading(false);
  }, [opts?.activeOnly, opts?.category]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { staff, loading, refresh };
}

export function buildWhatsAppLink(number: string | null | undefined, message: string) {
  if (!number) return null;
  const clean = number.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
