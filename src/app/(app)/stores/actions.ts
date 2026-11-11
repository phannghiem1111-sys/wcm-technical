"use server";
import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

export type ActionState = { error?: string; ok?: string } | undefined;

async function lookups() {
  const admin = createAdminClient();
  const [{ data: regions }, { data: people }] = await Promise.all([
    admin.from("regions").select("id, code"),
    admin.from("profiles").select("id, msnv"),
  ]);
  return {
    region: new Map((regions ?? []).map((r) => [r.code.toUpperCase(), r.id as number])),
    person: new Map((people ?? []).map((p) => [p.msnv.toUpperCase(), p.id as string])),
  };
}

export async function saveStore(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile(["admin", "truong_bo_phan", "doi_truong"]);
  const supabase = await createClient();
  const { person } = await lookups();
  const id = String(fd.get("id") ?? "");
  const lead = String(fd.get("team_lead_msnv") ?? "").trim().toUpperCase();
  const staff = String(fd.get("staff_msnv") ?? "").trim().toUpperCase();
  if (lead && !person.has(lead)) return { error: `Không tìm thấy MSNV đội trưởng ${lead}` };
  if (staff && !person.has(staff)) return { error: `Không tìm thấy MSNV nhân viên ${staff}` };
  const row = {
    code: String(fd.get("code") ?? "").trim().toUpperCase(),
    name: String(fd.get("name") ?? "").trim(),
    address: String(fd.get("address") ?? "").trim() || null,
    province: String(fd.get("province") ?? "").trim() || null,
    region_id: fd.get("region_id") ? Number(fd.get("region_id")) : null,
    open_date: String(fd.get("open_date") ?? "") || null,
    team_lead_id: lead ? person.get(lead) : null,
    staff_id: staff ? person.get(staff) : null,
    is_active: fd.get("is_active") !== "off",
  };
  if (!row.code || !row.name) return { error: "Nhập mã và tên cửa hàng" };
  const { error } = id ? await supabase.from("stores").update(row).eq("id", id) : await supabase.from("stores").insert(row);
  if (error) return { error: error.code === "23505" ? "Mã cửa hàng đã tồn tại" : error.message };
  revalidatePath("/stores");
  return { ok: "Đã lưu cửa hàng" };
}

const pick = (r: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) { const v = r[k]; if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim(); }
  return "";
};

function toDate(v: string) {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const n = Number(v);
  if (!Number.isNaN(n) && n > 20000) return new Date(Math.round((n - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  return null;
}

export async function importStores(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile(["admin"]);
  const file = fd.get("file") as File | null;
  if (!file || !file.size) return { error: "Chọn file Excel/CSV" };
  const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer", cellDates: false });
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { raw: false });
  const { region, person } = await lookups();
  const records = rows.map((r) => ({
    code: pick(r, "code", "Mã CH", "ma_ch", "MA_CH").toUpperCase(),
    name: pick(r, "name", "Tên CH", "ten_ch", "TEN_CH"),
    address: pick(r, "address", "Địa chỉ", "dia_chi") || null,
    province: pick(r, "province", "Tỉnh", "tinh") || null,
    region_id: region.get(pick(r, "region_code", "Khu vực", "khu_vuc").toUpperCase()) ?? null,
    team_lead_id: person.get(pick(r, "team_lead_msnv", "MSNV đội trưởng").toUpperCase()) ?? null,
    staff_id: person.get(pick(r, "staff_msnv", "MSNV nhân viên").toUpperCase()) ?? null,
    open_date: toDate(pick(r, "open_date", "Ngày khai trương")),
    is_active: true,
  })).filter((r) => r.code && r.name);
  if (!records.length) return { error: "File không có dòng hợp lệ (cần cột code, name)" };
  const admin = createAdminClient();
  for (let i = 0; i < records.length; i += 1000) {
    const { error } = await admin.from("stores").upsert(records.slice(i, i + 1000), { onConflict: "code" });
    if (error) return { error: `Lỗi tại dòng ${i + 1}: ${error.message}` };
  }
  revalidatePath("/stores");
  return { ok: `Đã nhập/cập nhật ${records.length} cửa hàng` };
}
