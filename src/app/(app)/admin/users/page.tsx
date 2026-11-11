import Link from "next/link";
import { Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, ROLE_ORDER } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserActions, UserDialog, type UserRow } from "./user-dialog";

export const metadata = { title: "Quản lý tài khoản" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const sp = await searchParams;
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from("profiles").select("id, msnv, full_name, title, role, region_id, province, phone, status, regions(name), lead:team_lead_id(msnv, full_name)", { count: "exact" });
  if (sp.role) q = q.eq("role", sp.role);
  if (sp.q) { const s = sp.q.replace(/[%,()]/g, ""); q = q.or(`msnv.ilike.${s}%,full_name.ilike.%${s}%`); }
  const [{ data, count }, { data: regions }] = await Promise.all([q.order("msnv").range((page - 1) * 50, page * 50 - 1), supabase.from("regions").select("id, name").order("id")]);
  type R = UserRow & { regions: { name: string } | null; lead: { msnv: string; full_name: string } | null };
  const rows = (data ?? []) as unknown as R[];

  return (
    <>
      <PageHeader title="Quản lý tài khoản" desc={`${count ?? 0} tài khoản · phân quyền 5 cấp`} actions={<UserDialog regions={regions ?? []} />} />
      <form className="mb-3 flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={sp.q} placeholder="MSNV hoặc họ tên" className="pl-9" /></div>
        <NativeSelect name="role" defaultValue={sp.role ?? ""} className="w-44"><option value="">Tất cả vai trò</option>{ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</NativeSelect>
        <Button variant="dark">Lọc</Button>
      </form>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>MSNV</TableHead><TableHead>Họ tên</TableHead><TableHead>Vai trò</TableHead><TableHead className="hidden md:table-cell">Khu vực / Tỉnh</TableHead><TableHead className="hidden md:table-cell">Đội trưởng</TableHead><TableHead>Trạng thái</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-bold">{u.msnv}</TableCell>
                <TableCell><div className="font-semibold">{u.full_name}</div><div className="text-xs text-muted-foreground">{u.title}</div></TableCell>
                <TableCell className="whitespace-nowrap text-xs">{ROLE_LABEL[u.role]}</TableCell>
                <TableCell className="hidden text-xs md:table-cell">{u.regions?.name ?? "—"}{u.province && ` · ${u.province}`}</TableCell>
                <TableCell className="hidden text-xs md:table-cell">{u.lead ? `${u.lead.msnv} – ${u.lead.full_name}` : "—"}</TableCell>
                <TableCell>{u.status === "active" ? <Badge variant="success">Hoạt động</Badge> : <Badge variant="danger">Đã khóa</Badge>}</TableCell>
                <TableCell className="whitespace-nowrap text-right"><UserDialog regions={regions ?? []} user={{ ...u, lead_msnv: u.lead?.msnv }} /><UserActions user={u} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {(count ?? 0) > 50 && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && <Button variant="outline" asChild><Link href={`?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}>← Trước</Link></Button>}
          {page * 50 < (count ?? 0) && <Button variant="outline" asChild><Link href={`?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}>Sau →</Link></Button>}
        </div>
      )}
    </>
  );
}
