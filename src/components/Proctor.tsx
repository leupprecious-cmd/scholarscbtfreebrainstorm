import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const SNAP_MS = 75_000;

/** Blocks the exam until the camera is on, then takes periodic snapshots and logs tab switches. */
export function Proctor({ attemptId, studentId, children }: { attemptId: string; studentId: string; children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [switches, setSwitches] = useState(0);

  const log = useCallback(async (kind: string, photo_path: string | null = null) => {
    await supabase.from("proctor_events").insert({ attempt_id: attemptId, student_id: studentId, kind, photo_path });
  }, [attemptId, studentId]);

  const snap = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = 320; c.height = Math.round((320 * v.videoHeight) / v.videoWidth);
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.6));
    if (!blob) return;
    const path = `${studentId}/${attemptId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("proctor").upload(path, blob, { contentType: "image/jpeg" });
    if (!error) await log("snapshot", path);
  }, [attemptId, studentId, log]);

  const start = useCallback(async () => {
    setErr("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640 }, audio: false });
      streamRef.current = s;
      s.getVideoTracks()[0]?.addEventListener("ended", () => { setReady(false); void log("camera_off"); });
      setReady(true);
    } catch {
      setErr("Camera access was blocked. Allow the camera in your browser settings, then tap the button again.");
    }
  }, [log]);

  useEffect(() => {
    if (ready && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const first = setTimeout(() => void snap(), 3000);
    const t = setInterval(() => void snap(), SNAP_MS);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [ready, snap]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        setSwitches((n) => n + 1);
        void log("tab_switch");
        toast.warning("Leaving the test page is recorded and reported to your examiner.");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [log]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-2xl border bg-card p-6 text-center">
          <Camera className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-2xl font-bold">Camera required</h1>
          <p className="mt-2 text-muted-foreground">This exam is supervised. Your camera stays on and photos are taken during the test. Leaving the test page is also recorded.</p>
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <Button className="mt-5 h-12 w-full" onClick={start}>Turn on camera and continue</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <div className="fixed bottom-24 right-3 z-20 overflow-hidden rounded-xl border-2 border-primary bg-card shadow-lg">
        <video ref={videoRef} muted playsInline className="h-24 w-32 -scale-x-100 object-cover" />
        {switches > 0 && (
          <p className="flex items-center gap-1 bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            <AlertTriangle className="h-3 w-3" />{switches} tab switch{switches === 1 ? "" : "es"}
          </p>
        )}
      </div>
    </>
  );
}

export function ProctorReview({ attemptId }: { attemptId: string }) {
  const [items, setItems] = useState<{ id: string; kind: string; created_at: string; url?: string }[] | null>(null);
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("proctor_events").select("*").eq("attempt_id", attemptId).order("created_at");
      const rows = data ?? [];
      const paths = rows.filter((r) => r.photo_path).map((r) => r.photo_path!);
      const signed = paths.length ? (await supabase.storage.from("proctor").createSignedUrls(paths, 3600)).data ?? [] : [];
      const map = new Map(signed.map((s) => [s.path, s.signedUrl]));
      setItems(rows.map((r) => ({ id: r.id, kind: r.kind, created_at: r.created_at, url: r.photo_path ? map.get(r.photo_path) : undefined })));
    })();
  }, [attemptId]);
  if (!items) return <p className="text-sm text-muted-foreground">Loading supervision record...</p>;
  const photos = items.filter((i) => i.kind === "snapshot");
  const tabs = items.filter((i) => i.kind === "tab_switch").length;
  const camOff = items.filter((i) => i.kind === "camera_off").length;
  return (
    <div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-muted px-3 py-1">{photos.length} photos</span>
        <span className={tabs ? "rounded-full bg-destructive/15 px-3 py-1 font-bold text-destructive" : "rounded-full bg-muted px-3 py-1"}>{tabs} tab switches</span>
        {camOff > 0 && <span className="rounded-full bg-destructive/15 px-3 py-1 font-bold text-destructive">Camera turned off {camOff}×</span>}
      </div>
      {photos.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No photos recorded for this attempt.</p> : (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block">
              {p.url && <img src={p.url} alt="Exam photo" className="aspect-[4/3] w-full rounded-lg object-cover" />}
              <p className="text-center text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleTimeString()}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
