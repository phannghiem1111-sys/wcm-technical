"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteInspection } from "./actions";

export function ReviewActions({ id, canDelete }: { id: string; canDelete: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      {canDelete && (
        <Button variant="ghost" className="w-full text-red-600" disabled={pending} onClick={() => { if (confirm("Xóa vĩnh viễn biên bản này?")) start(async () => { const r = await deleteInspection(id); if (r?.error) toast.error(r.error); }); }}>
          <Trash2 /> Xóa biên bản
        </Button>
      )}
    </div>
  );
}
