"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendInspectionEmail } from "@/lib/send-email-client";

export function SendMailButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={async () => {
      setBusy(true);
      const r = await sendInspectionEmail(id);
      setBusy(false);
      r.ok ? toast.success(`Đã gửi mail tới ${r.to?.join(", ")}`) : toast.error(r.error ?? "Gửi mail thất bại");
      router.refresh();
    }}>
      {busy ? <Loader2 className="animate-spin" /> : <Send />} Gửi lại mail
    </Button>
  );
}
