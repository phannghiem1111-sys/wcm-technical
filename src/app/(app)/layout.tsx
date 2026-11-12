import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const p = await requireProfile();
  if (p.must_change_password) redirect("/change-password");
  return <AppShell user={{ full_name: p.full_name, msnv: p.msnv, role: p.role }}>{children}</AppShell>;
}
