import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/constants";

export type Profile = {
  id: string;
  msnv: string;
  full_name: string;
  title: string | null;
  role: AppRole;
  region_id: number | null;
  province: string | null;
  team_lead_id: string | null;
  phone: string | null;
  status: "active" | "locked";
  regions?: { name: string } | null;
};

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;
  const { data } = await supabase.from("profiles").select("*, regions(name)").eq("id", uid).single();
  return (data as Profile) ?? null;
});

export async function requireProfile(roles?: AppRole[]) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/login?locked=1");
  if (roles && !roles.includes(profile.role)) redirect("/?denied=1");
  return profile;
}

export const isManager = (r: AppRole) => r !== "nhan_vien";
