import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { loadInspection } from "@/lib/inspection-data";
import { InspectionPdf, type PdfImage } from "@/lib/pdf/inspection-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return new Response("Unauthorized", { status: 401 });

  const data = await loadInspection(supabase, id);
  if (!data) return new Response("Không tìm thấy biên bản", { status: 404 });

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
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.inspection.code}_${data.inspection.store_code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
