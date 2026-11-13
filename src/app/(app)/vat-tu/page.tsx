import { ExternalLink } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { MR_APP_URL } from "@/lib/material/constants";
import { Button } from "@/components/ui/button";

export const metadata = { title: "App Vật tư MN" };

/** Nhúng nguyên app Biên Bản Vật Tư MN (Tổng quan, Biên bản, Lập biên bản, Quét QR, Tra tồn kho, Xác nhận chuyển, Điều phối, Cảnh báo). */
export default async function MaterialAppPage() {
  await requireProfile();
  return (
    <div className="-mx-3 -mb-28 -mt-4 flex h-[calc(100dvh-8.5rem)] flex-col sm:-mx-6 lg:-mb-10 lg:-mt-8 lg:h-dvh">
      <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-2 sm:px-6">
        <div className="text-sm font-black">App Vật tư MN</div>
        <Button size="sm" variant="outline" asChild><a href={MR_APP_URL} target="_blank" rel="noopener"><ExternalLink /> Mở tab mới</a></Button>
      </div>
      <iframe
        src={MR_APP_URL}
        title="App Biên Bản Vật Tư MN"
        className="w-full flex-1 border-0 bg-white"
        allow="camera; clipboard-write; geolocation"
      />
    </div>
  );
}
