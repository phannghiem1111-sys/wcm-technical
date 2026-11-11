import { LogOut } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL } from "@/lib/constants";
import { fmtDateTime } from "@/lib/utils";
import { logout } from "@/app/login/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallButton } from "@/components/install-button";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Tài khoản" };

export default async function ProfilePage() {
  const p = await requireProfile();
  const supabase = await createClient();
  const [{ data: lead }, { data: logs }] = await Promise.all([
    p.team_lead_id ? supabase.from("profiles").select("msnv, full_name").eq("id", p.team_lead_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("login_logs").select("created_at, success").eq("user_id", p.id).order("created_at", { ascending: false }).limit(5),
  ]);
  const info: [string, string | null | undefined][] = [
    ["MSNV", p.msnv], ["Họ tên", p.full_name], ["Chức danh", p.title], ["Vai trò", ROLE_LABEL[p.role]], ["Khu vực", p.regions?.name],
    ["Tỉnh phụ trách", p.province], ["Đội trưởng quản lý", lead ? `${lead.msnv} – ${lead.full_name}` : null], ["Trạng thái", p.status === "active" ? "Đang hoạt động" : "Đã khóa"],
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Tài khoản của tôi" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Thông tin nhân viên</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {info.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b pb-2 last:border-0"><span className="text-muted-foreground">{k}</span><b className="text-right">{v || "—"}</b></div>)}
            <div className="pt-2 text-xs text-muted-foreground">Đăng nhập gần đây: {(logs ?? []).map((l) => fmtDateTime(l.created_at)).join(" · ") || "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Đổi mật khẩu</CardTitle></CardHeader>
          <CardContent><PasswordForm /></CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <InstallButton className="w-full" />
        <form action={logout}><Button variant="outline" className="w-full text-red-600"><LogOut /> Đăng xuất</Button></form>
      </div>
    </div>
  );
}
