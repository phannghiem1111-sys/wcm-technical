/** Hạng mục, mẫu nội dung và đề xuất của Biên bản vật tư (theo app Biên Bản Vật Tư MN). */
export const MR_CATEGORIES = ["Bảng hiệu", "Điện", "Điện lạnh", "PCCC", "Cửa cuốn", "Cửa kính", "Mái nhà", "WC", "Trần", "Khác"];
export const MR_PROPOSALS = ["Xuất kho", "Mua mới", "Bảo hành"];
export const MR_COLOR = "bg-emerald-600";
/** App Biên Bản Vật Tư MN (tồn kho, điều phối, xác nhận chuyển) */
export const MR_APP_URL = "https://phannghiem1111-sys.github.io/bienban-vt/mn/";

export const MR_TEMPLATES: { incident: Record<string, string[]>; solution: Record<string, string[]> } = {
  incident: {
    "Bảng hiệu": ["Đèn bảng hiệu không sáng hoặc chập chờn, cần thay thế.", "Bộ nguồn đèn bảng hiệu hỏng, cần thay.", "Bảng hiệu bị hư hỏng, cần sửa chữa hoặc thay thế vật tư."],
    "Điện": ["Bóng đèn hỏng, không sáng, cần thay thế.", "Ổ cắm, công tắc hoặc CB bị hư hỏng, cần thay thế.", "Dây điện chập hoặc xuống cấp, cần thay thế."],
    "Điện lạnh": ["Máy lạnh, tủ lạnh hoạt động kém lạnh, cần bổ sung gas.", "Thiết bị điện lạnh hư hỏng linh kiện, cần thay thế."],
    "PCCC": ["Thiết bị PCCC hết hạn hoặc hư hỏng, cần thay thế.", "Đèn exit hoặc đèn sự cố không hoạt động, cần thay thế."],
    "Cửa cuốn": ["Cửa cuốn kẹt, chạy không êm hoặc không lên xuống, cần sửa chữa hoặc thay phụ kiện.", "Motor hoặc remote cửa cuốn hỏng, cần thay thế."],
    "Cửa kính": ["Cửa kính bị lỏng bản lề, hỏng khóa hoặc ron, cần thay phụ kiện.", "Kính bị nứt hoặc vỡ, cần thay thế."],
    "Mái nhà": ["Mái bị dột hoặc thấm nước, cần xử lý chống thấm.", "Tôn mái hoặc máng xối hư hỏng, cần sửa chữa."],
    "WC": ["Thiết bị vệ sinh trong WC hư hỏng hoặc rò nước, cần thay thế.", "Vòi nước, van hoặc đường ống WC bị rò rỉ, cần sửa chữa."],
    "Trần": ["Trần bị thấm, ố hoặc xuống cấp, cần sửa chữa.", "Tấm trần bị rơi hoặc hỏng, cần thay thế."],
    "*": ["Kỹ thuật kiểm tra tại cửa hàng, ghi nhận sự cố và đề xuất thay thế vật tư."],
  },
  solution: {
    "Bảng hiệu": ["Thay bộ nguồn hoặc đèn bảng hiệu, kiểm tra hoạt động bình thường sau khi thay."],
    "Điện": ["Thay vật tư mới, kiểm tra an toàn điện và vận hành bình thường sau khi thay.", "Thay bóng đèn mới, đèn sáng bình thường."],
    "Điện lạnh": ["Bổ sung gas hoặc thay linh kiện, kiểm tra máy chạy lạnh bình thường sau khi xử lý."],
    "PCCC": ["Thay thiết bị mới, kiểm tra hoạt động đạt yêu cầu sau khi thay."],
    "Cửa cuốn": ["Sửa chữa hoặc thay phụ kiện cửa cuốn, kiểm tra cửa chạy êm sau khi xử lý."],
    "Cửa kính": ["Thay phụ kiện cửa kính, kiểm tra đóng mở bình thường sau khi thay."],
    "Mái nhà": ["Xử lý chống thấm, kiểm tra không còn dột sau khi thi công."],
    "WC": ["Thay thiết bị hoặc xử lý rò rỉ, kiểm tra hoạt động bình thường sau khi xử lý."],
    "Trần": ["Sửa chữa hoặc thay tấm trần, kiểm tra hoàn thiện sau khi xử lý."],
    "*": ["Thay thế vật tư theo danh sách bên dưới, kiểm tra hoạt động bình thường sau khi thay.", "Cửa hàng xác nhận đã nghiệm thu."],
  },
};

/** V/v: dòng đầu của nội dung sự việc, hoặc "Thay thế vật tư <hạng mục>". */
export function mrSubject(incident: string, category: string) {
  const l1 = incident.trim().split("\n")[0]?.trim() ?? "";
  if (l1) return l1.length > 90 ? l1.slice(0, 88) + "…" : l1;
  return category ? `Thay thế vật tư ${category}` : "Thay thế vật tư";
}

/** Tìm không dấu. */
export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
