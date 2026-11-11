/** Đọc biến môi trường Supabase, bỏ khoảng trắng/xuống dòng/dấu nháy thừa khi dán trên Vercel. */
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const serviceRoleKey = () => clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Trả về thông báo lỗi nếu biến môi trường bị dán sai (ví dụ dấu chấm tròn ẩn •). */
export function envProblem(): string | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trên Vercel";
  if (/[^\x20-\x7E]/.test(SUPABASE_ANON_KEY) || /[^\x20-\x7E]/.test(SUPABASE_URL))
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY hoặc URL trên Vercel chứa ký tự lạ (•). Hãy dán lại giá trị thật rồi Redeploy";
  return null;
}
