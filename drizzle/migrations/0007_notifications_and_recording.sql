ALTER TABLE public.proctor_events DROP CONSTRAINT proctor_events_kind_check;
ALTER TABLE public.proctor_events ADD CONSTRAINT proctor_events_kind_check CHECK (kind = ANY (ARRAY['snapshot','tab_switch','camera_off','fullscreen_exit','live','video']));

ALTER TABLE public.app_settings ADD COLUMN admin_last_seen timestamptz, ADD COLUMN notify_email text NOT NULL DEFAULT '', ADD COLUMN last_email_at timestamptz;

CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  attempt_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  emailed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin updates notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin deletes notifications" ON public.admin_notifications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX ON public.admin_notifications (created_at DESC);

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  target_class text NOT NULL DEFAULT '',
  target_student uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manages announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "students read their announcements" ON public.announcements FOR SELECT TO authenticated USING (
  target_student = auth.uid() OR (target_student IS NULL AND (target_class = '' OR lower(trim(target_class)) = lower(trim((SELECT p.class FROM public.profiles p WHERE p.id = auth.uid())))))
);

CREATE OR REPLACE FUNCTION public.notify_attempt() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare nm text; tt text;
begin
  select full_name into nm from profiles where id = new.student_id;
  select title into tt from tests where id = new.test_id;
  if tg_op = 'INSERT' then
    insert into admin_notifications (kind, title, body, attempt_id) values ('started', coalesce(nullif(nm,''),'A student') || ' started an exam', tt, new.id);
  elsif new.status = 'submitted' and old.status <> 'submitted' then
    insert into admin_notifications (kind, title, body, attempt_id) values ('submitted', coalesce(nullif(nm,''),'A student') || ' submitted an exam',
      tt || ' — score ' || new.score || '/' || new.total, new.id);
  end if;
  return new;
end $$;
CREATE TRIGGER attempts_notify AFTER INSERT OR UPDATE ON public.attempts FOR EACH ROW EXECUTE FUNCTION public.notify_attempt();

CREATE OR REPLACE FUNCTION public.notify_proctor() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare nm text;
begin
  if new.kind not in ('tab_switch','camera_off') then return new; end if;
  if exists (select 1 from admin_notifications where attempt_id = new.attempt_id and kind = new.kind and created_at > now() - interval '2 minutes') then return new; end if;
  select full_name into nm from profiles where id = new.student_id;
  insert into admin_notifications (kind, title, body, attempt_id) values (new.kind,
    coalesce(nullif(nm,''),'A student') || case when new.kind = 'tab_switch' then ' left the exam page' else ' turned off the camera' end,
    'Security alert during exam', new.attempt_id);
  return new;
end $$;
CREATE TRIGGER proctor_notify AFTER INSERT ON public.proctor_events FOR EACH ROW EXECUTE FUNCTION public.notify_proctor();

CREATE OR REPLACE FUNCTION public.admin_heartbeat() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  update app_settings set admin_last_seen = now() where id = 1;
end $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;