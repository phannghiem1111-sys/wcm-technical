import { Logo } from "@/components/logo";
import { InstallButton } from "@/components/install-button";

export function AuthShell({ children, title = "Đăng nhập hệ thống" }: { children: React.ReactNode; title?: string }) {
  return (
    <main className="flex min-h-dvh flex-col bg-white lg:flex-row">
      <section className="relative flex flex-col justify-end overflow-hidden bg-primary px-6 pb-10 pt-[max(3rem,env(safe-area-inset-top))] text-white lg:w-1/2 lg:justify-center lg:p-16">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-black/10" />
        <div className="relative">
          <div className="mb-6 inline-flex flex-col items-center justify-center rounded-2xl bg-white px-4 py-3 text-primary shadow-xl">
            <span className="text-2xl font-black leading-none">WCM</span>
            <span className="text-[9px] font-bold tracking-[0.2em]">TECHNICAL</span>
          </div>
          <h1 className="text-3xl font-black leading-tight lg:text-5xl">WINCOMMERCE<br />TECHNICAL MANAGEMENT</h1>
          <p className="mt-3 max-w-md text-sm text-white/85 lg:text-base">Kiểm tra kỹ thuật, nghiệm thu NSO, bảo trì bảo dưỡng và lưu hồ sơ hình ảnh cho toàn hệ thống cửa hàng.</p>
        </div>
      </section>
      <section className="-mt-6 flex flex-1 items-start justify-center rounded-t-3xl bg-white px-6 pb-10 pt-8 lg:mt-0 lg:items-center lg:rounded-none">
        <div className="w-full max-w-sm space-y-6">
          <div className="hidden lg:block"><Logo /></div>
          <h2 className="text-xl font-bold">{title}</h2>
          {children}
          <InstallButton className="w-full" />
        </div>
      </section>
    </main>
  );
}
