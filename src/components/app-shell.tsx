"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FilePlus2, FileText, CalendarCheck, Store, Users, Settings, UserCircle, LogOut, History, KeyRound, Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, type AppRole } from "@/lib/constants";
import { logout } from "@/app/login/actions";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles?: AppRole[] };

const NAV: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/inspections/new", label: "Tạo phiếu kiểm tra", icon: FilePlus2 },
  { href: "/inspections", label: "Kho biên bản", icon: FileText },
  { href: "/plans", label: "Kế hoạch định kỳ", icon: CalendarCheck },
  { href: "/stores", label: "Cửa hàng", icon: Store },
];
const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "Tài khoản", icon: Users, roles: ["admin"] },
  { href: "/admin/reset-requests", label: "Yêu cầu cấp lại MK", icon: KeyRound, roles: ["admin", "doi_truong"] },
  { href: "/admin/login-logs", label: "Lịch sử đăng nhập", icon: History, roles: ["admin"] },
  { href: "/admin/settings", label: "Cấu hình checklist", icon: Settings, roles: ["admin"] },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/inspections") return path === "/inspections" || (path.startsWith("/inspections/") && !path.startsWith("/inspections/new"));
  return path.startsWith(href);
}

export function AppShell({ children, user }: { children: React.ReactNode; user: { full_name: string; msnv: string; role: AppRole } }) {
  const path = usePathname();
  const adminItems = ADMIN_NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  return (
    <div className="min-h-dvh lg:pl-72">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-zinc-950 text-zinc-300 lg:flex">
        <div className="border-b border-white/10 p-5"><Logo light /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nghiệp vụ</p>
          {NAV.map((n) => <SideLink key={n.href} item={n} active={isActive(path, n.href)} />)}
          {adminItems.length > 0 && <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Quản trị</p>}
          {adminItems.map((n) => <SideLink key={n.href} item={n} active={isActive(path, n.href)} />)}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link href="/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-white">{user.full_name.split(" ").pop()?.[0]}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white">{user.full_name}</div>
              <div className="truncate text-xs text-zinc-400">{user.msnv} · {ROLE_LABEL[user.role]}</div>
            </div>
          </Link>
          <form action={logout}>
            <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5"><LogOut className="size-4" /> Đăng xuất</button>
          </form>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-primary px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shadow-md lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center rounded-lg bg-white px-1.5 py-1 text-primary">
            <span className="text-[11px] font-black leading-none">WCM</span>
            <span className="text-[5px] font-bold tracking-widest">TECHNICAL</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-black">WCM TECHNICAL</div>
            <div className="text-[10px] text-white/80">{user.full_name} · {user.msnv}</div>
          </div>
        </div>
        <Link href="/profile" className="rounded-full bg-white/15 p-2" aria-label="Tài khoản"><UserCircle className="size-5" /></Link>
      </header>

      <main className="mx-auto w-full max-w-7xl px-3 pb-28 pt-4 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 pb-safe backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 items-end">
          <BottomLink href="/" label="Tổng quan" icon={LayoutDashboard} active={isActive(path, "/")} />
          <BottomLink href="/inspections" label="Biên bản" icon={FileText} active={isActive(path, "/inspections")} />
          <div className="flex justify-center">
            <Link href="/inspections/new" className={cn("-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-red-900/30 ring-4 ring-white", path.startsWith("/inspections/new") && "bg-red-700")} aria-label="Tạo phiếu">
              <Plus className="size-7" />
            </Link>
          </div>
          <BottomLink href="/plans" label="Kế hoạch" icon={CalendarCheck} active={isActive(path, "/plans")} />
          <BottomLink href={user.role === "admin" ? "/admin/users" : "/stores"} label={user.role === "admin" ? "Quản trị" : "Cửa hàng"} icon={user.role === "admin" ? Settings : Store} active={isActive(path, user.role === "admin" ? "/admin" : "/stores")} />
        </div>
      </nav>
    </div>
  );
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors", active ? "bg-primary text-white shadow-md shadow-red-900/40" : "hover:bg-white/5 hover:text-white")}>
      <Icon className="size-5" /> {item.label}
    </Link>
  );
}

function BottomLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean }) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold", active ? "text-primary" : "text-zinc-500")}>
      <Icon className="size-6" /> {label}
    </Link>
  );
}
