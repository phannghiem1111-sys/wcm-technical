import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadMaterialReport } from "@/lib/material/data";
import { MaterialPdf } from "@/lib/pdf/material-pdf";
import type { PdfImage } from "@/lib/pdf/inspection-pdf";

async function fetchImage(url?: string): Promise<PdfImage | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    return { data: Buffer.from(await res.arrayBuffer()), format: (res.headers.get("content-type") ?? "").includes("png") ? "png" : "jpg" };
  } catch {
    return undefined;
  }
}

/** PDF biên bản vật tư (tải về + gửi mail). Null nếu không có quyền/không tồn tại. */
export async function renderMaterialPdf(supabase: SupabaseClient, id: string) {
  const data = await loadMaterialReport(supabase, id);
  if (!data) return null;
  const { report, items, urls } = data;
  const [reporter, store] = await Promise.all([
    fetchImage(report.signature_reporter ? urls.get(report.signature_reporter) : undefined),
    fetchImage(report.signature_store ? urls.get(report.signature_store) : undefined),
  ]);
  const buffer = await renderToBuffer(MaterialPdf({ r: report, items, sig: { reporter, store } }));
  return { buffer, report };
}
