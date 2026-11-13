"use client";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const MaterialFormLoader = dynamic(() => import("./material-form").then((m) => m.MaterialForm), {
  ssr: false,
  loading: () => <div className="flex h-60 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>,
});
