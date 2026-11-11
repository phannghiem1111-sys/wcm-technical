import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, serviceRoleKey } from "./env";

/** Client service-role: CHỈ dùng phía server sau khi đã kiểm tra quyền. */
export function createAdminClient() {
  const key = serviceRoleKey();
  if (!key) throw new Error("Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
