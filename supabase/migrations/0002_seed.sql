-- =====================================================================
-- SEED: Khu vực + nội dung checklist (theo biểu mẫu gốc index.html)
-- =====================================================================
insert into public.regions (code, name) values
  ('HCM', 'TP. Hồ Chí Minh'), ('MD', 'Miền Đông'), ('MT', 'Miền Tây'),
  ('MTR', 'Miền Trung'), ('HN', 'Hà Nội'), ('MB', 'Miền Bắc')
on conflict (code) do nothing;

-- ---------- NSO: 17 nội dung ----------
with s as (
  insert into public.checklist_sections (form_type, code, title, sort) values
    ('nso', 'NSO-I', 'I. NGOẠI THẤT, MẶT TIỀN & BIỂN HIỆU', 1),
    ('nso', 'NSO-II', 'II. NỘI THẤT, QUẦY KỆ & LAYOUT', 2),
    ('nso', 'NSO-III', 'III. HỆ THỐNG CƠ ĐIỆN & LẠNH', 3),
    ('nso', 'NSO-IV', 'IV. AN TOÀN, PCCC & AN NINH', 4)
  returning id, code
)
insert into public.checklist_items (section_id, code, text, sort)
select s.id, v.code, v.text, v.sort from s join (values
  ('NSO-I', 'nso_1', 'Biển hiệu Alu, bạt hiflex căng phẳng, đúng thiết kế, không rách/móp.', 1),
  ('NSO-I', 'nso_2', 'Đèn LED hắt sáng chữ nổi LOGO hoạt động 100%, không nháy.', 2),
  ('NSO-I', 'nso_3', 'Cửa kính cường lực cân đối, tay co thủy lực đóng mở êm ái.', 3),
  ('NSO-I', 'nso_4', 'Bậc tam cấp, dốc xe phẳng, lát gạch nhám an toàn.', 4),
  ('NSO-I', 'nso_5', 'Kiểm tra hệ thống mái tole, máng thoát nước, chống dột.', 5),
  ('NSO-I', 'nso_6', 'Kiểm tra hệ thống cửa cuốn, cửa kéo tình trạng vận hành, chất lượng thi công.', 6),
  ('NSO-II', 'nso_7', 'Trần thạch cao phẳng, sơn trắng, không ố mốc.', 1),
  ('NSO-II', 'nso_8', 'Sàn gạch Ceramic phẳng mịn, ron gạch thẳng đều.', 2),
  ('NSO-II', 'nso_9', 'Kiểm tra hệ thống quầy tính tiền, kệ treo, bồn rửa thiết bị lắp đặt đúng mẫu thiết kế.', 3),
  ('NSO-II', 'nso_10', 'Kiểm tra decal dán tường, logo hình ảnh đồng bộ nhận diện thiết kế.', 4),
  ('NSO-II', 'nso_11', 'Kiểm tra thiết bị nhà vệ sinh (WC), chất lượng và chủng loại thiết bị lắp đặt.', 5),
  ('NSO-III', 'nso_12', 'Tủ đông, tủ mát trưng bày đạt nhiệt độ vận hành tiêu chuẩn, không rò nước ngưng.', 1),
  ('NSO-III', 'nso_13', 'Điều hòa không khí làm lạnh nhanh, hoạt động êm, không rò rỉ nước.', 2),
  ('NSO-III', 'nso_14', 'Hệ thống chiếu sáng (đèn rọi, máng trần) đủ độ rọi tiêu chuẩn, hoạt động ổn định.', 3),
  ('NSO-III', 'nso_15', 'Kiểm tra tủ điện tổng, cân dòng 3 pha, kiểm tra các thiết bị CB, dây cấp nguồn an toàn.', 4),
  ('NSO-IV', 'nso_16', 'Kiểm tra vị trí đặt bình chữa cháy, tiêu lệnh PCCC, hạn sử dụng và tem kiểm định.', 1),
  ('NSO-IV', 'nso_17', 'Hệ thống Camera giám sát lắp đặt đúng thiết kế, góc quan sát tốt, lưu trữ trên 30 ngày.', 2)
) as v(sec, code, text, sort) on v.sec = s.code;

-- ---------- ĐỊNH KỲ: 21 nội dung ----------
with s as (
  insert into public.checklist_sections (form_type, code, title, sort) values
    ('periodic', 'PER-1', '1. BÊN NGOÀI CỬA HÀNG', 1),
    ('periodic', 'PER-2', '2. TRONG CH / KHU VỰC KINH DOANH', 2),
    ('periodic', 'PER-3', '3. QUẦY THU NGÂN & THIẾT BỊ IT', 3),
    ('periodic', 'PER-4', '4. TỦ ĐIỆN & THIẾT BỊ ĐIỆN LẠNH', 4),
    ('periodic', 'PER-5', '5. HỆ THỐNG NƯỚC, WC & PCCC', 5)
  returning id, code
)
insert into public.checklist_items (section_id, code, text, sort)
select s.id, v.code, v.text, v.sort from s join (values
  ('PER-1', 'per_1', 'Biển hiệu chính, đèn gầm biển, biển vẫy, slimled hoạt động tốt, sạch sẽ.', 1),
  ('PER-1', 'per_2', 'Khung Alu, máng thoát nước biển không bong tróc, tắc nghẽn.', 2),
  ('PER-1', 'per_3', 'Camera ngoại vi góc nhìn chuẩn, hoạt động ghi hình ổn định.', 3),
  ('PER-1', 'per_4', 'Vỉa hè, bậc lên xuống không nứt vỡ, đảm bảo an toàn.', 4),
  ('PER-1', 'per_5', 'Mái tôn, sàn để xe, cửa cuốn điện/kéo tay vận hành trơn tru.', 5),
  ('PER-1', 'per_6', 'Cửa kính, vách kính (bản lề, tay nắm, khóa chân, smartkey) an toàn.', 6),
  ('PER-2', 'per_7', 'Quầy kệ hàng, kệ rau, đèn khu vực Hibeauty chắc chắn, trưng bày gọn gàng.', 1),
  ('PER-2', 'per_8', 'Tường, trần, sàn nhà vệ sinh sạch sẽ, không bong tróc ố bẩn.', 2),
  ('PER-2', 'per_9', 'Đèn chiếu sáng (LED, rọi), đèn bắt côn trùng, đèn kho/nhà vệ sinh hoạt động tốt.', 3),
  ('PER-2', 'per_10', 'Kiểm tra phần Quảng cáo, nhận diện thương hiệu, decal dán chuẩn chỉ.', 4),
  ('PER-3', 'per_11', 'Quầy trước/sau thu ngân, các bản lề tủ cứng cáp.', 1),
  ('PER-3', 'per_12', 'Kệ treo, menuboard, bồn rửa tay sạch sẽ.', 2),
  ('PER-3', 'per_13', 'Két sắt, két thu ngân an toàn, khóa cẩn thận.', 3),
  ('PER-3', 'per_14', 'Thiết bị ĐT: Máy tính CHT, Máy in, Cân điện tử, UPS hoạt động bình thường.', 4),
  ('PER-3', 'per_15', 'Máy in bill, máy POS, thiết bị mạng, ổ cắm dây điện đấu nối gọn gàng an toàn.', 5),
  ('PER-4', 'per_16', 'Tivi Quảng cáo, Tivi camera, đầu ghi camera ghi hình tốt.', 1),
  ('PER-4', 'per_17', 'Hệ thống trang thiết bị lạnh hoạt động đúng công suất, không đóng tuyết.', 2),
  ('PER-4', 'per_18', 'Tủ điện tổng, tủ mạng, quạt trần, quạt thông gió an toàn không chập cháy.', 3),
  ('PER-5', 'per_19', 'Hệ thống cấp thoát nước, chậu rửa, bồn cầu (không tắc nghẽn, rò rỉ).', 1),
  ('PER-5', 'per_20', 'Kho, lối thoát hiểm thông thoáng, không cản trở.', 2),
  ('PER-5', 'per_21', 'Hệ thống bình chữa cháy, tiêu lệnh PCCC còn hạn và đúng vị trí.', 3)
) as v(sec, code, text, sort) on v.sec = s.code;

-- ---------- BẢO TRÌ: 7 nhóm thiết bị, mỗi nhóm có công việc chuẩn ----------
with s as (
  insert into public.checklist_sections (form_type, code, title, sort, equipment_label, default_count) values
    ('maintenance', 'MT-AC', 'A. BẢO TRÌ MÁY LẠNH (ĐIỀU HÒA)', 1, 'Máy lạnh (Điều hòa)', 2),
    ('maintenance', 'MT-CH', 'B. BẢO TRÌ TỦ MÁT', 2, 'Tủ mát trưng bày', 2),
    ('maintenance', 'MT-FR', 'C. BẢO TRÌ TỦ ĐÔNG', 3, 'Tủ đông trưng bày', 1),
    ('maintenance', 'MT-EL', 'D. HỆ THỐNG ĐIỆN', 4, 'Tủ điện', 0),
    ('maintenance', 'MT-SG', 'E. BIỂN HIỆU', 5, 'Biển hiệu', 0),
    ('maintenance', 'MT-LT', 'F. HỆ THỐNG CHIẾU SÁNG', 6, 'Khu vực chiếu sáng', 0),
    ('maintenance', 'MT-OT', 'G. CÁC HẠNG MỤC KỸ THUẬT KHÁC', 7, 'Hạng mục', 0)
  returning id, code
)
insert into public.checklist_items (section_id, code, text, sort)
select s.id, v.code, v.text, v.sort from s join (values
  ('MT-AC', 'mt_ac_1', 'Vệ sinh sạch sẽ lưới lọc bụi, mặt nạ, dàn lạnh và dàn nóng.', 1),
  ('MT-AC', 'mt_ac_2', 'Kiểm tra áp suất gas tĩnh/động, dò tìm rò rỉ và nạp bổ sung nếu hệ thống thiếu hụt.', 2),
  ('MT-AC', 'mt_ac_3', 'Đo dòng điện (Ampe) khi hoạt động, kiểm tra điện áp cấp, siết chặt các tiếp điểm tủ điện.', 3),
  ('MT-CH', 'mt_ch_1', 'Vệ sinh dàn ngưng, dàn lạnh, quạt; kiểm tra gioăng cửa.', 1),
  ('MT-CH', 'mt_ch_2', 'Kiểm tra nhiệt độ vận hành, máy nén, đường ống gas.', 2),
  ('MT-CH', 'mt_ch_3', 'Kiểm tra máng và đường thoát nước ngưng.', 3),
  ('MT-FR', 'mt_fr_1', 'Xả đá, vệ sinh dàn lạnh, dàn ngưng, quạt.', 1),
  ('MT-FR', 'mt_fr_2', 'Kiểm tra nhiệt độ vận hành, máy nén, đường ống gas.', 2),
  ('MT-FR', 'mt_fr_3', 'Kiểm tra gioăng cửa, thoát nước.', 3),
  ('MT-EL', 'mt_el_1', 'Siết lại đầu cos, tiếp điểm CB/MCCB; vệ sinh tủ điện.', 1),
  ('MT-EL', 'mt_el_2', 'Đo dòng, cân pha, kiểm tra tiếp địa và chống giật.', 2),
  ('MT-SG', 'mt_sg_1', 'Vệ sinh mặt biển, kiểm tra khung, bạt, alu.', 1),
  ('MT-SG', 'mt_sg_2', 'Kiểm tra LED, nguồn, timer biển hiệu.', 2),
  ('MT-LT', 'mt_lt_1', 'Kiểm tra, thay thế bóng/máng đèn hư hỏng.', 1),
  ('MT-LT', 'mt_lt_2', 'Vệ sinh máng đèn, kiểm tra độ rọi.', 2),
  ('MT-OT', 'mt_ot_1', 'Kiểm tra, xử lý hạng mục kỹ thuật phát sinh.', 1)
) as v(sec, code, text, sort) on v.sec = s.code;

insert into public.maintenance_frequencies (section_id, interval_days)
select id, case code when 'MT-AC' then 90 when 'MT-CH' then 60 when 'MT-FR' then 60 when 'MT-EL' then 180 else 180 end
from public.checklist_sections where form_type = 'maintenance'
on conflict do nothing;
