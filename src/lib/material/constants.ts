export const MR_COLOR = "bg-emerald-600";

export type MaterialAppKey = "mn" | "mb";
/** App Biên Bản Vật Tư theo miền (Apps Script + Google Sheet riêng mỗi miền), nhúng ở /vat-tu/[mien] */
export const MATERIAL_APPS: Record<MaterialAppKey, { label: string; url: string; api: string; regions: string[] }> = {
  mn: { label: "Vật tư Miền Nam", url: "https://phannghiem1111-sys.github.io/bienban-vt/mn/", api: "https://script.google.com/macros/s/AKfycbwV4J-5M2mfHL3y2aW2GdBss1sCftq-0Pcs1hKJ3UmPDw53GEMVEHnPeAn0ezMJzho6eQ/exec", regions: ["MN", "HCM", "MD", "MT", "MTR"] },
  mb: { label: "Vật tư Miền Bắc", url: "https://phannghiem1111-sys.github.io/bienban-vt/mb/", api: "https://script.google.com/macros/s/AKfycbwN7QTeq-PTYBV32zmxjuBRDL7qsLMP-2SmYBzaEGhsKB6yT2DJjK1J5MWJ-lj1CVgB/exec", regions: ["MB", "HN"] },
};
export const MATERIAL_APP_KEYS = Object.keys(MATERIAL_APPS) as MaterialAppKey[];
