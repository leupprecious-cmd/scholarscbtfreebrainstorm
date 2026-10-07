import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAdminResults } from "@/lib/admin-data";

export const Route = createFileRoute("/_authenticated/admin/students")({
  component: Students,
});

function Students() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const [roles, profiles] = await Promise.all([
        supabase.from("user_roles").select("user_id").eq("role", "student"),
        supabase.from("profiles").select("*").order("full_name"),
      ]);
      const ids = new Set((roles.data ?? []).map((r) => r.user_id));
      return (profiles.data ?? []).filter((p) => ids.has(p.id));
    },
  });
  const results = useAdminResults();
  const rows = (data ?? []).filter((s) => `${s.full_name} ${s.student_id} ${s.class} ${s.email} ${s.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Students</h1>
      <Input className="mt-4 max-w-sm" placeholder="Search by name, ID or class..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted"><tr><th className="p-3">Name</th><th className="p-3">Student ID</th><th className="p-3">Class</th><th className="p-3">Contact</th><th className="p-3">Tests taken</th><th className="p-3">Average</th></tr></thead>
          <tbody>
            {rows.map((s) => {
              const mine = (results.data ?? []).filter((r) => r.student_id === s.id && r.status === "submitted");
              const avg = mine.length ? Math.round(mine.reduce((a, r) => a + r.percent, 0) / mine.length) : null;
              return (
                <tr key={s.id} className="border-t">
                  <td className="p-3 font-bold">{s.full_name}</td><td className="p-3">{s.student_id}</td><td className="p-3">{s.class}</td>
                  <td className="p-3">{s.email}<div className="text-xs text-muted-foreground">{s.phone}</div></td><td className="p-3">{mine.length}</td><td className="p-3">{avg === null ? "—" : `${avg}%`}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No students yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
