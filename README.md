# WCM TECHNICAL – WinCommerce Technical Management System

Ứng dụng PWA (cài trên Android/iPhone + giao diện quản trị máy tính) quản lý kiểm tra kỹ thuật cửa hàng WinCommerce.

**Công nghệ:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Supabase (PostgreSQL, Auth, Storage, RLS) · Vercel.

## Chức năng

| Phân hệ | Nội dung |
|---|---|
| Đăng nhập | MSNV + mật khẩu, đổi mật khẩu, quên mật khẩu (gửi yêu cầu cho Đội trưởng/Admin), khóa tài khoản, lịch sử đăng nhập |
| Phân quyền 5 cấp | Admin · Trưởng phòng · Trưởng bộ phận (theo khu vực) · Đội trưởng (theo đội) · Nhân viên kỹ thuật (CH được phân công) – thực thi bằng **RLS** trong DB |
| 01 – NSO | 17 tiêu chí / 4 nhóm (theo biểu mẫu gốc). Kết quả: Đạt / Không đạt / Không áp dụng + ghi chú, đề xuất, ảnh |
| 02 – BTBD | 7 nhóm thiết bị, nhập số lượng thiết bị thực tế; mỗi thiết bị: model, tình trạng trước/sau, công việc chuẩn (tick), vật tư, ảnh trước/sau, đánh giá hoàn thành. Admin cấu hình tần suất bảo trì |
| 03 – Định kỳ | 21 tiêu chí / 5 nhóm. Kết quả: Đạt / Không đạt / Cần theo dõi / Sửa chữa khẩn cấp. Kế hoạch theo Tháng/Quý/Năm/Chiến dịch, tự phân công, theo dõi tiến độ |
| 04 – Hình ảnh | Mỗi tiêu chí: chụp camera, chọn nhiều ảnh từ thư viện, mô tả ảnh; ảnh nén trên máy, lưu Supabase Storage theo `MãCH/MãBiênBản/MụcKiểmTra`, gắn MSNV, thời gian, loại kiểm tra, nội dung lỗi |
| Biên bản | Ký tên trên màn hình (NV + đại diện CH), duyệt/trả lại, **xuất PDF** (có ảnh, chữ ký), **xuất Excel** (tổng hợp + chi tiết lỗi) |
| Dashboard | KPI, tỷ lệ đạt theo phân hệ, biểu đồ theo tháng, top lỗi, theo khu vực, CH đến hạn bảo trì |
| PWA | Cài đặt lên màn hình chính, nút "Cài đặt ứng dụng", lưu nháp phiếu trên máy khi mất mạng |

Nội dung checklist nằm trong DB (`checklist_sections`, `checklist_items`) – Admin sửa tại **Cấu hình checklist** mà không cần sửa code.

## Triển khai

### 1. Supabase
1. Tạo project tại supabase.com.
2. **SQL Editor** → chạy lần lượt các file trong `supabase/migrations/`:
   `0001_schema.sql` → `0002_seed.sql` → `0003_submit_rpc.sql` → `0004_dashboard.sql` → `0005_harden_functions.sql`
   (hoặc `supabase link` + `supabase db push`).
3. **Authentication → Providers → Email**: tắt *Confirm email* (tài khoản do Admin tạo).

### 2. Biến môi trường
Sao chép `.env.example` → `.env.local` và điền khóa từ *Project Settings → API*. Không hardcode khóa trong code.

### 3. Tạo Admin đầu tiên
```bash
npm install
node --env-file=.env.local scripts/create-admin.mjs ADMIN01 'MatKhauManh@2026' "Quản trị hệ thống"
```

### 4. Vercel
Import repo GitHub → thêm 3 biến `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → Deploy. Mỗi lần push nhánh `main` tự deploy.

### 5. Dữ liệu ban đầu
- **Cửa hàng**: Admin → Cửa hàng → *Import Excel* (mẫu `public/templates/mau-cua-hang.csv`).
- **Tài khoản**: Admin → Tài khoản → *Tạo tài khoản* (MSNV, vai trò, khu vực, tỉnh, đội trưởng).

## Phát triển
```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Cấu trúc
```
src/app/(app)/          Trang sau đăng nhập (dashboard, inspections, plans, stores, admin, profile)
src/app/api/            PDF biên bản, xuất Excel
src/components/inspection/  Form checklist, chụp ảnh, chọn cửa hàng
src/lib/                Supabase client, quyền, hằng số, PDF
supabase/migrations/    Schema + RLS + Storage + seed + RPC
```

## Quy mô
Thiết kế cho 15.000 cửa hàng: tìm cửa hàng truy vấn server (không tải toàn bộ), thống kê tổng hợp bằng hàm SQL, index theo cửa hàng/ngày/loại, phân trang danh sách, ảnh nén ~1600px trước khi tải lên.
