import { Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteMaterial, ImportForm } from "./import-form";

export const metadata = { title: "Danh mục vật tư" };

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  await requireProfile(["admin"]);
  const supabase = await createClient();
  let query = supabase.from("materials").select("code, name, unit", { count: "exact" });
  if (q?.trim()) { const t = q.trim().replace(/[%,()]/g, ""); query = query.or(`code.ilike.${t}%,name.ilike.%${t}%`); }
  const { data, count } = await query.order("name").limit(200);
  const rows = (data ?? []) as { code: string; name: string; unit: string | null }[];

  return (
    <>
      <PageHeader title="Danh mục vật tư" desc={`${count ?? 0} vật tư · dùng để gợi ý khi lập biên bản vật tư`} />
      <Card className="mb-4">
        <CardHeader><CardTitle>Nhập / cập nhật từ Excel</CardTitle><CardDescription>Copy 3 cột Mã, Tên, ĐVT trong Excel rồi dán vào ô dưới. Trùng mã sẽ được cập nhật.</CardDescription></CardHeader>
        <CardContent><ImportForm /></CardContent>
      </Card>
      <Card className="overflow-hidden">
        <form className="relative p-3">
          <Search className="absolute left-6 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Tìm mã hoặc tên vật tư..." className="pl-9" />
        </form>
        <Table>
          <TableHeader><TableRow><TableHead>Mã</TableHead><TableHead>Tên vật tư</TableHead><TableHead>ĐVT</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.code}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell><TableCell>{r.name}</TableCell><TableCell>{r.unit}</TableCell>
                <TableCell className="w-10"><DeleteMaterial code={r.code} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Chưa có vật tư.</p>}
      </Card>
    </>
  );
}
