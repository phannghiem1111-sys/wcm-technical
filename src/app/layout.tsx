import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: { default: "WCM TECHNICAL", template: "%s · WCM TECHNICAL" },
  description: "WinCommerce Technical Management System – Kiểm tra kỹ thuật & bảo trì cửa hàng",
  applicationName: "WCM TECHNICAL",
  appleWebApp: { capable: true, title: "WCM TECHNICAL", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#d9232d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${font.variable} font-sans`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
        <PwaRegister />
      </body>
    </html>
  );
}
