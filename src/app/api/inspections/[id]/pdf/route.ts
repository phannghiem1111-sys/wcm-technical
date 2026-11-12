import { createClient } from "@/lib/supabase/server";
import { renderInspectionPdf } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return new Response("Unauthorized", { status: 401 });

  const out = await renderInspectionPdf(supabase, id);
  if (!out) return new Response("Không tìm thấy biên bản", { status: 404 });
  return new Response(new Uint8Array(out.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${out.inspection.code}_${out.inspection.store_code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
