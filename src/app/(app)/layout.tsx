import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { allowedMaterialApps } from "@/lib/material/access";
import { MATERIAL_APPS } from "@/lib/material/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const p = await requireProfile();
  if (p.must_change_password) redirect("/change-password");
  const apps = (await allowedMaterialApps(p)).map((k) => ({ href: `/vat-tu/${k}`, label: MATERIAL_APPS[k].label }));
  return <AppShell user={{ full_name: p.full_name, msnv: p.msnv, role: p.role }} materialApps={apps}>{children}</AppShell>;
}
