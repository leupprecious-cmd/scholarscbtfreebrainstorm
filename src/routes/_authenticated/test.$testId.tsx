import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { StudentShell } from "@/components/StudentShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/test/$testId")({
  head: () => ({ meta: [{ title: "Test Instructions — Online Lesson Test" }] }),
  component: Instructions,
});

function Instructions() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["student-tests"],
    queryFn: async () => (await supabase.rpc("student_tests")).data ?? [],
  });
  const t = data?.find((x) => x.id === testId);

  async function start() {
    setBusy(true);
    const { data: id, error } = await supabase.rpc("start_attempt", { _test_id: testId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/attempt/$attemptId", params: { attemptId: id as string } });
  }

  if (isLoading) return <StudentShell><p>Loading...</p></StudentShell>;
  if (!t) return <StudentShell><p>This test is not available.</p><Link to="/dashboard" className="text-primary">Back</Link></StudentShell>;
  return (
    <StudentShell>
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t.subject}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t.title}</h1>
        <p className="mt-4 rounded-xl bg-accent p-4 text-lg font-bold text-accent-foreground">
          You have {t.duration_minutes} minutes to answer {t.question_count} questions.
        </p>
        {t.instructions && <p className="mt-5 whitespace-pre-wrap">{t.instructions}</p>}
        <ul className="mt-5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>The timer starts when you press Start Test and cannot be paused.</li>
          <li>Your answers are saved automatically.</li>
          <li>When time runs out your test is submitted automatically.</li>
          <li>You cannot change answers after submitting.</li>
        </ul>
        <Button onClick={start} disabled={busy} className="mt-6 h-14 w-full text-lg">{busy ? "Starting..." : "Start Test"}</Button>
      </div>
    </StudentShell>
  );
}
