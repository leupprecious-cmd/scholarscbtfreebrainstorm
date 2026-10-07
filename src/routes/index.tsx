import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — Online Lesson Test" },
      { name: "description", content: "Create your student account, take your test online and see your result immediately." },
      { property: "og:title", content: "Welcome — Online Lesson Test" },
      { property: "og:description", content: "Create your student account, take your test online and see your result immediately." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: settings } = useSettings();
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10">
        <div className="flex items-center gap-2 text-primary">
          <BookOpenCheck className="h-6 w-6" />
          <span className="font-display text-lg font-bold">{settings?.lesson_name ?? "My Lesson"}</span>
        </div>
        <section className="flex flex-1 flex-col justify-center py-14">
          <p className="mb-4 inline-block w-fit rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">Student test portal</p>
          <h1 className="text-4xl font-extrabold leading-[1.05] text-foreground sm:text-6xl">
            Welcome to {settings?.lesson_name ?? "My Lesson"} Online Test
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Create your account, start your test, answer the questions and see your result straight away.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-14 px-8 text-lg">
              <Link to="/register">Create Account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg">
              <Link to="/login">Student Login</Link>
            </Button>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              { icon: BookOpenCheck, t: "One question at a time", d: "Simple and easy on your phone." },
              { icon: Clock, t: "Answers saved automatically", d: "A refresh won't lose your work." },
              { icon: Trophy, t: "Instant results", d: "See your score after you submit." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border bg-card p-4">
                <f.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 font-bold">{f.t}</p>
                <p className="text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
