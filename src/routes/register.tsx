import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Student Account — Online Lesson Test" },
      { name: "description", content: "Register as a student to take your online lesson tests." },
      { property: "og:title", content: "Create Student Account" },
      { property: "og:description", content: "Register as a student to take your online lesson tests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [f, setF] = useState({ full_name: "", student_id: "", email: "", password: "", confirm: "", class: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (f.password !== f.confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: f.full_name.trim(), student_id: f.student_id.trim(), class: f.class.trim() },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) return toast.success("Account created. Please log in.");
    navigate({ to: "/dashboard" });
  }

  const fields: [keyof typeof f, string, string][] = [
    ["full_name", "Full Name", "text"],
    ["student_id", "Student ID / Registration Number", "text"],
    ["email", "Email", "email"],
    ["class", "Class (e.g. JSS 2)", "text"],
    ["password", "Password", "password"],
    ["confirm", "Confirm Password", "password"],
  ];
  return (
    <AuthCard title="Create Account" subtitle="Fill in your details to get started.">
      <form onSubmit={submit} className="space-y-4">
        {fields.map(([k, label, type]) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={k}>{label}</Label>
            <Input id={k} type={type} required value={f[k]} onChange={set(k)} className="h-12 text-base" />
          </div>
        ))}
        <Button type="submit" disabled={busy} className="h-12 w-full text-base">
          {busy ? "Creating..." : "Create Account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-bold text-primary">Log in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
