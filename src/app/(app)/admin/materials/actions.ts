"use server";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Nhập danh mục vật tư: mỗi dòng "Mã<TAB>Tên<TAB>ĐVT" (dán từ Excel). Trùng mã thì cập nhật. */
export async function importMaterials(_: unknown, fd: FormData): Promise<{ ok?: string; error?: string }> {
  await requireProfile(["admin"]);
  const text = String(fd.get("data") ?? "");
  const map = new Map<string, { code: string; name: string; unit: string | null; is_active: boolean; updated_at: string }>();
  const now = new Date().toISOString();
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(/\t|;/).map((c) => c.trim());
    if (cols.length < 2 || !cols[0] || !cols[1]) continue;
    if (/^m[aã]/i.test(cols[0]) && /t[eê]n/i.test(cols[1])) continue; // dòng tiêu đề
    map.set(cols[0], { code: cols[0], name: cols[1], unit: cols[2] || null, is_active: true, updated_at: now });
  }
  const rows = Array.from(map.values());
  if (!rows.length) return { error: "Không đọc được dòng nào. Mỗi dòng: Mã [Tab] Tên [Tab] ĐVT" };
  const supabase = await createClient();
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from("materials").upsert(rows.slice(i, i + 500), { onConflict: "code" });
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/materials");
  return { ok: `Đã nhập ${rows.length} vật tư` };
}

export async function deleteMaterial(code: string) {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("code", code);
  revalidatePath("/admin/materials");
  return error ? { error: error.message } : { ok: "Đã xóa" };
}
