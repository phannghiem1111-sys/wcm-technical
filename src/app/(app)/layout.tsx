import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const p = await requireProfile();
  return <AppShell user={{ full_name: p.full_name, msnv: p.msnv, role: p.role }}>{children}</AppShell>;
}
