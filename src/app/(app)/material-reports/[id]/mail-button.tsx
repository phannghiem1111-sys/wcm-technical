"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MaterialMailButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={async () => {
      setBusy(true);
      const r = await fetch(`/api/material-reports/${id}/email`, { method: "POST" }).then((x) => x.json()).catch(() => ({ ok: false, error: "Không kết nối được máy chủ" }));
      setBusy(false);
      r.ok ? toast.success(`Đã gửi mail tới ${r.to?.join(", ")}`) : toast.error(r.error ?? "Gửi mail thất bại");
      router.refresh();
    }}>
      {busy ? <Loader2 className="animate-spin" /> : <Send />} Gửi lại mail
    </Button>
  );
}
