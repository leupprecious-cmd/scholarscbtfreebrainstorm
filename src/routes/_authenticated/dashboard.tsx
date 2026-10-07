import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { CalendarClock, Clock, FileQuestion, GraduationCap } from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { gradeFor, pct, useMe, useSettings } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — SCHOLARS CBT" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useMe();
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  useEffect(() => { if (me?.isAdmin) navigate({ to: "/admin" }); }, [me, navigate]);
  const tests = useQuery({ queryKey: ["student-tests"], queryFn: async () => (await supabase.rpc("student_tests")).data ?? [] });
  const results = useQuery({ queryKey: ["my-results"], queryFn: async () => (await supabase.rpc("my_results")).data ?? [] });
  const now = Date.now();
  const all = tests.data ?? [];
  const res = results.data ?? [];
  const submitted = res.filter((r) => r.status === "submitted");
  const inProgress = new Set(res.filter((r) => r.status === "in_progress").map((r) => r.test_id));

  const upcoming = all.filter((t) => t.start_at && new Date(t.start_at).getTime() > now);
  const available = all.filter((t) =>
    !upcoming.includes(t) && !(t.end_at && new Date(t.end_at).getTime() < now) &&
    (inProgress.has(t.id) || t.attempts_used < Math.max(1, t.attempts_allowed)));
  const completedIds = new Set(submitted.map((r) => r.test_id));
  const completed = all.filter((t) => completedIds.has(t.id) && !available.includes(t));

  return (
    <StudentShell>
      <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
        <p className="text-sm opacity-80">Welcome,</p>
        <h1 className="text-3xl font-extrabold">{me?.profile?.full_name || "Student"}</h1>
        <p className="mt-1 text-sm opacity-80">{me?.profile?.class}{me?.profile?.student_id && ` · ${me.profile.student_id}`}</p>
      </div>

      <Section title="Available Tests" empty="No tests available right now.">
        {available.map((t) => (
          <TestCard key={t.id} t={t}>
            <Button asChild className="h-12 w-full bg-success text-base text-success-foreground hover:bg-success/90 sm:w-auto sm:px-8">
              <Link to="/test/$testId" params={{ testId: t.id }}>{inProgress.has(t.id) ? "Continue CBT" : "Start CBT"}</Link>
            </Button>
            {t.attempts_allowed > 1 && <span className="text-sm text-muted-foreground">Attempts: {t.attempts_used}/{t.attempts_allowed}</span>}
          </TestCard>
        ))}
      </Section>

      <Section title="Upcoming Tests" empty="No upcoming tests.">
        {upcoming.map((t) => (
          <TestCard key={t.id} t={t}>
            <span className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm font-bold"><CalendarClock className="h-4 w-4" />Test Not Yet Available · opens {new Date(t.start_at!).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
          </TestCard>
        ))}
      </Section>

      <Section title="Completed Tests" empty="You haven't completed any tests yet.">
        {completed.map((t) => {
          const last = submitted.find((r) => r.test_id === t.id)!;
          return (
            <TestCard key={t.id} t={t}>
              <Button asChild variant="secondary" className="h-11"><Link to="/result/$attemptId" params={{ attemptId: last.attempt_id }}>View Result</Link></Button>
            </TestCard>
          );
        })}
      </Section>

      <h2 className="mt-10 text-xl font-bold">My Results</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
        {submitted.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No results yet.</p>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-muted"><tr><th className="p-3">Test</th><th className="p-3">Score</th><th className="p-3">%</th><th className="p-3">Grade</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {submitted.map((r) => {
                const p = pct(r.score, r.total);
                return (
                  <tr key={r.attempt_id} className="border-t">
                    <td className="p-3"><Link to="/result/$attemptId" params={{ attemptId: r.attempt_id }} className="font-bold text-primary">{r.test_title}</Link></td>
                    {r.show_results ? (<>
                      <td className="p-3">{r.score}/{r.total}</td>
                      <td className="p-3">{p}%</td>
                      <td className="p-3 font-bold">{gradeFor(p, settings?.grade_scale)}</td>
                      <td className="p-3">{r.pending_grading ? <span className="text-muted-foreground">Marking</span> : p >= r.pass_percentage ? <span className="font-bold text-success">Passed</span> : <span className="font-bold text-destructive">Failed</span>}</td>
                    </>) : <td colSpan={4} className="p-3 text-muted-foreground">Result not released yet</td>}
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

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <>
      <h2 className="mt-8 text-xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3">
        {children.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">{empty}</p> : children}
      </div>
    </>
  );
}

type T = { id: string; title: string; subject: string; class: string; question_count: number; duration_minutes: number };
function TestCard({ t, children }: { t: T; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="h-5 w-5 text-primary" />{t.title}</h3>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span>Subject: {t.subject}</span>
        {t.class && <span>Class: {t.class}</span>}
        <span className="flex items-center gap-1"><FileQuestion className="h-4 w-4" />{t.question_count} questions</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t.duration_minutes} minutes</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
