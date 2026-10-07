import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLists } from "@/lib/auth";

export type TestValues = {
  title: string; subject: string; class: string; instructions: string; attempts_allowed: number;
  duration_minutes: number; pass_percentage: number; start_at: string | null; end_at: string | null; show_results: boolean;
};

const toLocal = (iso: string | null) => {
  if (!iso) return { d: "", t: "" };
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { d: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`, t: `${pad(dt.getHours())}:${pad(dt.getMinutes())}` };
};
const fromLocal = (d: string, t: string) => (d ? new Date(`${d}T${t || "00:00"}`).toISOString() : null);

export function TestForm({ initial, onSubmit, submitLabel }: { initial?: Partial<TestValues>; onSubmit: (v: TestValues) => Promise<void> | void; submitLabel: string }) {
  const { data: lists } = useLists();
  const s = toLocal(initial?.start_at ?? null), e = toLocal(initial?.end_at ?? null);
  const [v, setV] = useState({
    title: initial?.title ?? "", subject: initial?.subject ?? "", class: initial?.class ?? "",
    instructions: initial?.instructions ?? "", duration_minutes: initial?.duration_minutes ?? 30,
    pass_percentage: initial?.pass_percentage ?? 50, show_results: initial?.show_results ?? true,
    attempts_allowed: initial?.attempts_allowed ?? 1,
    sd: s.d, st: s.t, ed: e.d, et: e.t,
  });
  const [busy, setBusy] = useState(false);
  const up = (k: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: ev.target.value });

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (ev) => {
      ev.preventDefault();
      setBusy(true);
      await onSubmit({
        title: v.title.trim(), subject: v.subject, class: v.class === "__all" ? "" : v.class, instructions: v.instructions,
        duration_minutes: Number(v.duration_minutes) || 30, pass_percentage: Number(v.pass_percentage) || 50,
        attempts_allowed: Math.max(1, Number(v.attempts_allowed) || 1),
        show_results: v.show_results, start_at: fromLocal(v.sd, v.st), end_at: fromLocal(v.ed, v.et),
      });
      setBusy(false);
    }}>
      <F label="Test Title" className="sm:col-span-2"><Input required value={v.title} onChange={up("title")} placeholder="Mathematics CBT Test 1" /></F>
      <F label="Subject">
        <Select value={v.subject} onValueChange={(x) => setV({ ...v, subject: x })}>
          <SelectTrigger><SelectValue placeholder="Choose subject" /></SelectTrigger>
          <SelectContent>{(lists?.subjects ?? []).map((x) => <SelectItem key={x.id} value={x.name}>{x.name}</SelectItem>)}</SelectContent>
        </Select>
      </F>
      <F label="Class">
        <Select value={v.class || "__all"} onValueChange={(x) => setV({ ...v, class: x })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All classes</SelectItem>
            {(lists?.classes ?? []).map((x) => <SelectItem key={x.id} value={x.name}>{x.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </F>
      <F label="Instructions" className="sm:col-span-2"><Textarea rows={3} value={v.instructions} onChange={up("instructions")} placeholder="Answer all questions." /></F>
      <F label="Duration (minutes)"><Input type="number" min={1} required value={v.duration_minutes} onChange={up("duration_minutes")} /></F>
      <F label="Passing Percentage"><Input type="number" min={0} max={100} required value={v.pass_percentage} onChange={up("pass_percentage")} /></F>
      <F label="Attempts Allowed"><Input type="number" min={1} required value={v.attempts_allowed} onChange={up("attempts_allowed")} /></F>
      <p className="self-end text-xs text-muted-foreground">Total questions and total marks are counted automatically from the questions you add.</p>
      <F label="Start Date (optional)"><Input type="date" value={v.sd} onChange={up("sd")} /></F>
      <F label="Start Time"><Input type="time" value={v.st} onChange={up("st")} /></F>
      <F label="End Date (optional)"><Input type="date" value={v.ed} onChange={up("ed")} /></F>
      <F label="End Time"><Input type="time" value={v.et} onChange={up("et")} /></F>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Switch checked={v.show_results} onCheckedChange={(c) => setV({ ...v, show_results: c })} id="sr" />
        <Label htmlFor="sr">Show results to students immediately after submitting</Label>
      </div>
      <div className="sm:col-span-2"><Button disabled={busy || !v.subject} className="h-11">{busy ? "Saving..." : submitLabel}</Button></div>
    </form>
  );
}

function F({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className ?? ""}`}><Label>{label}</Label>{children}</div>;
}
