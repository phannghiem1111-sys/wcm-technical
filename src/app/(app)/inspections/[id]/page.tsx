import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown, MapPin, CalendarDays, User, Store, Mail } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupBySection, loadInspection } from "@/lib/inspection-data";
import { BAD_RESULTS, COMPLETION_LABEL, FORM_META, RESULT_LABEL } from "@/lib/constants";
import { fmtDate, fmtDateTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultBadge, ScoreBadge, StatusBadge } from "@/components/result-badge";
import { ReviewActions } from "./review-actions";
import { SendMailButton } from "./send-mail-button";

export const metadata = { title: "Chi tiết biên bản" };

export default async function InspectionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();
  const data = await loadInspection(supabase, id);
  if (!data) notFound();
  const { inspection: i, items, photos, signatureUrls, approver } = data;
  const meta = FORM_META[i.form_type];
  const isMaint = i.form_type === "maintenance";
  const { data: canManage } = await supabase.rpc("can_manage_store", { s_id: i.store_id });
  const canReview = Boolean(canManage) && i.status === "submitted";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" asChild className="-ml-2"><Link href="/inspections"><ArrowLeft /> Kho biên bản</Link></Button>
        <Button asChild><a href={`/api/inspections/${i.id}/pdf`} target="_blank" rel="noopener"><FileDown /> Tải PDF</a></Button>
      </div>

      <Card className="overflow-hidden">
        <div className={cn("flex items-center justify-between px-4 py-3 text-white", meta.color)}>
          <div>
            <div className="text-xs font-semibold uppercase opacity-90">{meta.title}</div>
            <div className="text-lg font-black">{i.code}</div>
          </div>
          <StatusBadge status={i.status} />
        </div>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 font-bold"><Store className="size-4 text-primary" /> {i.store_code} · {i.store_name}</div>
            {i.store_address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4" /> {i.store_address}</div>}
            {i.store_email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4" /> {i.store_email}</div>}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{i.email_status ?? "Chưa gửi mail"}</span><SendMailButton id={i.id} /></div>
            <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" /> Ngày thực hiện: {fmtDate(i.inspection_date)}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><User className="size-4" /> {i.inspector_msnv} – {i.inspector_name}</div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center sm:grid-cols-2">
            <Stat label="Tỷ lệ đạt" value={<ScoreBadge score={i.score} />} />
            <Stat label="Mục đánh giá" value={i.total_items} />
            <Stat label="Lỗi / cần xử lý" value={<span className="text-red-600">{i.fail_items}</span>} />
            <Stat label="Khẩn cấp" value={<span className="text-fuchsia-700">{i.urgent_items}</span>} />
          </div>
        </CardContent>
      </Card>

      {groupBySection(items).map(([section, rows]) => (
        <Card key={section} className="overflow-hidden">
          <div className="bg-zinc-100 px-4 py-3 text-[13px] font-extrabold uppercase tracking-wide">{section}</div>
          <div className="divide-y">
            {rows.map((r, idx) => {
              const ph = photos.filter((p) => p.item_key === r.item_key);
              const bad = r.result && BAD_RESULTS.includes(r.result);
              return (
                <div key={r.id} className={cn("space-y-2 p-4", bad && "bg-red-50/40")}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold"><span className="mr-1.5 text-zinc-400">{idx + 1}.</span>{r.item_text}</p>
                    <ResultBadge result={r.result} />
                  </div>
                  {isMaint && (
                    <div className="grid gap-1 rounded-xl bg-zinc-50 p-3 text-xs sm:grid-cols-2">
                      {r.model && <div><b>Model:</b> {r.model}</div>}
                      {r.before_status && <div><b>Trước BT:</b> {RESULT_LABEL[r.before_status]}</div>}
                      {r.materials && <div><b>Vật tư:</b> {r.materials}</div>}
                      {r.completion && <div><b>Hoàn thành:</b> {COMPLETION_LABEL[r.completion]}</div>}
                      {r.work_done && <div className="sm:col-span-2 whitespace-pre-line"><b>Công việc:</b> {r.work_done}</div>}
                    </div>
                  )}
                  {r.note && <p className="text-sm text-zinc-700"><b>Ghi chú:</b> {r.note}</p>}
                  {r.proposal && <p className="text-sm text-red-700"><b>Đề xuất:</b> {r.proposal}</p>}
                  {ph.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {ph.map((p) => (
                        <a key={p.id} href={p.url} target="_blank" rel="noopener" className="overflow-hidden rounded-lg border bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt={p.caption ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                          <div className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">
                            {p.phase !== "normal" && <b className="mr-1 uppercase">{p.phase === "before" ? "Trước" : "Sau"}</b>}{p.caption || fmtDateTime(p.taken_at)}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle className="text-base">Đánh giá tổng thể & xác nhận</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {i.overall_note && <p className="whitespace-pre-line rounded-xl bg-zinc-50 p-3 text-sm">{i.overall_note}</p>}
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            <Sig title="Nhân viên thực hiện" name={i.inspector_name} url={signatureUrls.inspector} />
            <Sig title="Đại diện cửa hàng" name={i.store_rep_name ?? ""} url={signatureUrls.store} />
          </div>
          {i.approved_at && (
            <div className={cn("rounded-xl p-3 text-sm", i.status === "approved" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800")}>
              <b>{i.status === "approved" ? "Đã duyệt" : "Trả lại"}</b> bởi {approver?.full_name} ({approver?.msnv}) lúc {fmtDateTime(i.approved_at)}
              {i.approval_note && <div className="mt-1">“{i.approval_note}”</div>}
            </div>
          )}
          <ReviewActions id={i.id} canReview={canReview} canDelete={profile.role === "admin"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-2 py-2">
      <div className="text-lg font-black">{value}</div>
      <div className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</div>
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
