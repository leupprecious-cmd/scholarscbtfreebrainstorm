import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Laptop, LineChart, MousePointerClick, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import hall from "@/assets/cbt-hall.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SCHOLARS CBT — Learn. Practice. Test. Succeed." },
      { name: "description", content: "An online CBT platform that helps students take lesson tests, practice their knowledge, and receive instant results." },
      { property: "og:title", content: "SCHOLARS CBT — Learn. Practice. Test. Succeed." },
      { property: "og:description", content: "An online CBT platform that helps students take lesson tests, practice their knowledge, and receive instant results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Laptop, t: "Online CBT", d: "Take tests on any phone, tablet or computer." },
  { icon: Zap, t: "Instant Results", d: "See your score and grade the moment you submit." },
  { icon: MousePointerClick, t: "Easy Testing", d: "One question at a time, flag and review before submitting." },
  { icon: LineChart, t: "Student Progress", d: "Every result is saved so you can track how you improve." },
  { icon: ShieldCheck, t: "Secure Platform", d: "Your answers and results are private to you." },
];

function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden text-primary-foreground">
        <img src={hall} alt="Students writing a CBT exam in a large examination hall" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/75 to-primary/30" />
        <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7" />
            <span className="font-display text-lg font-extrabold tracking-wide">SCHOLARS CBT</span>
          </div>
          <div className="pt-16 sm:pt-24">
            <p className="inline-block rounded-full bg-success px-3 py-1 text-sm font-bold text-success-foreground">Learn. Practice. Test. Succeed.</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] sm:text-7xl">SCHOLARS CBT</h1>
            <p className="mt-5 max-w-xl text-lg opacity-90">
              An online CBT platform that helps students take lesson tests, practice their knowledge, and receive instant results.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-14 bg-success px-8 text-lg text-success-foreground hover:bg-success/90">
                <Link to="/register">Create Student Account</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-14 px-8 text-lg">
                <Link to="/login">Student Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto -mt-10 grid max-w-5xl gap-4 px-5 pb-16 sm:grid-cols-2 lg:grid-cols-5">
        {features.map((f) => (
          <div key={f.t} className="rounded-2xl border bg-card p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><f.icon className="h-5 w-5" /></span>
            <p className="mt-3 font-display font-bold">{f.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
      <footer className="pb-8 text-center text-sm text-muted-foreground">© SCHOLARS CBT · <Link to="/staff" className="underline opacity-60 hover:opacity-100">Staff login</Link></footer>
    </main>
  );
}
