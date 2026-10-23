"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FramePreview from "@/components/FramePreview";
import { Frame } from "@/lib/frame";

export default function FramesPage() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/frames")
      .then((response) => {
        if (!response.ok) throw new Error("프레임을 불러오지 못했습니다.");
        return response.json() as Promise<Frame[]>;
      })
      .then(setFrames)
      .catch(() => setError("프레임을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."))
      .finally(() => setLoading(false));
  }, []);

  return <main className="site-shell">
    <header className="topbar">
      <div className="brand">ONE STUDIO</div>
      <a className="quiet-link" href="/"><ArrowLeft size={16}/> 처음으로</a>
    </header>
    <section className="select-section">
      <div className="section-heading">
        <div><span className="eyebrow">SELECT YOUR FRAME</span><h1>프레임 고르기</h1><p className="selection-help">마음에 드는 프레임을 선택해 네 컷 촬영을 시작하세요.</p></div>
        {!loading && !error && <span className="count-label">{frames.length} FRAMES</span>}
      </div>
      {loading ? <div className="empty-state"><p>프레임을 불러오는 중입니다.</p></div>
        : error ? <div className="empty-state"><h2>프레임을 불러오지 못했습니다</h2><p>{error}</p><button className="outline-button" onClick={() => window.location.reload()}>다시 시도</button></div>
        : frames.length === 0 ? <div className="empty-state"><h2>선택할 수 있는 프레임이 없습니다</h2><p>공개된 프레임이 등록되면 여기에서 선택할 수 있습니다.</p></div>
        : <div className="frame-grid">{frames.map((frame, index) => <a className="frame-card" href={`/studio/${frame.id}`} key={frame.id} aria-label={`${frame.title} 프레임 선택`}>
            <div className="card-art"><FramePreview frame={frame}/></div>
            <div className="card-info"><div><span className="card-index">FRAME {String(index + 1).padStart(2, "0")}</span><h2>{frame.title}</h2><p>{frame.subtitle}</p></div><span className="card-arrow"><ArrowRight size={18}/></span></div>
          </a>)}</div>}
    </section>
  </main>;
}
