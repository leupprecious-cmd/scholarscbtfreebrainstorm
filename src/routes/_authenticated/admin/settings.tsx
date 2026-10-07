import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data } = useSettings();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  useEffect(() => { if (data) setName(data.lesson_name); }, [data]);
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold">Settings</h1>
      <div className="mt-6 space-y-4 rounded-2xl border bg-card p-6">
        <div className="space-y-1.5">
          <Label>Lesson name (shown on the homepage)</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button onClick={async () => {
          const { error } = await supabase.from("app_settings").update({ lesson_name: name.trim() || "My Lesson" }).eq("id", 1);
          if (error) return toast.error(error.message);
          toast.success("Saved");
          qc.invalidateQueries({ queryKey: ["settings"] });
        }}>Save</Button>
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-6 text-sm">
        <p className="font-bold">Your links</p>
        <p className="mt-2">Student link: <span className="font-mono">{typeof window !== "undefined" ? window.location.origin : ""}</span></p>
        <p>Private admin login: <span className="font-mono">{typeof window !== "undefined" ? `${window.location.origin}/staff` : ""}</span></p>
      </div>
    </div>
  );
}
