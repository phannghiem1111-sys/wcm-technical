import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadInspection } from "@/lib/inspection-data";
import { InspectionPdf, type PdfImage } from "@/lib/pdf/inspection-pdf";

async function fetchImage(url?: string): Promise<PdfImage | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const type = res.headers.get("content-type") ?? "";
    return { data: Buffer.from(await res.arrayBuffer()), format: type.includes("png") ? "png" : "jpg" };
  } catch {
    return undefined;
  }
}

/** Tạo PDF biên bản (dùng chung cho tải về và gửi mail). Trả null nếu không có quyền/không tồn tại. */
export async function renderInspectionPdf(supabase: SupabaseClient, id: string) {
  const data = await loadInspection(supabase, id);
  if (!data) return null;
  const images = new Map<string, PdfImage>();
  await Promise.all(
    data.photos.slice(0, 150).map(async (p) => {
      const img = await fetchImage(p.url);
      if (img) images.set(p.path, img);
    }),
  );
  const [sigI, sigS] = await Promise.all([fetchImage(data.signatureUrls.inspector), fetchImage(data.signatureUrls.store)]);
  const buffer = await renderToBuffer(
    InspectionPdf({ i: data.inspection, items: data.items, photos: data.photos, images, sig: { inspector: sigI, store: sigS }, approver: data.approver }),
  );
  return { buffer, inspection: data.inspection };
}
