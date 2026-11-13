import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MaterialFormLoader as MaterialForm } from "@/components/material/material-form-loader";
import { STORE_COLS, type StoreLite } from "@/components/inspection/types";

export const metadata = { title: "Lập biên bản vật tư" };

export default async function NewMaterialReport({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const sp = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: store } = sp.store ? await supabase.from("stores").select(STORE_COLS).eq("id", sp.store).maybeSingle() : { data: null };
  return (
    <>
      <PageHeader title="Lập biên bản vật tư" desc="Ghi nhận sự việc, vật tư thay thế và đề xuất xử lý" />
      <MaterialForm reporter={{ full_name: profile.full_name, msnv: profile.msnv, title: profile.title }} initialStore={(store as StoreLite | null) ?? null} />
    </>
  );
}
