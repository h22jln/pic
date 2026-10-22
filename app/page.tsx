"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Frame } from "@/lib/frame";

export default function Home() {
  const [frame, setFrame] = useState<Frame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/frames")
      .then((response) => {
        if (!response.ok) throw new Error("프레임을 불러오지 못했습니다.");
        return response.json() as Promise<Frame[]>;
      })
      .then((frames) => setFrame(frames[0] ?? null))
      .catch(() => setError("잠시 후 다시 시도해 주세요."))
      .finally(() => setLoading(false));
  }, []);

  return <main className="landing-shell">
    <header className="landing-header"><span className="brand-mark">P<span>✦</span></span><span>POSE FRAME<br/><small>PHOTO STUDIO</small></span></header>
    <section className="landing-content" aria-live="polite">
      <span className="landing-eyebrow">FOUR CUT PHOTO EXPERIENCE</span>
      <h1>{frame?.title ?? "포즈 프레임 스튜디오"}</h1>
      <p>{loading ? "촬영을 준비하는 중입니다." : error || frame?.subtitle || "함께 만드는 네 컷의 순간을 시작해 보세요."}</p>
      <a className="landing-start" href="/frames">시작하기 <ArrowRight size={20}/></a>
    </section>
  </main>;
}
