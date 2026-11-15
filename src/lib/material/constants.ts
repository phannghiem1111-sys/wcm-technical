export const MR_COLOR = "bg-emerald-600";

export type MaterialAppKey = "mn" | "mb";
/** App Biên Bản Vật Tư theo miền (Apps Script + Google Sheet riêng mỗi miền), nhúng ở /vat-tu/[mien] */
export const MATERIAL_APPS: Record<MaterialAppKey, { label: string; url: string; regions: string[] }> = {
  mn: { label: "Vật tư Miền Nam", url: "https://phannghiem1111-sys.github.io/bienban-vt/mn/", regions: ["MN", "HCM", "MD", "MT", "MTR"] },
  mb: { label: "Vật tư Miền Bắc", url: "https://phannghiem1111-sys.github.io/bienban-vt/mb/", regions: ["MB", "HN"] },
};
export const MATERIAL_APP_KEYS = Object.keys(MATERIAL_APPS) as MaterialAppKey[];
