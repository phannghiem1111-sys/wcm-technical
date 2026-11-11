-- =====================================================================
-- DASHBOARD: thống kê tổng hợp phía DB (RLS áp dụng theo người gọi)
-- =====================================================================
create or replace function public.dashboard_stats(p_type public.inspection_type default null, p_months int default 6)
returns jsonb language sql stable security invoker set search_path = public as $$
  with base as (
    select * from public.v_inspections
    where (p_type is null or form_type = p_type)
      and inspection_date >= (date_trunc('month', current_date) - make_interval(months => p_months - 1))::date
  ),
  defects as (
    select d.* from public.v_defects d
    where (p_type is null or d.form_type = p_type)
      and d.inspection_date >= (date_trunc('month', current_date) - make_interval(months => p_months - 1))::date
  )
  select jsonb_build_object(
    'total', (select count(*) from base),
    'avg_score', (select coalesce(round(avg(score), 1), 0) from base),
    'this_month', (select count(*) from base where inspection_date >= date_trunc('month', current_date)::date),
    'defects', (select coalesce(sum(fail_items), 0) from base),
    'urgent', (select coalesce(sum(urgent_items), 0) from base),
    'pending', (select count(*) from base where status = 'submitted'),
    'stores', (select count(distinct store_id) from base),
    'by_type', (select coalesce(jsonb_object_agg(form_type, jsonb_build_object('count', c, 'avg', a)), '{}') from (
        select form_type, count(*) c, round(avg(score), 1) a from base group by form_type) t),
    'by_month', (select coalesce(jsonb_agg(t order by t.month), '[]') from (
        select to_char(date_trunc('month', inspection_date), 'YYYY-MM') as month,
          count(*) filter (where form_type = 'nso') nso,
          count(*) filter (where form_type = 'periodic') periodic,
          count(*) filter (where form_type = 'maintenance') maintenance,
          round(avg(score), 1) avg_score
        from base group by 1) t),
    'top_defects', (select coalesce(jsonb_agg(t), '[]') from (
        select item_text, section_title, count(*) cnt,
          count(*) filter (where result in ('urgent', 'broken')) urgent
        from defects group by item_text, section_title order by count(*) desc limit 10) t),
    'by_region', (select coalesce(jsonb_agg(t order by t.cnt desc), '[]') from (
        select coalesce(region_name, 'Chưa phân vùng') region, count(*) cnt, round(avg(score), 1) avg_score, sum(fail_items) defects
        from base group by 1) t),
    'by_result', (select coalesce(jsonb_object_agg(result, c), '{}') from (
        select result, count(*) c from defects group by result) t)
  )
$$;
grant execute on function public.dashboard_stats(public.inspection_type, int) to authenticated;

-- Thiết bị/cửa hàng đến hạn bảo trì theo tần suất cấu hình
create or replace function public.maintenance_due(p_limit int default 20)
returns table(store_id uuid, store_code text, store_name text, last_date date, interval_days int, due_date date)
language sql stable security invoker set search_path = public as $$
  with freq as (select min(interval_days) d from public.maintenance_frequencies),
  last as (
    select s.id, s.code, s.name, max(i.inspection_date) last_date
    from public.stores s
    left join public.inspections i on i.store_id = s.id and i.form_type = 'maintenance'
    where s.is_active
    group by s.id, s.code, s.name
  )
  select l.id, l.code, l.name, l.last_date, (select d from freq),
    coalesce(l.last_date + (select d from freq), current_date) due
  from last l
  where l.last_date is null or l.last_date + (select d from freq) <= current_date + 7
  order by due nulls first, l.code
  limit p_limit
$$;
grant execute on function public.maintenance_due(int) to authenticated;
