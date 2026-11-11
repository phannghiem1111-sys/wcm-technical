import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "WCM TECHNICAL – WinCommerce Technical Management",
    short_name: "WCM TECHNICAL",
    description: "Kiểm tra kỹ thuật, bảo trì bảo dưỡng và lưu hồ sơ cửa hàng WinCommerce",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#d9232d",
    lang: "vi",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Phiếu NSO mới", url: "/inspections/new?type=nso" },
      { name: "Kiểm tra định kỳ", url: "/inspections/new?type=periodic" },
      { name: "Bảo trì thiết bị", url: "/inspections/new?type=maintenance" },
    ],
  };
}
