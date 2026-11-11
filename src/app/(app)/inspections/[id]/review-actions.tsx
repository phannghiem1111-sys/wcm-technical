"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deleteInspection, reviewInspection } from "./actions";

export function ReviewActions({ id, canReview, canDelete }: { id: string; canReview: boolean; canDelete: boolean }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const run = (status: "approved" | "rejected") =>
    start(async () => {
      const r = await reviewInspection(id, status, note);
      if (r.error) toast.error(r.error); else toast.success(status === "approved" ? "Đã duyệt biên bản" : "Đã trả lại biên bản");
    });
  return (
    <div className="space-y-3">
      {canReview && (
        <>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ý kiến người duyệt..." rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={pending} onClick={() => run("rejected")}><Undo2 /> Trả lại</Button>
            <Button disabled={pending} onClick={() => run("approved")} className="bg-emerald-600 hover:bg-emerald-700">{pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Duyệt</Button>
          </div>
        </>
      )}
      {canDelete && (
        <Button variant="ghost" className="w-full text-red-600" disabled={pending} onClick={() => { if (confirm("Xóa vĩnh viễn biên bản này?")) start(async () => { const r = await deleteInspection(id); if (r?.error) toast.error(r.error); }); }}>
          <Trash2 /> Xóa biên bản
        </Button>
      )}
    </div>
  );
}
