import { WifiOff } from "lucide-react";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <WifiOff className="size-12 text-primary" />
      <h1 className="text-xl font-bold">Mất kết nối mạng</h1>
      <p className="max-w-xs text-sm text-muted-foreground">Kiểm tra 3G/4G hoặc Wi-Fi rồi mở lại ứng dụng. Phiếu đang nhập dở được lưu nháp trên máy.</p>
    </main>
  );
}
