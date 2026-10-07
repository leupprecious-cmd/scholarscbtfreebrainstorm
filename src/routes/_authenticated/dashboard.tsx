import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Clock, FileQuestion } from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { pct, useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — Online Lesson Test" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  useEffect(() => { if (me?.isAdmin) navigate({ to: "/admin" }); }, [me, navigate]);
  const tests = useQuery({ queryKey: ["student-tests"], queryFn: async () => (await supabase.rpc("student_tests")).data ?? [] });
  const results = useQuery({ queryKey: ["my-results"], queryFn: async () => (await supabase.rpc("my_results")).data ?? [] });
  const doneTitles = new Map((results.data ?? []).map((r) => [r.test_title, r]));
  const now = Date.now();

  return (
    <StudentShell>
      <h1 className="text-3xl font-extrabold">Welcome, {me?.profile?.full_name || "Student"}</h1>
      <p className="text-muted-foreground">{me?.profile?.class && `Class: ${me.profile.class}`}</p>

      <h2 className="mt-8 text-xl font-bold">Available Tests</h2>
      <div className="mt-3 space-y-3">
        {tests.isLoading && <p className="text-muted-foreground">Loading...</p>}
        {tests.data?.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">No tests available right now. Check back later.</p>}
        {tests.data?.map((t) => {
          const done = doneTitles.get(t.title);
          const notOpen = t.start_at && new Date(t.start_at).getTime() > now;
          const closed = t.end_at && new Date(t.end_at).getTime() < now;
          return (
            <div key={t.id} className="rounded-2xl border bg-card p-5">
              <h3 className="text-xl font-bold">{t.title}</h3>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span>Subject: {t.subject}</span>
                <span className="flex items-center gap-1"><FileQuestion className="h-4 w-4" />{t.question_count} questions</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t.duration_minutes} minutes</span>
              </div>
              <div className="mt-4">
                {done?.status === "submitted" ? (
                  <Button asChild variant="secondary" className="h-12 w-full sm:w-auto"><Link to="/result/$attemptId" params={{ attemptId: done.attempt_id }}>View Result</Link></Button>
                ) : notOpen ? (
                  <p className="text-sm font-bold">Opens {new Date(t.start_at!).toLocaleString()}</p>
                ) : closed && !done ? (
                  <p className="text-sm font-bold text-destructive">Closed</p>
                ) : (
                  <Button asChild className="h-12 w-full text-base sm:w-auto"><Link to="/test/$testId" params={{ testId: t.id }}>{done ? "Continue Test" : "Start Test"}</Link></Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-xl font-bold">My Results</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
        {(results.data ?? []).filter((r) => r.status === "submitted").length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No completed tests yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted"><tr><th className="p-3">Test</th><th className="p-3">Score</th><th className="p-3">%</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {results.data!.filter((r) => r.status === "submitted").map((r) => {
                const p = pct(r.score, r.total);
                return (
                  <tr key={r.attempt_id} className="border-t">
                    <td className="p-3"><Link to="/result/$attemptId" params={{ attemptId: r.attempt_id }} className="font-bold text-primary">{r.test_title}</Link></td>
                    {r.show_results ? (<>
                      <td className="p-3">{r.score}/{r.total}</td>
                      <td className="p-3">{p}%</td>
                      <td className="p-3">{r.pending_grading ? <span className="text-muted-foreground">Marking</span> : p >= r.pass_percentage ? <span className="font-bold text-success">Passed</span> : <span className="font-bold text-destructive">Failed</span>}</td>
                    </>) : <td colSpan={3} className="p-3 text-muted-foreground">Results not released yet</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </StudentShell>
  );
}
