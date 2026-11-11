import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PlanForm } from "./plan-form";

export const metadata = { title: "Tạo kế hoạch" };

export default async function NewPlanPage() {
  await requireProfile(["admin", "truong_phong", "truong_bo_phan", "doi_truong"]);
  const supabase = await createClient();
  const { data: regions } = await supabase.from("regions").select("id, name").order("id");
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Tạo kế hoạch kiểm tra" desc="Cửa hàng được phân công tự động cho nhân viên phụ trách" />
      <Card><CardContent className="pt-5"><PlanForm regions={regions ?? []} /></CardContent></Card>
    </div>
  );
}
