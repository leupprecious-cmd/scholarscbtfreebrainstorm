CREATE TABLE public.proctor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('snapshot','tab_switch','camera_off','fullscreen_exit')),
  photo_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX proctor_events_attempt_idx ON public.proctor_events(attempt_id, created_at);
GRANT SELECT, INSERT ON public.proctor_events TO authenticated;
GRANT ALL ON public.proctor_events TO service_role;
ALTER TABLE public.proctor_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student logs own in-progress attempt" ON public.proctor_events FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid() AND a.status = 'in_progress'));
CREATE POLICY "admin reads proctor events" ON public.proctor_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "student uploads own proctor photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proctor' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "admin reads proctor photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proctor' AND public.has_role(auth.uid(), 'admin'));