-- Thông tin liên hệ cửa hàng: email nhận báo cáo, điện thoại, CHT/CHP, tọa độ
alter table public.stores
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists manager_name text,
  add column if not exists model text,
  add column if not exists status_note text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;
create index if not exists stores_name_trgm_idx on public.stores (lower(name));

-- Email mà biên bản đã được gửi tới (để biết gửi thành công hay chưa)
alter table public.inspections
  add column if not exists emailed_at timestamptz,
  add column if not exists email_status text;

-- Email liên hệ của nhân viên (nhận bản sao biên bản)
alter table public.profiles add column if not exists contact_email text;
