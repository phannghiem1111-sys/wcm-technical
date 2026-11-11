import Link from "next/link";
import { Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { ImportDialog, StoreDialog, type StoreRow } from "./store-dialogs";

export const metadata = { title: "Cửa hàng" };
const PAGE = 40;

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ q?: string; region?: string; page?: string }> }) {
  const sp = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from("stores")
    .select("id, code, name, address, province, region_id, open_date, is_active, regions(name), lead:team_lead_id(msnv, full_name), staff:staff_id(msnv, full_name)", { count: "exact" });
  if (sp.region) q = q.eq("region_id", Number(sp.region));
  if (sp.q) { const s = sp.q.replace(/[%,()]/g, ""); q = q.or(`code.ilike.${s}%,name.ilike.%${s}%,address.ilike.%${s}%`); }
  const [{ data, count }, { data: regions }] = await Promise.all([
    q.order("code").range((page - 1) * PAGE, page * PAGE - 1),
    supabase.from("regions").select("id, name").order("id"),
  ]);
  type R = StoreRow & { regions: { name: string } | null; lead: { msnv: string; full_name: string } | null; staff: { msnv: string; full_name: string } | null };
  const rows = (data ?? []) as unknown as R[];
  const canEdit = ["admin", "truong_bo_phan", "doi_truong"].includes(profile.role);
  const total = count ?? 0;
  const link = (p: number) => `?${new URLSearchParams({ ...(sp.q && { q: sp.q }), ...(sp.region && { region: sp.region }), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Danh mục cửa hàng"
        desc={`${total.toLocaleString("vi-VN")} cửa hàng trong phạm vi quản lý`}
        actions={<>{profile.role === "admin" && <ImportDialog />}{["admin", "truong_bo_phan"].includes(profile.role) && <StoreDialog regions={regions ?? []} />}</>}
      />
      <form className="mb-3 flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={sp.q} placeholder="Mã, tên, địa chỉ..." className="pl-9" /></div>
        <NativeSelect name="region" defaultValue={sp.region ?? ""} className="w-36"><option value="">Khu vực</option>{(regions ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</NativeSelect>
        <Button variant="dark">Lọc</Button>
      </form>
      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((s) => (
          <Card key={s.id} className="flex items-start gap-3 p-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-black text-primary">{s.code}</div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex items-center gap-2"><b className="truncate">{s.name}</b>{!s.is_active && <Badge variant="secondary">Ngưng</Badge>}</div>
              {s.address && <div className="truncate text-xs text-muted-foreground">{s.address}</div>}
              <div className="mt-1 text-xs text-muted-foreground">
                {s.regions?.name ?? "—"}{s.province && ` · ${s.province}`}{s.open_date && ` · KT ${fmtDate(s.open_date)}`}
              </div>
              <div className="text-xs text-muted-foreground">ĐT: {s.lead?.full_name ?? "—"} · NV: {s.staff?.full_name ?? "—"}</div>
            </div>
            {canEdit && <StoreDialog regions={regions ?? []} store={{ ...s, lead_msnv: s.lead?.msnv, staff_msnv: s.staff?.msnv }} />}
          </Card>
        ))}
      </div>
      {rows.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Không có cửa hàng.</p>}
      {total > PAGE && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && <Button variant="outline" asChild><Link href={link(page - 1)}>← Trước</Link></Button>}
          <span className="text-sm font-semibold">Trang {page}/{Math.ceil(total / PAGE)}</span>
          {page * PAGE < total && <Button variant="outline" asChild><Link href={link(page + 1)}>Sau →</Link></Button>}
        </div>
      )}
    </>
  );
}
