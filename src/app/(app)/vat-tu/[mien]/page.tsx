import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { allowedMaterialApps } from "@/lib/material/access";
import { MATERIAL_APPS, type MaterialAppKey } from "@/lib/material/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="-mx-3 -mb-28 -mt-4 flex h-[calc(100dvh-8.5rem)] flex-col sm:-mx-6 lg:-mb-10 lg:-mt-8 lg:h-dvh">
      <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-2 sm:px-6">
        <div className="flex gap-1">
          {allowed.map((k) => (
            <Link key={k} href={`/vat-tu/${k}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-bold", k === key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}>{MATERIAL_APPS[k].label}</Link>
          ))}
        </div>
        <Button size="sm" variant="outline" asChild><a href={app.url} target="_blank" rel="noopener"><ExternalLink /> Mở tab mới</a></Button>
      </div>
      <iframe key={key} src={app.url} title={app.label} className="w-full flex-1 border-0 bg-white" allow="camera; clipboard-write; geolocation" />
    </div>
  );
}
