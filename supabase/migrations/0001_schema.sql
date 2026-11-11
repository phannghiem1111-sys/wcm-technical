-- =====================================================================
-- WCM TECHNICAL - WinCommerce Technical Management System
-- Schema, RLS, Storage. Run on a fresh Supabase project (SQL editor or
-- `supabase db push`).
-- =====================================================================


-- ---------- ENUMS ----------
create type public.app_role as enum ('admin', 'truong_phong', 'truong_bo_phan', 'doi_truong', 'nhan_vien');
create type public.account_status as enum ('active', 'locked');
create type public.inspection_type as enum ('nso', 'periodic', 'maintenance');
create type public.inspection_status as enum ('draft', 'submitted', 'approved', 'rejected');
-- pass/fail/na: NSO | pass/fail/monitor/urgent: định kỳ | good/maintenance/broken: bảo trì
create type public.item_result as enum ('pass', 'fail', 'na', 'monitor', 'urgent', 'good', 'maintenance', 'broken');
create type public.plan_period as enum ('month', 'quarter', 'year', 'campaign');

-- ---------- MASTER DATA ----------
create table public.regions (
  id serial primary key,
  code text unique not null,
  name text not null
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  msnv text unique not null,
  full_name text not null,
  title text,
  role public.app_role not null default 'nhan_vien',
  region_id int references public.regions(id),
  province text,
  team_lead_id uuid references public.profiles(id),
  phone text,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.profiles(team_lead_id);
create index on public.profiles(region_id);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  province text,
  region_id int references public.regions(id),
  team_lead_id uuid references public.profiles(id),
  staff_id uuid references public.profiles(id),
  open_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.stores(region_id);
create index on public.stores(team_lead_id);
create index on public.stores(staff_id);

-- ---------- CHECKLIST TEMPLATES (cấu hình form) ----------
create table public.checklist_sections (
  id serial primary key,
  form_type public.inspection_type not null,
  code text not null,
  title text not null,
  sort int not null default 0,
  -- bảo trì: nhóm thiết bị (1..7), mỗi section là 1 nhóm, item = công việc chuẩn
  equipment_label text,
  default_count int not null default 0,
  is_active boolean not null default true,
  unique (form_type, code)
);

create table public.checklist_items (
  id serial primary key,
  section_id int not null references public.checklist_sections(id) on delete cascade,
  code text not null unique,
  text text not null,
  sort int not null default 0,
  is_active boolean not null default true
);

-- Tần suất bảo trì theo nhóm thiết bị (ngày)
create table public.maintenance_frequencies (
  section_id int primary key references public.checklist_sections(id) on delete cascade,
  interval_days int not null default 90,
  updated_at timestamptz not null default now()
);

-- ---------- KẾ HOẠCH KIỂM TRA ĐỊNH KỲ ----------
create table public.inspection_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period public.plan_period not null,
  form_type public.inspection_type not null default 'periodic',
  start_date date not null,
  end_date date not null,
  region_id int references public.regions(id),
  note text,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.plan_stores (
  plan_id uuid references public.inspection_plans(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  assignee_id uuid references public.profiles(id),
  due_date date,
  primary key (plan_id, store_id)
);

-- ---------- BIÊN BẢN ----------
create sequence public.inspection_no_seq;

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('BB-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.inspection_no_seq')::text, 6, '0')),
  form_type public.inspection_type not null,
  store_id uuid not null references public.stores(id),
  store_code text not null,
  inspector_id uuid not null references public.profiles(id) default auth.uid(),
  plan_id uuid references public.inspection_plans(id),
  inspection_date date not null default current_date,
  status public.inspection_status not null default 'submitted',
  overall_note text,
  device_config jsonb,
  total_items int not null default 0,
  pass_items int not null default 0,
  fail_items int not null default 0,
  urgent_items int not null default 0,
  score numeric(5,2) not null default 0,
  store_rep_name text,
  signature_inspector text,   -- storage path
  signature_store text,       -- storage path
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  approval_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.inspections(store_id);
create index on public.inspections(inspector_id);
create index on public.inspections(form_type, inspection_date desc);
create index on public.inspections(plan_id);

create table public.inspection_items (
  id bigserial primary key,
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  item_key text not null,           -- vd: nso_1, ac_2
  section_title text not null,
  item_text text not null,
  result public.item_result,
  note text,
  proposal text,                    -- đề xuất xử lý
  -- bảo trì
  equipment_name text,
  model text,
  before_status text,
  work_done text,
  materials text,
  after_status text,
  completion text,                  -- done | partial | not_done
  sort int not null default 0,
  unique (inspection_id, item_key)
);
create index on public.inspection_items(inspection_id);
create index on public.inspection_items(result);

create table public.inspection_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  item_key text not null,
  path text unique not null,
  caption text,
  phase text not null default 'normal', -- normal | before | after
  store_code text not null,
  msnv text not null,
  form_type public.inspection_type not null,
  defect text,
  taken_at timestamptz not null default now(),
  uploaded_by uuid default auth.uid() references public.profiles(id)
);
create index on public.inspection_photos(inspection_id);

-- ---------- LOGS ----------
create table public.login_logs (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  msnv text,
  success boolean not null,
  user_agent text,
  ip text,
  created_at timestamptz not null default now()
);
create index on public.login_logs(created_at desc);

create table public.password_reset_requests (
  id bigserial primary key,
  msnv text not null,
  phone text,
  note text,
  status text not null default 'pending', -- pending | done | rejected
  handled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

-- =====================================================================
-- HELPER FUNCTIONS (security definer để tránh đệ quy RLS)
-- =====================================================================
create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'active'
$$;

create or replace function public.my_region() returns int
language sql stable security definer set search_path = public as $$
  select region_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_team_lead() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(case when role = 'doi_truong' then id end, team_lead_id)
  from public.profiles where id = auth.uid()
$$;

create or replace function public.is_global() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin', 'truong_phong'), false)
$$;

-- Người dùng hiện tại có quyền xem cửa hàng không
create or replace function public.can_see_store(s_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.my_role()
    when 'admin' then true
    when 'truong_phong' then true
    when 'truong_bo_phan' then exists (select 1 from stores s where s.id = s_id and s.region_id = public.my_region())
    when 'doi_truong' then exists (select 1 from stores s where s.id = s_id and (s.team_lead_id = auth.uid()))
    when 'nhan_vien' then exists (
      select 1 from stores s where s.id = s_id
      and (s.staff_id = auth.uid() or s.team_lead_id = public.my_team_lead()
           or exists (select 1 from plan_stores ps where ps.store_id = s.id and ps.assignee_id = auth.uid())))
    else false end
$$;

-- Quản lý (duyệt/sửa) cửa hàng
create or replace function public.can_manage_store(s_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.my_role()
    when 'admin' then true
    when 'truong_bo_phan' then exists (select 1 from stores s where s.id = s_id and s.region_id = public.my_region())
    when 'doi_truong' then exists (select 1 from stores s where s.id = s_id and s.team_lead_id = auth.uid())
    else false end
$$;

create or replace function public.can_see_profile(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_id = auth.uid() or case public.my_role()
    when 'admin' then true
    when 'truong_phong' then true
    when 'truong_bo_phan' then exists (select 1 from profiles p where p.id = p_id and p.region_id = public.my_region())
    when 'doi_truong' then exists (select 1 from profiles p where p.id = p_id and (p.team_lead_id = auth.uid()))
    when 'nhan_vien' then exists (select 1 from profiles p where p.id = p_id and p.id = public.my_team_lead())
    else false end
$$;

-- Tính điểm tổng hợp biên bản từ inspection_items
create or replace function public.recalc_inspection(i_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t int; p int; f int; u int;
begin
  select count(*) filter (where result is not null and result <> 'na'),
         count(*) filter (where result in ('pass', 'good')),
         count(*) filter (where result in ('fail', 'monitor', 'urgent', 'maintenance', 'broken')),
         count(*) filter (where result in ('urgent', 'broken'))
    into t, p, f, u
  from inspection_items where inspection_id = i_id;
  update inspections set total_items = t, pass_items = p, fail_items = f, urgent_items = u,
    score = case when t > 0 then round(p * 100.0 / t, 2) else 0 end, updated_at = now()
  where id = i_id;
end $$;

create or replace function public.trg_items_recalc() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.recalc_inspection(coalesce(new.inspection_id, old.inspection_id));
  return null;
end $$;

create trigger items_recalc after insert or update or delete on public.inspection_items
for each row execute function public.trg_items_recalc();

-- Không cho người dùng tự nâng quyền / đổi dữ liệu nhạy cảm trên profile của mình
create or replace function public.trg_profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.my_role()::text, '') <> 'admin' then
    if new.role is distinct from old.role or new.status is distinct from old.status
       or new.msnv is distinct from old.msnv or new.region_id is distinct from old.region_id
       or new.team_lead_id is distinct from old.team_lead_id then
      raise exception 'Không có quyền thay đổi thông tin này';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
for each row execute function public.trg_profiles_guard();

-- Chỉ người duyệt mới được đổi trạng thái duyệt
create or replace function public.trg_inspection_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and (new.status in ('approved', 'rejected')) and new.status is distinct from old.status then
    if not public.can_manage_store(new.store_id) then
      raise exception 'Không có quyền duyệt biên bản';
    end if;
    new.approved_by := auth.uid();
    new.approved_at := now();
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger inspection_guard before update on public.inspections
for each row execute function public.trg_inspection_guard();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.regions enable row level security;
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.checklist_sections enable row level security;
alter table public.checklist_items enable row level security;
alter table public.maintenance_frequencies enable row level security;
alter table public.inspection_plans enable row level security;
alter table public.plan_stores enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_items enable row level security;
alter table public.inspection_photos enable row level security;
alter table public.login_logs enable row level security;
alter table public.password_reset_requests enable row level security;

-- regions / templates: ai đăng nhập cũng đọc được, admin sửa
create policy regions_read on public.regions for select to authenticated using (true);
create policy regions_admin on public.regions for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

create policy sections_read on public.checklist_sections for select to authenticated using (true);
create policy sections_admin on public.checklist_sections for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy items_tpl_read on public.checklist_items for select to authenticated using (true);
create policy items_tpl_admin on public.checklist_items for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy freq_read on public.maintenance_frequencies for select to authenticated using (true);
create policy freq_admin on public.maintenance_frequencies for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- profiles
create policy profiles_read on public.profiles for select to authenticated using (public.can_see_profile(id));
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid() or public.my_role() = 'admin') with check (id = auth.uid() or public.my_role() = 'admin');
create policy profiles_admin_insert on public.profiles for insert to authenticated with check (public.my_role() = 'admin');
create policy profiles_admin_delete on public.profiles for delete to authenticated using (public.my_role() = 'admin');

-- stores
create policy stores_read on public.stores for select to authenticated using (public.can_see_store(id));
create policy stores_write on public.stores for insert to authenticated with check (public.my_role() in ('admin', 'truong_bo_phan'));
create policy stores_update on public.stores for update to authenticated using (public.can_manage_store(id)) with check (public.can_manage_store(id));
create policy stores_delete on public.stores for delete to authenticated using (public.my_role() = 'admin');

-- plans
create policy plans_read on public.inspection_plans for select to authenticated using (
  public.is_global() or region_id is null or region_id = public.my_region()
  or exists (select 1 from public.plan_stores ps where ps.plan_id = inspection_plans.id and public.can_see_store(ps.store_id)));
create policy plans_write on public.inspection_plans for insert to authenticated with check (public.my_role() in ('admin', 'truong_phong', 'truong_bo_phan', 'doi_truong'));
create policy plans_update on public.inspection_plans for update to authenticated using (public.my_role() = 'admin' or created_by = auth.uid());
create policy plans_delete on public.inspection_plans for delete to authenticated using (public.my_role() = 'admin' or created_by = auth.uid());

create policy plan_stores_read on public.plan_stores for select to authenticated using (public.can_see_store(store_id));
create policy plan_stores_write on public.plan_stores for all to authenticated
  using (public.my_role() = 'admin' or public.can_manage_store(store_id) or public.my_role() = 'truong_phong')
  with check (public.my_role() = 'admin' or public.can_manage_store(store_id) or public.my_role() = 'truong_phong');

-- inspections
create policy insp_read on public.inspections for select to authenticated using (
  inspector_id = auth.uid() or (public.my_role() <> 'nhan_vien' and public.can_see_store(store_id)));
create policy insp_insert on public.inspections for insert to authenticated with check (
  inspector_id = auth.uid() and public.can_see_store(store_id));
create policy insp_update on public.inspections for update to authenticated using (
  (inspector_id = auth.uid() and status in ('draft', 'submitted', 'rejected')) or public.can_manage_store(store_id));
create policy insp_delete on public.inspections for delete to authenticated using (public.my_role() = 'admin');

create policy ii_read on public.inspection_items for select to authenticated using (
  exists (select 1 from public.inspections i where i.id = inspection_id));
create policy ii_write on public.inspection_items for all to authenticated using (
  exists (select 1 from public.inspections i where i.id = inspection_id and (i.inspector_id = auth.uid() or public.can_manage_store(i.store_id))))
  with check (exists (select 1 from public.inspections i where i.id = inspection_id and (i.inspector_id = auth.uid() or public.can_manage_store(i.store_id))));

create policy ip_read on public.inspection_photos for select to authenticated using (
  exists (select 1 from public.inspections i where i.id = inspection_id));
create policy ip_write on public.inspection_photos for insert to authenticated with check (
  exists (select 1 from public.inspections i where i.id = inspection_id and i.inspector_id = auth.uid()));
create policy ip_delete on public.inspection_photos for delete to authenticated using (
  uploaded_by = auth.uid() or public.my_role() = 'admin');

-- logs: admin xem, user tự xem của mình; insert qua server (service role)
create policy logs_read on public.login_logs for select to authenticated using (public.my_role() = 'admin' or user_id = auth.uid());
create policy prr_admin on public.password_reset_requests for all to authenticated using (public.my_role() in ('admin', 'doi_truong')) with check (public.my_role() in ('admin', 'doi_truong'));

-- =====================================================================
-- STORAGE (bucket private, truy cập qua signed URL)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inspection-files', 'inspection-files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'inspection-files');
create policy files_read on storage.objects for select to authenticated using (
  bucket_id = 'inspection-files' and (
    owner_id = auth.uid()::text
    or exists (select 1 from public.inspection_photos p where p.path = name)
    or exists (select 1 from public.inspections i where i.signature_inspector = name or i.signature_store = name)));
create policy files_delete on storage.objects for delete to authenticated using (
  bucket_id = 'inspection-files' and (owner_id = auth.uid()::text or public.my_role() = 'admin'));

-- =====================================================================
-- DASHBOARD VIEW (RLS áp dụng theo người gọi)
-- =====================================================================
create or replace view public.v_inspections with (security_invoker = true) as
select i.*, s.name as store_name, s.address as store_address, s.province, s.region_id,
       r.name as region_name, p.full_name as inspector_name, p.msnv as inspector_msnv
from public.inspections i
join public.stores s on s.id = i.store_id
left join public.regions r on r.id = s.region_id
left join public.profiles p on p.id = i.inspector_id;

create or replace view public.v_defects with (security_invoker = true) as
select ii.id, ii.inspection_id, ii.section_title, ii.item_text, ii.result, ii.note, ii.proposal,
       i.form_type, i.inspection_date, i.store_code, s.region_id
from public.inspection_items ii
join public.inspections i on i.id = ii.inspection_id
join public.stores s on s.id = i.store_id
where ii.result in ('fail', 'monitor', 'urgent', 'maintenance', 'broken');
