-- Bỏ bước duyệt: biên bản lưu xong là hoàn tất (status 'approved')
create or replace function public.submit_inspection(payload jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := coalesce((payload->>'id')::uuid, gen_random_uuid());
  v_store public.stores%rowtype;
  v_msnv text;
begin
  select * into v_store from public.stores where id = (payload->>'store_id')::uuid;
  if not found then raise exception 'Không tìm thấy cửa hàng hoặc không có quyền'; end if;
  select msnv into v_msnv from public.profiles where id = auth.uid();

  insert into public.inspections (id, form_type, store_id, store_code, inspector_id, plan_id, inspection_date, status,
    overall_note, device_config, store_rep_name, signature_inspector, signature_store)
  values (v_id, (payload->>'form_type')::public.inspection_type, v_store.id, v_store.code, auth.uid(),
    nullif(payload->>'plan_id', '')::uuid, coalesce((payload->>'inspection_date')::date, current_date), 'approved',
    payload->>'overall_note', payload->'device_config', payload->>'store_rep_name',
    payload->>'signature_inspector', payload->>'signature_store');

  insert into public.inspection_items (inspection_id, item_key, section_title, item_text, result, note, proposal,
    equipment_name, model, before_status, work_done, materials, after_status, completion, sort)
  select v_id, x.item_key, x.section_title, x.item_text, nullif(x.result, '')::public.item_result, x.note, x.proposal,
    x.equipment_name, x.model, x.before_status, x.work_done, x.materials, x.after_status, x.completion, coalesce(x.sort, 0)
  from jsonb_to_recordset(coalesce(payload->'items', '[]'::jsonb)) as x(item_key text, section_title text, item_text text,
    result text, note text, proposal text, equipment_name text, model text, before_status text, work_done text,
    materials text, after_status text, completion text, sort int);

  insert into public.inspection_photos (inspection_id, item_key, path, caption, phase, store_code, msnv, form_type, defect, taken_at)
  select v_id, x.item_key, x.path, x.caption, coalesce(x.phase, 'normal'), v_store.code, coalesce(v_msnv, ''),
    (payload->>'form_type')::public.inspection_type, x.defect, coalesce(x.taken_at, now())
  from jsonb_to_recordset(coalesce(payload->'photos', '[]'::jsonb)) as x(item_key text, path text, caption text,
    phase text, defect text, taken_at timestamptz);

  return v_id;
end $$;

update public.inspections set status = 'approved' where status = 'submitted';
