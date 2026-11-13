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

/** Đổi link Google Sheet (…/edit#gid=…) thành link tải CSV. */
function sheetCsvUrl(link: string) {
  const id = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) return null;
  if (/\/d\/e\//.test(link)) return link.includes("output=csv") ? link : link.replace(/\/pubhtml.*$/, "/pub?output=csv");
  const gid = link.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.map((r) => r.map((x) => x.trim()));
}

const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

/** Đồng bộ danh mục vật tư từ Google Sheet (sheet chia sẻ "Bất kỳ ai có đường liên kết"). */
export async function syncMaterialsFromSheet(_: unknown, fd: FormData): Promise<{ ok?: string; error?: string }> {
  await requireProfile(["admin"]);
  const link = String(fd.get("url") ?? "").trim() || process.env.MATERIALS_SHEET_URL || "";
  const url = sheetCsvUrl(link);
  if (!url) return { error: "Link Google Sheet không hợp lệ" };
  let text: string;
  try {
    const res = await fetch(url, { cache: "no-store", redirect: "follow" });
    text = await res.text();
    if (!res.ok || /^\s*<(!doctype|html)/i.test(text)) return { error: "Không đọc được sheet. Bấm Chia sẻ → \"Bất kỳ ai có đường liên kết\" → Người xem, rồi thử lại." };
  } catch (e) {
    return { error: "Không kết nối được Google Sheet: " + (e instanceof Error ? e.message : "") };
  }
  const rows = parseCsv(text).filter((r) => r.some(Boolean));
  if (!rows.length) return { error: "Sheet trống" };
  // Tìm dòng tiêu đề và cột Mã / Tên / ĐVT trong 10 dòng đầu; không có thì lấy 3 cột đầu
  let hi = -1, ci = 0, ni = 1, ui = 2;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const h = rows[i].map(strip);
    const c = h.findIndex((x) => /^ma( vat tu| vt)?$|^mvt$|^ma vat tu|^code/.test(x));
    const n = h.findIndex((x) => /^ten( vat tu| vt)?$|^ten vat tu|^name/.test(x));
    if (c >= 0 && n >= 0) { hi = i; ci = c; ni = n; ui = h.findIndex((x) => /^dvt$|^don vi|^dv tinh|^unit/.test(x)); break; }
  }
  const now = new Date().toISOString();
  const map = new Map<string, { code: string; name: string; unit: string | null; is_active: boolean; updated_at: string }>();
  rows.slice(hi + 1).forEach((r) => {
    const code = r[ci]?.trim(), name = r[ni]?.trim();
    if (code && name) map.set(code, { code, name, unit: (ui >= 0 ? r[ui]?.trim() : "") || null, is_active: true, updated_at: now });
  });
  const list = Array.from(map.values());
  if (!list.length) return { error: "Không tìm thấy cột Mã và Tên vật tư trong sheet" };
  const supabase = await createClient();
  for (let i = 0; i < list.length; i += 500) {
    const { error } = await supabase.from("materials").upsert(list.slice(i, i + 500), { onConflict: "code" });
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/materials");
  return { ok: `Đã đồng bộ ${list.length} vật tư từ Google Sheet` };
}

export async function deleteMaterial(code: string) {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("code", code);
  revalidatePath("/admin/materials");
  return error ? { error: error.message } : { ok: "Đã xóa" };
}
