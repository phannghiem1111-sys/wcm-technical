"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { createPlan } from "../actions";

export function PlanForm({ regions }: { regions: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(createPlan, undefined);
  const [scope, setScope] = useState("region");
  return (
    <form action={action} className="space-y-4">
      {state?.error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      <div className="space-y-2"><Label>Tên kế hoạch</Label><Input name="name" required placeholder="VD: Kiểm tra định kỳ Quý 4/2026" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Chu kỳ</Label>
          <NativeSelect name="period" defaultValue="month"><option value="month">Tháng</option><option value="quarter">Quý</option><option value="year">Năm</option><option value="campaign">Chiến dịch</option></NativeSelect>
        </div>
        <div className="space-y-2"><Label>Loại biên bản</Label>
          <NativeSelect name="form_type" defaultValue="periodic"><option value="periodic">Kiểm tra định kỳ</option><option value="maintenance">Bảo trì bảo dưỡng</option><option value="nso">NSO</option></NativeSelect>
        </div>
        <div className="space-y-2"><Label>Từ ngày</Label><Input type="date" name="start_date" required /></div>
        <div className="space-y-2"><Label>Đến ngày</Label><Input type="date" name="end_date" required /></div>
      </div>
      <div className="space-y-2"><Label>Phạm vi cửa hàng</Label>
        <NativeSelect name="scope" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="region">Theo khu vực (tất cả CH trong phạm vi quản lý)</option>
          <option value="codes">Theo danh sách mã cửa hàng</option>
        </NativeSelect>
      </div>
      {scope === "region" ? (
        <div className="space-y-2"><Label>Khu vực</Label>
          <NativeSelect name="region_id" defaultValue=""><option value="">Tất cả khu vực được giao</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</NativeSelect>
        </div>
      ) : (
        <div className="space-y-2"><Label>Mã cửa hàng (cách nhau bởi dấu phẩy / xuống dòng)</Label><Textarea name="codes" rows={4} placeholder="6874, 1234, 9999" /></div>
      )}
      <div className="space-y-2"><Label>Ghi chú</Label><Textarea name="note" rows={2} /></div>
      <Button size="lg" className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Tạo kế hoạch & phân công</Button>
    </form>
  );
}
