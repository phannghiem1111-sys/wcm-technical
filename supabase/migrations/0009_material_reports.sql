-- =====================================================================
-- BIÊN BẢN VẬT TƯ (theo mẫu app Biên Bản Vật Tư MN)
-- Danh mục vật tư + biên bản + dòng vật tư thay thế. Lưu xong là hoàn tất.
-- =====================================================================

-- Danh mục vật tư (admin nhập/dán từ Excel)
create table if not exists public.materials (
  code text primary key,
  name text not null,
  unit text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists materials_name_idx on public.materials (lower(name));

create sequence if not exists public.material_report_no_seq;

create table if not exists public.material_reports (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('VT-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.material_report_no_seq')::text, 5, '0')),
  store_id uuid not null references public.stores(id),
  store_code text not null,
  reporter_id uuid not null references public.profiles(id) default auth.uid(),
  report_at timestamptz not null default now(),
  subject text,                 -- V/v (tự lấy dòng đầu nội dung)
  category text not null,       -- hạng mục
  category_other text,
  ticket_code text,
  store_manager_name text,      -- cửa hàng trưởng
  email_to text,                -- email nhận nhập tay (nhiều email cách nhau dấu phẩy)
  incident text not null,       -- 1. Nội dung sự việc
  solution text not null,       -- 2. Biện pháp xử lý
  proposal text not null,       -- 4. Đề xuất: Xuất kho / Mua mới / Bảo hành
  photos_before text[] not null default '{}',
  photos_after text[] not null default '{}',
  signature_reporter text,
  signature_store text,
  emailed_at timestamptz,
  email_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists material_reports_store_idx on public.material_reports(store_id);
create index if not exists material_reports_reporter_idx on public.material_reports(reporter_id);
create index if not exists material_reports_date_idx on public.material_reports(report_at desc);

create table if not exists public.material_report_items (
  id bigserial primary key,
  report_id uuid not null references public.material_reports(id) on delete cascade,
  sort int not null default 0,
  material_code text,
  material_name text not null,
  unit text,
  qty numeric(12,2) not null default 0
);
create index if not exists material_report_items_report_idx on public.material_report_items(report_id);

alter table public.materials enable row level security;
alter table public.material_reports enable row level security;
alter table public.material_report_items enable row level security;

drop policy if exists materials_read on public.materials;
drop policy if exists materials_admin on public.materials;
create policy materials_read on public.materials for select to authenticated using (true);
create policy materials_admin on public.materials for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

drop policy if exists mr_read on public.material_reports;
drop policy if exists mr_insert on public.material_reports;
drop policy if exists mr_update on public.material_reports;
drop policy if exists mr_delete on public.material_reports;
create policy mr_read on public.material_reports for select to authenticated using (
  reporter_id = auth.uid() or (public.my_role() <> 'nhan_vien' and public.can_see_store(store_id)));
create policy mr_insert on public.material_reports for insert to authenticated with check (
  reporter_id = auth.uid() and public.can_see_store(store_id));
create policy mr_update on public.material_reports for update to authenticated using (
  reporter_id = auth.uid() or public.can_manage_store(store_id));
create policy mr_delete on public.material_reports for delete to authenticated using (public.my_role() = 'admin');

drop policy if exists mri_read on public.material_report_items;
drop policy if exists mri_write on public.material_report_items;
create policy mri_read on public.material_report_items for select to authenticated using (
  exists (select 1 from public.material_reports r where r.id = report_id));
create policy mri_write on public.material_report_items for all to authenticated using (
  exists (select 1 from public.material_reports r where r.id = report_id and (r.reporter_id = auth.uid() or public.can_manage_store(r.store_id))))
  with check (exists (select 1 from public.material_reports r where r.id = report_id and (r.reporter_id = auth.uid() or public.can_manage_store(r.store_id))));

-- Cho người xem được biên bản vật tư cũng xem được ảnh / chữ ký của nó
drop policy if exists files_read on storage.objects;
create policy files_read on storage.objects for select to authenticated using (
  bucket_id = 'inspection-files' and (
    owner_id = auth.uid()::text
    or exists (select 1 from public.inspection_photos p where p.path = name)
    or exists (select 1 from public.inspections i where i.signature_inspector = name or i.signature_store = name)
    or exists (select 1 from public.material_reports r where name = any(r.photos_before) or name = any(r.photos_after)
               or r.signature_reporter = name or r.signature_store = name)));

-- Lưu biên bản vật tư (tạo mới hoặc sửa) + thay toàn bộ dòng vật tư
create or replace function public.save_material_report(payload jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := coalesce(nullif(payload->>'id', '')::uuid, gen_random_uuid());
  v_store public.stores%rowtype;
begin
  select * into v_store from public.stores where id = (payload->>'store_id')::uuid;
  if not found then raise exception 'Không tìm thấy cửa hàng hoặc không có quyền'; end if;

  insert into public.material_reports (id, store_id, store_code, report_at, subject, category, category_other, ticket_code,
    store_manager_name, email_to, incident, solution, proposal, photos_before, photos_after, signature_reporter, signature_store)
  values (v_id, v_store.id, v_store.code, coalesce((payload->>'report_at')::timestamptz, now()), payload->>'subject',
    payload->>'category', nullif(payload->>'category_other', ''), nullif(payload->>'ticket_code', ''),
    nullif(payload->>'store_manager_name', ''), nullif(payload->>'email_to', ''), payload->>'incident', payload->>'solution',
    payload->>'proposal',
    coalesce(array(select jsonb_array_elements_text(payload->'photos_before')), '{}'),
    coalesce(array(select jsonb_array_elements_text(payload->'photos_after')), '{}'),
    nullif(payload->>'signature_reporter', ''), nullif(payload->>'signature_store', ''))
  on conflict (id) do update set
    store_id = excluded.store_id, store_code = excluded.store_code, report_at = excluded.report_at, subject = excluded.subject,
    category = excluded.category, category_other = excluded.category_other, ticket_code = excluded.ticket_code,
    store_manager_name = excluded.store_manager_name, email_to = excluded.email_to, incident = excluded.incident,
    solution = excluded.solution, proposal = excluded.proposal, photos_before = excluded.photos_before,
    photos_after = excluded.photos_after,
    signature_reporter = coalesce(excluded.signature_reporter, material_reports.signature_reporter),
    signature_store = coalesce(excluded.signature_store, material_reports.signature_store),
    updated_at = now();

  delete from public.material_report_items where report_id = v_id;
  insert into public.material_report_items (report_id, sort, material_code, material_name, unit, qty)
  select v_id, row_number() over () - 1, nullif(x.material_code, ''), x.material_name, nullif(x.unit, ''), coalesce(x.qty, 0)
  from jsonb_to_recordset(coalesce(payload->'items', '[]'::jsonb)) as x(material_code text, material_name text, unit text, qty numeric)
  where coalesce(trim(x.material_name), '') <> '';

  return v_id;
end $$;
revoke execute on function public.save_material_report(jsonb) from public, anon;
grant execute on function public.save_material_report(jsonb) to authenticated;

create or replace view public.v_material_reports with (security_invoker = true) as
select r.*, s.name as store_name, s.address as store_address, s.province, s.email as store_email,
       p.full_name as reporter_name, p.msnv as reporter_msnv, p.title as reporter_title,
       (select count(*) from public.material_report_items it where it.report_id = r.id) as item_count
from public.material_reports r
join public.stores s on s.id = r.store_id
left join public.profiles p on p.id = r.reporter_id;
