"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const noopSubscribe = () => () => {};

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Nút "Cài đặt ứng dụng": Android dùng prompt hệ thống, iPhone hiện hướng dẫn "Thêm vào MH chính". */
export function InstallButton({ className }: { className?: string }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [justInstalled, setInstalled] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const standalone = useSyncExternalStore(noopSubscribe, () => window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as unknown as { standalone?: boolean }).standalone), () => false);
  const isIOS = useSyncExternalStore(noopSubscribe, () => /iphone|ipad|ipod/i.test(navigator.userAgent), () => false);
  const installed = standalone || justInstalled;

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed || (!evt && !isIOS)) return null;

  return (
    <>
      <Button
        variant="outline"
        className={className}
        onClick={async () => {
          if (evt) { await evt.prompt(); await evt.userChoice; setEvt(null); }
          else setShowIOS(true);
        }}
      >
        <Download /> Cài đặt ứng dụng
      </Button>
      <Dialog open={showIOS} onOpenChange={setShowIOS}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cài WCM TECHNICAL lên iPhone</DialogTitle>
            <DialogDescription>Mở bằng Safari rồi làm theo 2 bước:</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-primary font-bold text-white">1</span> Bấm nút <Share className="size-4" /> <b>Chia sẻ</b> ở thanh dưới.</li>
            <li className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-primary font-bold text-white">2</span> Chọn <b>“Thêm vào MH chính”</b>.</li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
