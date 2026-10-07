CREATE OR REPLACE FUNCTION public.build_delivery(_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a attempts; t tests; ids uuid[] := '{}'::uuid[]; part uuid[]; subj text; opts jsonb := '{}'::jsonb; q record; idx int[];
begin
  select * into a from attempts where id = _attempt_id;
  if a.id is null then return '{}'::jsonb; end if;
  select * into t from tests where id = a.test_id;

  if t.multi_subject then
    foreach subj in array (t.compulsory_subjects || a.chosen_subjects) loop
      select coalesce(array_agg(x.id order by x.r), '{}'::uuid[]) into part from (
        select id, random() as r from questions where test_id = a.test_id and lower(subject) = lower(subj)
        order by r limit greatest(t.per_subject_count,1)) x;
      if not t.shuffle_questions then
        select coalesce(array_agg(id order by position, created_at), '{}'::uuid[]) into part
          from questions where id = any(part);
      end if;
      ids := ids || part;
    end loop;
  else
    if coalesce(t.draw_count, 0) > 0 then
      select coalesce(array_agg(x.id order by x.r), '{}'::uuid[]) into ids from (
        select id, random() as r from questions where test_id = a.test_id order by r limit t.draw_count) x;
      if not t.shuffle_questions then
        select coalesce(array_agg(id order by position, created_at), '{}'::uuid[]) into ids
          from questions where id = any(ids);
      end if;
    elsif t.shuffle_questions then
      select coalesce(array_agg(id order by random()), '{}'::uuid[]) into ids
        from questions where test_id = a.test_id;
    else
      select coalesce(array_agg(id order by position, created_at), '{}'::uuid[]) into ids
        from questions where test_id = a.test_id;
    end if;
  end if;

  for q in select id, type, options from questions where test_id = a.test_id and id = any(ids) loop
    if q.type = 'mcq' and jsonb_typeof(q.options) = 'array' and jsonb_array_length(q.options) > 0 then
      if t.shuffle_options then
        select array_agg(i order by random()) into idx from generate_series(0, jsonb_array_length(q.options) - 1) as i;
      else
        select array_agg(i order by i) into idx from generate_series(0, jsonb_array_length(q.options) - 1) as i;
      end if;
      opts := opts || jsonb_build_object(q.id::text, to_jsonb(idx));
    end if;
  end loop;

  update attempts set delivery = jsonb_build_object('order', to_jsonb(ids), 'options', opts) where id = _attempt_id;
  return jsonb_build_object('order', to_jsonb(ids), 'options', opts);
end $function$;