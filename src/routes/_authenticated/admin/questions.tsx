import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/admin-data";

export const Route = createFileRoute("/_authenticated/admin/questions")({
  component: QuestionBank,
});

const typeLabel: Record<string, string> = { mcq: "Multiple Choice", true_false: "True/False", short: "Short Answer", written: "Written" };

function QuestionBank() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [subject, setSubject] = useState("all");
  const [target, setTarget] = useState("");
  const [showAll, setShowAll] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: () => fetchAll((from, to) =>
      supabase.from("questions").select("*, tests(id,title,subject)").order("created_at", { ascending: false }).range(from, to)),
  });
  const tests = useQuery({ queryKey: ["admin-tests-lite"], queryFn: async () => (await supabase.from("tests").select("id,title").order("created_at", { ascending: false })).data ?? [] });
  const subjects = [...new Set((data ?? []).map((x) => x.tests?.subject).filter(Boolean))] as string[];
  const rows = (data ?? []).filter((x) =>
    x.text.toLowerCase().includes(q.toLowerCase()) && (type === "all" || x.type === type) && (subject === "all" || x.tests?.subject === subject));
  const shown = showAll ? rows : rows.slice(0, 50);

  async function reuse(id: string) {
    if (!target) { toast.error("Choose a test to copy into first"); return; }
    const src = data!.find((x) => x.id === id)!;
    const { count } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("test_id", target);
    const { error } = await supabase.from("questions").insert({
      test_id: target, type: src.type, text: src.text, options: src.options, correct_answer: src.correct_answer, marks: src.marks, position: (count ?? 0) + 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Question added to test");
    qc.invalidateQueries({ queryKey: ["admin-questions"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this question?")) return;
    await supabase.from("questions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-questions"] });
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Question Bank</h1>
      <p className="text-muted-foreground">Private to you. Add new questions from inside a test; reuse any question in another test here.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Search questions..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All types</SelectItem>{Object.entries(typeLabel).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-muted p-3 text-sm">
        <span className="font-bold">Reuse into test:</span>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger className="w-64 bg-card"><SelectValue placeholder="Choose test" /></SelectTrigger>
          <SelectContent>{(tests.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="mt-4 space-y-2">
        {shown.map((x) => (
          <div key={x.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card p-4">
            <div>
              <p className="font-bold">{x.text}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {typeLabel[x.type]} · {x.marks} mark(s) · Answer: <span className="font-bold text-foreground">{x.type === "written" ? "manual" : x.correct_answer}</span> ·{" "}
                {x.tests && <Link to="/admin/tests/$testId" params={{ testId: x.tests.id }} className="text-primary underline">{x.tests.title}</Link>}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="outline" onClick={() => reuse(x.id)}><Copy className="mr-1 h-4 w-4" />Reuse</Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(x.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">No questions found.</p>}
        {rows.length > shown.length && (
          <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAll(true)}>Show more ({rows.length - shown.length} left)</Button>
        )}
      </div>
    </div>
  );
}
