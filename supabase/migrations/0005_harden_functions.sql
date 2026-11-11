-- Chặn anon gọi các hàm SECURITY DEFINER; hàm trigger/nội bộ không cho gọi qua API
revoke execute on function public.my_role(), public.my_region(), public.my_team_lead(), public.is_global(),
  public.can_see_store(uuid), public.can_manage_store(uuid), public.can_see_profile(uuid) from public, anon;
grant execute on function public.my_role(), public.my_region(), public.my_team_lead(), public.is_global(),
  public.can_see_store(uuid), public.can_manage_store(uuid), public.can_see_profile(uuid) to authenticated;
revoke execute on function public.recalc_inspection(uuid), public.trg_items_recalc(),
  public.trg_profiles_guard(), public.trg_inspection_guard() from public, anon, authenticated;
revoke execute on function public.submit_inspection(jsonb), public.dashboard_stats(public.inspection_type, int),
  public.maintenance_due(int) from public, anon;
