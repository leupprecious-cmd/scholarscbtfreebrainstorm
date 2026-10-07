import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StudentShell } from "@/components/StudentShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { gradeFor, pct, useMe, useSettings } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Corrections } from "@/components/Corrections";

export const Route = createFileRoute("/_authenticated/result/$attemptId")({
  head: () => ({ meta: [{ title: "My Result — SCHOLARS CBT" }] }),
  component: Result,
});

function Result() {
  const { attemptId } = Route.useParams();
  const { data: me } = useMe();
  const { data: settings } = useSettings();
  const { data, isLoading } = useQuery({
    queryKey: ["my-results"],
    queryFn: async () => (await supabase.rpc("my_results")).data ?? [],
  });
  const r = data?.find((x) => x.attempt_id === attemptId);
  if (isLoading) return <StudentShell><p>Loading...</p></StudentShell>;
  if (!r) return <StudentShell><p>Result not found.</p></StudentShell>;
  const p = pct(r.score, r.total);
  const passed = p >= r.pass_percentage;

  return (
    <StudentShell>
      <div className="rounded-2xl border bg-card p-6 text-center sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">TEST COMPLETED</p>
        <h1 className="mt-2 text-3xl font-extrabold">
          {r.show_results && passed && !r.pending_grading ? "Congratulations" : "Well done"}, {me?.profile?.full_name?.split(" ")[0] ?? ""}!
        </h1>
        <p className="mt-1 text-lg">{r.test_title}</p>
        {!r.show_results ? (
          <p className="mt-8 rounded-xl bg-muted p-5">Your test has been submitted. Your teacher will release the results soon.</p>
        ) : (
          <>
            <div className="mt-8 font-display text-7xl font-extrabold">{r.score}<span className="text-3xl text-muted-foreground">/{r.total}</span></div>
            <p className="mt-1 text-2xl font-bold">{p}% · Grade {gradeFor(p, settings?.grade_scale)}</p>
            <p className={cn("mx-auto mt-4 w-fit rounded-full px-5 py-2 text-lg font-extrabold",
              r.pending_grading ? "bg-muted" : passed ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
              {r.pending_grading ? "AWAITING MARKING" : passed ? "PASSED" : "FAILED"}
            </p>
            {r.pending_grading && <p className="mt-2 text-sm text-muted-foreground">Some written answers will be marked by your teacher.</p>}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <Stat n={r.correct_count} l="Correct" />
              <Stat n={r.wrong_count} l="Wrong" />
              <Stat n={r.unanswered_count} l="Unanswered" />
            </div>
          </>
        )}
        {r.submitted_at && <p className="mt-6 text-sm text-muted-foreground">Submitted at {new Date(r.submitted_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>}
        <Corrections attemptId={attemptId} />
        <Button asChild className="mt-6 h-12 w-full sm:w-auto sm:px-10"><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>
    </StudentShell>
  );
}

function Stat({ n, l }: { n: number | null; l: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-2xl font-bold">{n ?? 0}</p><p className="text-sm text-muted-foreground">{l}</p></div>;
}
