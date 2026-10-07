import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/questions")({
  component: QuestionBank,
});

const typeLabel: Record<string, string> = { mcq: "Multiple Choice", true_false: "True/False", short: "Short Answer", written: "Written" };

function QuestionBank() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => (await supabase.from("questions").select("*, tests(id,title)").order("created_at", { ascending: false })).data ?? [],
  });
  const rows = (data ?? []).filter((x) => x.text.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Question Bank</h1>
      <p className="text-muted-foreground">All questions across your tests. Only you can see this.</p>
      <Input className="mt-4 max-w-sm" placeholder="Search questions..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4 space-y-2">
        {rows.map((x) => (
          <div key={x.id} className="rounded-xl border bg-card p-4">
            <p className="font-bold">{x.text}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {typeLabel[x.type]} · {x.marks} mark(s) · Answer: <span className="font-bold text-foreground">{x.type === "written" ? "manual" : x.correct_answer}</span> ·{" "}
              {x.tests && <Link to="/admin/tests/$testId" params={{ testId: x.tests.id }} className="text-primary underline">{x.tests.title}</Link>}
            </p>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">No questions yet.</p>}
      </div>
    </div>
  );
}
