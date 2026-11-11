/** Đọc biến môi trường Supabase, bỏ khoảng trắng/xuống dòng/dấu nháy thừa khi dán trên Vercel. */
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const serviceRoleKey = () => clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
