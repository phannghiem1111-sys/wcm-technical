import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { allowedMaterialApps } from "@/lib/material/access";
import { MATERIAL_APPS, type MaterialAppKey } from "@/lib/material/constants";
import { cn } from "@/lib/utils";
import { MaterialFrame } from "./frame";

export const metadata = { title: "App Vật tư" };

/** Nhúng nguyên app Biên Bản Vật Tư của từng miền. */
export default async function MaterialAppPage({ params }: { params: Promise<{ mien: string }> }) {
  const { mien } = await params;
  if (!(mien in MATERIAL_APPS)) notFound();
  const key = mien as MaterialAppKey;
  const p = await requireProfile();
  const allowed = await allowedMaterialApps(p);
  if (!allowed.includes(key)) redirect(`/vat-tu/${allowed[0]}`);
  const app = MATERIAL_APPS[key];
  return (
    <MaterialFrame
      key={key}
      mien={key}
      url={app.url}
      title={app.label}
      msnv={p.msnv}
      tabs={allowed.map((k) => (
        <Link key={k} href={`/vat-tu/${k}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-bold", k === key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}>{MATERIAL_APPS[k].label}</Link>
      ))}
    />
  );
}
