export type AppRole = "admin" | "truong_phong" | "truong_bo_phan" | "doi_truong" | "nhan_vien";
export type FormType = "nso" | "periodic" | "maintenance";
export type ItemResult = "pass" | "fail" | "na" | "monitor" | "urgent" | "good" | "maintenance" | "broken";

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Quản trị hệ thống",
  truong_phong: "Trưởng phòng Kỹ thuật",
  truong_bo_phan: "Trưởng bộ phận",
  doi_truong: "Đội trưởng",
  nhan_vien: "Nhân viên kỹ thuật",
};
export const ROLE_ORDER: AppRole[] = ["admin", "truong_phong", "truong_bo_phan", "doi_truong", "nhan_vien"];

export const FORM_META: Record<FormType, { title: string; short: string; badge: string; color: string; desc: string }> = {
  nso: { title: "Biên bản đánh giá NSO", short: "NSO", badge: "NSO", color: "bg-primary", desc: "Nghiệm thu cửa hàng mới (17 tiêu chí)" },
  periodic: { title: "Biên bản kiểm tra định kỳ CH", short: "Định kỳ", badge: "Định kỳ", color: "bg-blue-600", desc: "Kiểm tra theo kế hoạch tháng/quý/năm" },
  maintenance: { title: "Biên bản bảo trì bảo dưỡng", short: "BTBD", badge: "Bảo trì", color: "bg-amber-600", desc: "Bảo trì theo nhóm thiết bị" },
};

type ResultOpt = { value: ItemResult; label: string; tone: "success" | "danger" | "warning" | "muted" | "urgent" };
export const RESULT_OPTIONS: Record<FormType, ResultOpt[]> = {
  nso: [
    { value: "pass", label: "Đạt", tone: "success" },
    { value: "fail", label: "Không đạt", tone: "danger" },
    { value: "na", label: "K.áp dụng", tone: "muted" },
  ],
  periodic: [
    { value: "pass", label: "Đạt", tone: "success" },
    { value: "fail", label: "Không đạt", tone: "danger" },
    { value: "monitor", label: "Cần theo dõi", tone: "warning" },
    { value: "urgent", label: "Sửa khẩn", tone: "urgent" },
  ],
  maintenance: [
    { value: "good", label: "Tốt", tone: "success" },
    { value: "maintenance", label: "Cần bảo trì", tone: "warning" },
    { value: "broken", label: "Hư hỏng", tone: "danger" },
  ],
};

export const RESULT_LABEL: Record<ItemResult, string> = {
  pass: "Đạt", fail: "Không đạt", na: "Không áp dụng", monitor: "Cần theo dõi", urgent: "Sửa chữa khẩn cấp",
  good: "Tốt / Ổn định", maintenance: "Cần bảo trì", broken: "Hư hỏng / Thay mới",
};
export const BAD_RESULTS: ItemResult[] = ["fail", "monitor", "urgent", "maintenance", "broken"];

export const COMPLETION_LABEL: Record<string, string> = { done: "Hoàn thành", partial: "Hoàn thành một phần", not_done: "Chưa hoàn thành" };
export const STATUS_LABEL: Record<string, string> = { draft: "Nháp", submitted: "Chờ duyệt", approved: "Đã duyệt", rejected: "Trả lại" };
export const PERIOD_LABEL: Record<string, string> = { month: "Tháng", quarter: "Quý", year: "Năm", campaign: "Chiến dịch" };

export const STORAGE_BUCKET = "inspection-files";
/** Supabase Auth dùng email nội bộ sinh từ MSNV. */
export const msnvToEmail = (msnv: string) => `${msnv.trim().toLowerCase()}@${process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || "wcm-technical.local"}`;
