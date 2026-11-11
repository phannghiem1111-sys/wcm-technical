"use client";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/** Form chạy hoàn toàn phía client (đọc nháp từ máy, camera, chữ ký). */
export const InspectionFormLoader = dynamic(() => import("./inspection-form").then((m) => m.InspectionForm), {
  ssr: false,
  loading: () => <div className="flex h-60 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>,
});
