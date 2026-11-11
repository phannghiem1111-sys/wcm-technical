import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { applyInspectionFilters, type InspectionFilters } from "@/lib/filters";
import { FORM_META, RESULT_LABEL, STATUS_LABEL, type FormType, type ItemResult } from "@/lib/constants";

export const runtime = "nodejs";

type Row = { id: string; code: string; form_type: FormType; status: string; inspection_date: string; store_code: string; store_name: string; region_name: string | null; province: string | null; inspector_msnv: string; inspector_name: string; total_items: number; pass_items: number; fail_items: number; urgent_items: number; score: number; overall_note: string | null };

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return new Response("Unauthorized", { status: 401 });

  const f = Object.fromEntries(new URL(req.url).searchParams) as InspectionFilters;
  const { data } = await applyInspectionFilters(supabase, f).order("inspection_date", { ascending: false }).limit(5000);
  const rows = (data ?? []) as unknown as Row[];

  const summary = rows.map((r, i) => ({
    STT: i + 1, "Số biên bản": r.code, "Loại": FORM_META[r.form_type].short, "Ngày": r.inspection_date, "Mã CH": r.store_code, "Tên CH": r.store_name,
    "Khu vực": r.region_name ?? "", "Tỉnh": r.province ?? "", "MSNV": r.inspector_msnv, "Nhân viên": r.inspector_name, "Số mục": r.total_items,
    "Đạt": r.pass_items, "Lỗi": r.fail_items, "Khẩn cấp": r.urgent_items, "Tỷ lệ đạt (%)": Number(r.score), "Trạng thái": STATUS_LABEL[r.status], "Ghi chú": r.overall_note ?? "",
  }));

  // Chi tiết lỗi
  const ids = rows.map((r) => r.id);
  const defects: Record<string, unknown>[] = [];
  for (let k = 0; k < ids.length; k += 200) {
    const { data: items } = await supabase.from("inspection_items")
      .select("inspection_id, section_title, item_text, result, note, proposal")
      .in("inspection_id", ids.slice(k, k + 200))
      .in("result", ["fail", "monitor", "urgent", "maintenance", "broken"]);
    const byId = new Map(rows.map((r) => [r.id, r]));
    (items ?? []).forEach((it) => {
      const r = byId.get(it.inspection_id)!;
      defects.push({ "Số biên bản": r.code, "Ngày": r.inspection_date, "Mã CH": r.store_code, "Nhóm": it.section_title, "Hạng mục": it.item_text, "Kết quả": RESULT_LABEL[it.result as ItemResult], "Ghi chú": it.note ?? "", "Đề xuất xử lý": it.proposal ?? "" });
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Bien ban");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defects), "Chi tiet loi");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const name = `WCM_BienBan_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
