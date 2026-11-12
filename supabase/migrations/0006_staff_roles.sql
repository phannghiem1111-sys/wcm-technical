-- Miền Nam (file nhân sự dùng 4 miền: Bắc / Trung / Nam / Tây)
insert into public.regions (code, name) values ('MN', 'Miền Nam') on conflict (code) do nothing;

-- Đổi mật khẩu lần đầu + trưởng bộ phận phụ trách nhiều miền
alter table public.profiles
  add column if not exists must_change_password boolean not null default false,
  add column if not exists extra_region_ids int[] not null default '{}';

create or replace function public.my_regions() returns int[]
language sql stable security definer set search_path = public as $$
  select array_remove(array[region_id] || extra_region_ids, null) from public.profiles where id = auth.uid()
$$;
revoke execute on function public.my_regions() from public, anon;
grant execute on function public.my_regions() to authenticated;

create or replace function public.can_see_store(s_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.my_role()
    when 'admin' then true
    when 'truong_phong' then true
    when 'truong_bo_phan' then exists (select 1 from stores s where s.id = s_id and s.region_id = any(public.my_regions()))
    when 'doi_truong' then exists (select 1 from stores s where s.id = s_id and (s.team_lead_id = auth.uid()))
    when 'nhan_vien' then exists (
      select 1 from stores s where s.id = s_id
      and (s.staff_id = auth.uid() or s.team_lead_id = public.my_team_lead()
           or exists (select 1 from plan_stores ps where ps.store_id = s.id and ps.assignee_id = auth.uid())))
    else false end
$$;

create or replace function public.can_manage_store(s_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.my_role()
    when 'admin' then true
    when 'truong_bo_phan' then exists (select 1 from stores s where s.id = s_id and s.region_id = any(public.my_regions()))
    when 'doi_truong' then exists (select 1 from stores s where s.id = s_id and s.team_lead_id = auth.uid())
    else false end
$$;

create or replace function public.can_see_profile(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_id = auth.uid() or case public.my_role()
    when 'admin' then true
    when 'truong_phong' then true
    when 'truong_bo_phan' then exists (select 1 from profiles p where p.id = p_id and p.region_id = any(public.my_regions()))
    when 'doi_truong' then exists (select 1 from profiles p where p.id = p_id and (p.team_lead_id = auth.uid()))
    when 'nhan_vien' then exists (select 1 from profiles p where p.id = p_id and p.id = public.my_team_lead())
    else false end
$$;

drop policy if exists plans_read on public.inspection_plans;
create policy plans_read on public.inspection_plans for select to authenticated using (
  public.is_global() or region_id is null or region_id = any(public.my_regions())
  or exists (select 1 from public.plan_stores ps where ps.plan_id = inspection_plans.id and public.can_see_store(ps.store_id)));

-- Người dùng thường không tự đổi vùng phụ trách; chỉ được tự tắt cờ must_change_password
create or replace function public.trg_profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.my_role()::text, '') <> 'admin' then
    if new.role is distinct from old.role or new.status is distinct from old.status
       or new.msnv is distinct from old.msnv or new.region_id is distinct from old.region_id
       or new.team_lead_id is distinct from old.team_lead_id
       or new.extra_region_ids is distinct from old.extra_region_ids
       or (new.must_change_password and not old.must_change_password) then
      raise exception 'Không có quyền thay đổi thông tin này';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
