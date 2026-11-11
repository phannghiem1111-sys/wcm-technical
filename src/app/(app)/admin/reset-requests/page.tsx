import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestActions } from "./request-actions";

export const metadata = { title: "Yêu cầu cấp lại mật khẩu" };

export default async function ResetRequestsPage() {
  await requireProfile(["admin", "doi_truong"]);
  const supabase = await createClient();
  const { data } = await supabase.from("password_reset_requests").select("*").order("status").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <PageHeader title="Yêu cầu cấp lại mật khẩu" desc="Từ chức năng “Quên mật khẩu” trên màn hình đăng nhập" />
      <div className="space-y-2">
        {(data ?? []).map((r) => (
          <Card key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <div className="flex-1 text-sm">
              <div className="font-bold">{r.msnv} {r.phone && <span className="font-normal text-muted-foreground">· {r.phone}</span>}</div>
              <div className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}{r.note && ` · ${r.note}`}</div>
            </div>
            {r.status === "pending" ? <RequestActions id={r.id} msnv={r.msnv} /> : <Badge variant={r.status === "done" ? "success" : "secondary"}>{r.status === "done" ? "Đã cấp" : "Từ chối"}</Badge>}
          </Card>
        ))}
        {(data ?? []).length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Không có yêu cầu.</p>}
      </div>
    </>
  );
}
