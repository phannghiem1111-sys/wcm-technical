import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Lịch sử đăng nhập" };

function device(ua: string | null) {
  if (!ua) return "—";
  if (/iphone|ipad/i.test(ua)) return "iPhone/iPad";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os/i.test(ua)) return "macOS";
  return "Khác";
}

export default async function LoginLogsPage({ searchParams }: { searchParams: Promise<{ msnv?: string }> }) {
  const sp = await searchParams;
  await requireProfile(["admin"]);
  const supabase = await createClient();
  let q = supabase.from("login_logs").select("*").order("created_at", { ascending: false }).limit(300);
  if (sp.msnv) q = q.ilike("msnv", `${sp.msnv.replace(/[%,]/g, "")}%`);
  const { data } = await q;
  return (
    <>
      <PageHeader title="Lịch sử đăng nhập" desc="300 lượt gần nhất" />
      <form className="mb-3 flex gap-2"><Input name="msnv" defaultValue={sp.msnv} placeholder="Lọc theo MSNV" /><Button variant="dark">Lọc</Button></form>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Thời gian</TableHead><TableHead>MSNV</TableHead><TableHead>Kết quả</TableHead><TableHead>Thiết bị</TableHead><TableHead className="hidden md:table-cell">IP</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap">{fmtDateTime(l.created_at)}</TableCell>
                <TableCell className="font-bold">{l.msnv}</TableCell>
                <TableCell>{l.success ? <Badge variant="success">Thành công</Badge> : <Badge variant="danger">Thất bại</Badge>}</TableCell>
                <TableCell>{device(l.user_agent)}</TableCell>
                <TableCell className="hidden font-mono text-xs md:table-cell">{l.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
