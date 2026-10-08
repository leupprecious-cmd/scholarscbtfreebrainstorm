import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { HallWatermark } from "@/components/HallWatermark";

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
    <div className="relative min-h-screen bg-background">
      <HallWatermark />
      <header className="sticky top-0 z-20 border-b-4 border-success bg-primary text-primary-foreground shadow">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15"><GraduationCap className="h-5 w-5" /></span>
            <span className="leading-tight">
              <span className="block font-display font-extrabold tracking-wide">SCHOLARS CBT</span>
              <span className="block text-[10px] uppercase tracking-widest opacity-75">Candidate Examination Portal</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hover:bg-primary-foreground/15 hover:text-primary-foreground"><Link to="/dashboard"><LayoutDashboard className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Dashboard</span></Link></Button>
            <Button asChild variant="ghost" size="sm" className="hover:bg-primary-foreground/15 hover:text-primary-foreground"><Link to="/syllabus"><BookOpen className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Syllabus</span></Link></Button>
            <Button variant="ghost" size="sm" className="hover:bg-primary-foreground/15 hover:text-primary-foreground" onClick={signOut}><LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Log out</span></Button>
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
