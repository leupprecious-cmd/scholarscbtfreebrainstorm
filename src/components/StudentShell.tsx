import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function StudentShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-primary">
            <GraduationCap className="h-5 w-5" />
            <span className="font-display font-bold">SCHOLARS CBT</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Log out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
