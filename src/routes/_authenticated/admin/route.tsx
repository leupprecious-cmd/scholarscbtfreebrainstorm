import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Megaphone, FileText, LayoutDashboard, ListChecks, LogOut, Radio, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getIsAdmin } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";
import { HallWatermark } from "@/components/HallWatermark";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const ok = await getIsAdmin(context.user.id);
    if (!ok) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Admin — SCHOLARS CBT" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/tests", label: "Tests", icon: FileText, exact: false },
  { to: "/admin/questions", label: "Questions", icon: ListChecks, exact: false },
  { to: "/admin/students", label: "Students", icon: Users, exact: false },
  { to: "/admin/live", label: "Live Monitor", icon: Radio, exact: false },
  { to: "/admin/messages", label: "Messages", icon: Megaphone, exact: false },
  { to: "/admin/results", label: "Results", icon: BarChart3, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/staff", replace: true });
  }
  return (
    <div className="relative min-h-screen bg-background md:flex">
      <HallWatermark />
      <aside className="relative z-10 bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
        <div className="px-4 py-4">
          <p className="text-xs uppercase tracking-widest opacity-70">Admin</p>
          <p className="font-display text-lg font-extrabold">SCHOLARS CBT</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible">
          <NotificationBell />
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
          <button onClick={signOut} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold hover:bg-sidebar-accent md:mt-4">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </nav>
      </aside>
      <main className="relative z-10 min-w-0 flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
