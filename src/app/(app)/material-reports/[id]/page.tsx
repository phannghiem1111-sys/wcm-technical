import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown, MapPin, CalendarDays, User, Store, Pencil, Ticket } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadMaterialReport } from "@/lib/material/data";
import { MR_COLOR } from "@/lib/material/constants";
import { fmtDateTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialMailButton } from "./mail-button";

export const metadata = { title: "Biên bản vật tư" };

export default async function MaterialReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();
  const data = await loadMaterialReport(supabase, id);
  if (!data) notFound();
  const { report: r, items, urls } = data;
  const canEdit = r.reporter_id === profile.id || profile.role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" asChild className="-ml-2"><Link href="/material-reports"><ArrowLeft /> Biên bản vật tư</Link></Button>
        <div className="flex gap-2">
          {canEdit && <Button variant="outline" asChild><Link href={`/material-reports/${r.id}/edit`}><Pencil /> Sửa</Link></Button>}
          <Button asChild><a href={`/api/material-reports/${r.id}/pdf`} target="_blank" rel="noopener"><FileDown /> Tải PDF</a></Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className={cn("px-4 py-3 text-white", MR_COLOR)}>
          <div className="text-xs font-semibold uppercase opacity-90">Biên bản vật tư</div>
          <div className="text-lg font-black">{r.code}</div>
          <div className="text-sm opacity-90">V/v: {r.subject}</div>
        </div>
        <CardContent className="space-y-1.5 pt-4 text-sm">
          <div className="flex items-center gap-2 font-bold"><Store className="size-4 text-primary" /> {r.store_code} · {r.store_name}</div>
          {r.store_address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4" /> {r.store_address}</div>}
          <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" /> {fmtDateTime(r.report_at)}</div>
          <div className="flex items-center gap-2 text-muted-foreground"><User className="size-4" /> Người lập: {r.reporter_msnv} – {r.reporter_name} · CHT: {r.store_manager_name || "—"}</div>
          {r.ticket_code && <div className="flex items-center gap-2 text-muted-foreground"><Ticket className="size-4" /> Ticket: {r.ticket_code}</div>}
          <div className="text-muted-foreground"><b>Hạng mục:</b> {r.category === "Khác" ? `Khác: ${r.category_other ?? ""}` : r.category}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{r.email_status ?? "Chưa gửi mail"}</span><MaterialMailButton id={r.id} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Nội dung</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><div className="text-xs font-bold uppercase text-muted-foreground">1. Nội dung sự việc</div><p className="whitespace-pre-line">{r.incident}</p></div>
          <div><div className="text-xs font-bold uppercase text-muted-foreground">2. Biện pháp xử lý</div><p className="whitespace-pre-line">{r.solution}</p></div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-base">3. Vật tư thay thế · {items.length} khoản</CardTitle></CardHeader>
        <div className="divide-y border-t">
          {items.map((x, i) => (
            <div key={x.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-5 text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1"><div className="font-semibold">{x.material_name}</div>{x.material_code && <div className="text-xs text-muted-foreground">{x.material_code}</div>}</div>
              <div className="whitespace-nowrap font-bold">{Number(x.qty)} {x.unit}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">4. Đề xuất xử lý vật tư: <span className="text-primary">{r.proposal}</span></CardTitle></CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ảnh hiện trường</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([["Ảnh trước", r.photos_before], ["Ảnh sau", r.photos_after]] as const).map(([label, list]) => (
            <div key={label}>
              <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">{label}</div>
              {list.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {list.map((p) => (
                    <a key={p} href={urls.get(p)} target="_blank" rel="noopener" className="overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urls.get(p)} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : <span className="text-xs text-zinc-400">Chưa có</span>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ký xác nhận</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-center text-sm">
          <Sig title="Người lập" name={r.reporter_name} url={r.signature_reporter ? urls.get(r.signature_reporter) : undefined} />
          <Sig title="Cửa hàng trưởng" name={r.store_manager_name ?? ""} url={r.signature_store ? urls.get(r.signature_store) : undefined} />
        </CardContent>
      </Card>
    </div>
  );
}

function Sig({ title, name, url }: { title: string; name: string; url?: string }) {
  return (
    <div className="rounded-xl border p-2">
      <div className="text-xs font-bold uppercase text-muted-foreground">{title}</div>
      <div className="flex h-24 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="Chữ ký" className="max-h-24" /> : <span className="text-xs text-zinc-400">(Chưa ký)</span>}
      </div>
      <div className="font-semibold">{name}</div>
    </div>
  );
}
