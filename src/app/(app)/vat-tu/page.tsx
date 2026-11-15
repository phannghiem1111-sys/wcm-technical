import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { allowedMaterialApps } from "@/lib/material/access";

/** Mở app vật tư của miền mình (miền đầu tiên được phép). */
export default async function MaterialAppIndex() {
  const p = await requireProfile();
  const [first] = await allowedMaterialApps(p);
  redirect(`/vat-tu/${first}`);
}
