import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Check, Flag, Eraser } from "lucide-react";
import { useMe } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Proctor } from "@/components/Proctor";
import { GiftCard } from "@/components/GiftCard";
import { Calculator } from "@/components/Calculator";
import { flushAdminEmails } from "@/lib/notify.functions";

export const Route = createFileRoute("/_authenticated/attempt/$attemptId")({
  head: () => ({ meta: [{ title: "Taking Test — SCHOLARS CBT" }] }),
  component: Attempt,
});

type Opt = { text: string; value: string };
type Q = { id: string; type: "mcq" | "true_false" | "short" | "written"; text: string; options: Opt[]; marks: number; subject?: string };
type AttemptData = {
  id: string; status: string; deadline: string; server_now: string; answers: Record<string, string>;
  test: { title: string; subject: string }; questions: Q[];
};

function Attempt() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_attempt", { _attempt_id: attemptId });
      if (error) throw error;
      return data as unknown as AttemptData;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data && data.status !== "in_progress") navigate({ to: "/result/$attemptId", params: { attemptId }, replace: true });
  }, [data, attemptId, navigate]);

  if (isLoading) return <div className="p-8 text-center">Loading test...</div>;
  if (error || !data) return <div className="p-8 text-center">Could not load this test.</div>;
  if (data.status !== "in_progress") return null;
  return <ProctoredRunner data={data} />;
}

function ProctoredRunner({ data }: { data: AttemptData }) {
  const { data: me } = useMe();
  if (!me) return <div className="p-8 text-center">Loading test...</div>;
  return <Proctor attemptId={data.id} studentId={me.user.id}><GiftCard attemptId={data.id}><Runner data={data} /></GiftCard></Proctor>;
}

function Runner({ data }: { data: AttemptData }) {
  const navigate = useNavigate();
  const storageKey = `attempt-${data.id}`;
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const local = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return { ...data.answers, ...local };
    } catch { return data.answers; }
  });
  const { data: me } = useMe();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  useEffect(() => { try { setFlags(JSON.parse(localStorage.getItem(storageKey + "-flags") || "{}")); } catch { /* ignore */ } }, [storageKey]);
  useEffect(() => { localStorage.setItem(storageKey + "-flags", JSON.stringify(flags)); }, [flags, storageKey]);
  const [idx, setIdx] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(true);
  const submitting = useRef(false);
  const offset = useRef(new Date(data.server_now).getTime() - Date.now());
  const deadline = new Date(data.deadline).getTime();
  const [left, setLeft] = useState(() => Math.max(0, deadline - (Date.now() + offset.current)));
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const submit = useCallback(async (auto = false) => {
    if (submitting.current) return;
    submitting.current = true;
    const { error } = await supabase.rpc("submit_attempt", { _attempt_id: data.id, _answers: answersRef.current });
    if (error) { submitting.current = false; { toast.error("Could not submit. Check your internet and try again."); return; } }
    void flushAdminEmails().catch(() => {});
    localStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey + "-flags");
    if (auto) toast.info("Time is up! Your test was submitted.");
    navigate({ to: "/result/$attemptId", params: { attemptId: data.id }, replace: true });
  }, [data.id, navigate, storageKey]);

  // timer
  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, deadline - (Date.now() + offset.current));
      setLeft(l);
      if (l <= 0) { clearInterval(t); submit(true); }
    }, 500);
    return () => clearInterval(t);
  }, [deadline, submit]);

  // autosave
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(answers));
    setSaved(false);
    const t = setTimeout(async () => {
      const { error } = await supabase.rpc("save_answers", { _attempt_id: data.id, _answers: answers });
      if (!error) setSaved(true);
    }, 800);
    return () => clearTimeout(t);
  }, [answers, data.id, storageKey]);

  const qs = data.questions;
  const q = qs[idx];
  const answered = qs.filter((x) => (answers[x.id] ?? "").trim() !== "").length;
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  const setA = (v: string) => setAnswers((a) => ({ ...a, [q!.id]: v }));
  const opts = q?.options ?? [];
  const subjects = [...new Set(qs.map((x) => x.subject ?? "").filter(Boolean))];

  return (
    <div className="min-h-screen bg-background pb-28">
      <Calculator />
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold tracking-widest text-primary">SCHOLARS CBT</p>
            <p className="truncate font-display font-bold">{data.test.title}</p>
            <p className="truncate text-xs text-muted-foreground">{me?.profile?.full_name} · {saved ? "All answers saved" : "Saving..."}</p>
          </div>
          <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-lg font-bold tabular-nums",
            left < 60000 ? "bg-destructive text-destructive-foreground" : left < 300000 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground")}>
            <Clock className="h-4 w-4" /><span className="hidden text-xs sm:inline">TIME REMAINING</span> {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {subjects.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {subjects.map((n) => (
              <Button key={n} size="sm" variant={q?.subject === n ? "default" : "outline"} onClick={() => setIdx(qs.findIndex((x) => x.subject === n))}>
                {n} ({qs.filter((x) => x.subject === n && (answers[x.id] ?? "").trim()).length}/{qs.filter((x) => x.subject === n).length})
              </Button>
            ))}
          </div>
        )}
        <div className="mb-5 flex flex-wrap gap-2">
          {qs.map((x, i) => (subjects.length > 1 && x.subject !== q?.subject) ? null : (
            <button key={x.id} onClick={() => setIdx(i)}
              className={cn("h-10 w-10 rounded-lg border text-sm font-bold",
                i === idx ? "border-primary bg-primary text-primary-foreground" : flags[x.id] ? "border-warning bg-warning text-warning-foreground" : (answers[x.id] ?? "").trim() ? "border-success bg-success text-success-foreground" : "border-border bg-muted text-muted-foreground")}>
              {i + 1}
            </button>
          ))}
        </div>

        <div className="-mt-2 mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <Legend c="bg-muted border" l="Unanswered" /><Legend c="bg-success" l="Answered" /><Legend c="bg-warning" l="Flagged" /><Legend c="bg-primary" l="Current" />
        </div>
        {q ? (
          <div className="rounded-2xl border bg-card p-5 sm:p-7">
            <p className="text-sm font-bold text-muted-foreground">{q.subject ? `${q.subject} · ` : ""}Question {idx + 1} of {qs.length} · {q.marks} mark{Number(q.marks) === 1 ? "" : "s"}</p>
            <h2 className="mt-2 whitespace-pre-wrap font-sans text-xl font-bold leading-snug tracking-normal">{q.text}</h2>
            <div className="mt-5 space-y-3">
              {(q.type === "mcq" || q.type === "true_false") && opts.map((o, i) => {
                const sel = answers[q.id] === o.value;
                return (
                  <button key={o.value} onClick={() => setA(o.value)}
                    className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left text-base transition",
                      sel ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40")}>
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold",
                      sel ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                      {sel ? <Check className="h-4 w-4" /> : q.type === "mcq" ? String.fromCharCode(65 + i) : ""}
                    </span>
                    {o.text}
                  </button>
                );
              })}
              {q.type === "short" && <Input value={answers[q.id] ?? ""} onChange={(e) => setA(e.target.value)} placeholder="Type your answer" className="h-14 text-lg" />}
              {q.type === "written" && <Textarea value={answers[q.id] ?? ""} onChange={(e) => setA(e.target.value)} placeholder="Write your answer" rows={8} className="text-base" />}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))} className={cn(flags[q.id] && "border-warning bg-warning/20")}>
                <Flag className="mr-1 h-4 w-4" />{flags[q.id] ? "Unflag" : "Flag Question"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAnswers((a) => { const n = { ...a }; delete n[q.id]; return n; })}>
                <Eraser className="mr-1 h-4 w-4" />Clear Answer
              </Button>
            </div>
          </div>
        ) : <p>This test has no questions.</p>}
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t bg-card">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <Button variant="outline" className="h-12 flex-1" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</Button>
          {idx < qs.length - 1 ? (
            <Button className="h-12 flex-1" onClick={() => setIdx(idx + 1)}>Next</Button>
          ) : (
            <Button className="h-12 flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setConfirm(true)}>Submit Test</Button>
          )}
        </div>
        {idx < qs.length - 1 && (
          <div className="mx-auto max-w-3xl px-4 pb-3"><button className="w-full text-sm font-bold text-primary underline" onClick={() => setConfirm(true)}>Submit Test</button></div>
        )}
      </footer>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your test?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your test? You will not be able to change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-success/15 p-3"><p className="text-2xl font-bold">{answered}</p><p className="text-sm">Answered</p></div>
            <div className="rounded-xl bg-destructive/10 p-3"><p className="text-2xl font-bold">{qs.length - answered}</p><p className="text-sm">Unanswered</p></div>
            <div className="rounded-xl bg-warning/25 p-3"><p className="text-2xl font-bold">{qs.filter((x) => flags[x.id]).length}</p><p className="text-sm">Flagged</p></div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" className="h-12" onClick={() => setConfirm(false)}>Return to Test</Button>
            <Button className="h-12" onClick={() => submit(false)}>Submit Test</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Legend({ c, l }: { c: string; l: string }) {
  return <span className="flex items-center gap-1"><span className={cn("h-3 w-3 rounded", c)} />{l}</span>;
}
