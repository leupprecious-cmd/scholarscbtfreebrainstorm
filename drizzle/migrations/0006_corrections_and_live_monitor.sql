alter table public.tests add column if not exists show_corrections boolean not null default false;

create or replace function public.my_corrections(_attempt_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a attempts; t tests; res jsonb;
begin
  select * into a from attempts where id = _attempt_id and student_id = auth.uid();
  if a.id is null or a.status <> 'submitted' then return null; end if;
  select * into t from tests where id = a.test_id;
  if not t.show_corrections then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'text', q.text, 'type', q.type, 'subject', q.subject, 'options', q.options,
    'correct', q.correct_answer, 'answer', coalesce(a.answers->>q.id::text, ''), 'marks', q.marks
  ) order by q.subject, q.position), '[]'::jsonb) into res
  from questions q
  where q.test_id = a.test_id
    and (a.delivery = '{}'::jsonb or a.delivery is null
         or (a.delivery->'order') ? q.id::text
         or exists (select 1 from jsonb_each(a.delivery) e where jsonb_typeof(e.value)='array' and e.value ? q.id::text));
  return res;
end $$;
grant execute on function public.my_corrections(uuid) to authenticated;

create or replace function public.admin_live_attempts()
returns table (attempt_id uuid, student_id uuid, full_name text, class text, test_title text,
  started_at timestamptz, deadline timestamptz, answered int, total_questions int,
  tab_switches bigint, camera_off bigint, photos bigint, last_photo text, last_photo_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, a.student_id, p.full_name, p.class, t.title, a.started_at, a.deadline,
    (select count(*)::int from jsonb_each_text(a.answers) x where trim(x.value) <> ''),
    coalesce(jsonb_array_length(a.delivery->'order'), (select count(*)::int from questions q where q.test_id = t.id)),
    (select count(*) from proctor_events e where e.attempt_id = a.id and e.kind = 'tab_switch'),
    (select count(*) from proctor_events e where e.attempt_id = a.id and e.kind = 'camera_off'),
    (select count(*) from proctor_events e where e.attempt_id = a.id and e.kind = 'snapshot'),
    (select e.photo_path from proctor_events e where e.attempt_id = a.id and e.kind = 'snapshot' order by e.created_at desc limit 1),
    (select e.created_at from proctor_events e where e.attempt_id = a.id and e.kind = 'snapshot' order by e.created_at desc limit 1)
  from attempts a join tests t on t.id = a.test_id left join profiles p on p.id = a.student_id
  where a.status = 'in_progress' and a.deadline > now() and public.has_role(auth.uid(), 'admin')
  order by a.started_at desc
$$;
grant execute on function public.admin_live_attempts() to authenticated;