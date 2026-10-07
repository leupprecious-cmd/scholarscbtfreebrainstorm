CREATE OR REPLACE FUNCTION public.admin_live_attempts()
 RETURNS TABLE(attempt_id uuid, student_id uuid, full_name text, class text, test_title text, started_at timestamp with time zone, deadline timestamp with time zone, answered integer, total_questions integer, tab_switches bigint, camera_off bigint, photos bigint, last_photo text, last_photo_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select a.id, a.student_id, p.full_name, p.class, t.title, a.started_at, a.deadline,
    (select count(*)::int from jsonb_each_text(a.answers) x where trim(x.value) <> ''),
    coalesce(jsonb_array_length(a.delivery->'order'), (select count(*)::int from questions q where q.test_id = t.id)),
    (select count(*) from proctor_events e where e.attempt_id = a.id and e.kind = 'tab_switch'),
    (select count(*) from proctor_events e where e.attempt_id = a.id and e.kind = 'camera_off'),
    (select count(*) from proctor_events e where e.attempt_id = a.id and e.kind = 'snapshot'),
    (select e.photo_path from proctor_events e where e.attempt_id = a.id and e.kind in ('snapshot','live') order by e.created_at desc limit 1),
    (select e.created_at from proctor_events e where e.attempt_id = a.id and e.kind in ('snapshot','live') order by e.created_at desc limit 1)
  from attempts a join tests t on t.id = a.test_id left join profiles p on p.id = a.student_id
  where a.status = 'in_progress' and a.deadline > now() and public.has_role(auth.uid(), 'admin')
  order by a.started_at desc
$function$;