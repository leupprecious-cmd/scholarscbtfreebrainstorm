import { useNavigate } from "@tanstack/react-router";
import { useHydrated } from "@/lib/use-hydrated";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getIsAdmin } from "@/lib/auth";

export function LoginForm({ mode }: { mode: "student" | "admin" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const hydrated = useHydrated();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      { toast.error(error.message); return; }
    }
    const admin = await getIsAdmin(data.user.id);
    setBusy(false);
    if (mode === "admin" && !admin) {
      await supabase.auth.signOut();
      { toast.error("This account is not an administrator."); return; }
    }
    navigate({ to: admin ? "/admin" : "/dashboard" });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 text-base" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 text-base" />
      </div>
      <Button type="submit" disabled={busy || !hydrated} className="h-12 w-full text-base">
        {busy ? "Signing in..." : "Log In"}
      </Button>
    </form>
  );
}
