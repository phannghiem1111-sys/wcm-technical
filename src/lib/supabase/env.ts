/** Đọc biến môi trường Supabase, bỏ khoảng trắng/xuống dòng/dấu nháy thừa khi dán trên Vercel. */
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

// Dự phòng khi biến trên Vercel bị dán sai (•). Đây là URL + anon key CÔNG KHAI (trình duyệt nào cũng thấy),
// an toàn nhờ RLS, KHÔNG phải service_role. Khi env trên Vercel đúng thì dùng env; có thể xóa phần FALLBACK sau.
const FALLBACK_URL = "https://szufvyzjqfoiyyqmdctc.supabase.co";
const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dWZ2eXpqcWZvaXl5cW1kY3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MTA4NjIsImV4cCI6MjEwOTk4Njg2Mn0.VXws0D_z3t_TzX5h6YVkL5F0x3PxjaDHz0H6Tlk5AO0";
const valid = (v: string, min: number) => v.length >= min && !/[^\x20-\x7E]/.test(v);
const envUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
const envKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const SUPABASE_URL = valid(envUrl, 12) && envUrl.startsWith("https://") ? envUrl : FALLBACK_URL;
export const SUPABASE_ANON_KEY = valid(envKey, 40) ? envKey : FALLBACK_ANON;
export const serviceRoleKey = () => clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Trả về thông báo lỗi nếu biến môi trường bị dán sai (ví dụ dấu chấm tròn ẩn •). */
export function envProblem(): string | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trên Vercel";
  if (/[^\x20-\x7E]/.test(SUPABASE_ANON_KEY) || /[^\x20-\x7E]/.test(SUPABASE_URL))
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY hoặc URL trên Vercel chứa ký tự lạ (•). Hãy dán lại giá trị thật rồi Redeploy";
  return null;
}
