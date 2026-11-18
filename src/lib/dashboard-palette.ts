import type { FormType } from "@/lib/constants";

// Bảng màu dịu cho trang Tổng quan (biểu đồ, thanh tiến độ, ô biểu tượng).
export const TYPE_HEX: Record<FormType, string> = { nso: "#d63a42", periodic: "#3d6fd1", maintenance: "#e0a23b" };

// Ô biểu tượng nền nhạt + chữ đậm cùng tông.
export const TYPE_SOFT: Record<FormType, string> = {
  nso: "bg-red-50 text-red-600 ring-red-100",
  periodic: "bg-blue-50 text-blue-600 ring-blue-100",
  maintenance: "bg-amber-50 text-amber-600 ring-amber-100",
};
export const MR_SOFT = "bg-emerald-50 text-emerald-600 ring-emerald-100";
