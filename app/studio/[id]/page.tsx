"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Download, Printer, RefreshCw, RotateCcw, Share2, Timer } from "lucide-react";
import ShotPreview from "@/components/ShotPreview";
import { Frame } from "@/lib/frame";
import { renderComposite } from "@/lib/composite";

export default function Studio({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [frame, setFrame] = useState<Frame | null>(null);
  const [shots, setShots] = useState<(string | null)[]>([null, null, null, null]);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [revealComplete, setRevealComplete] = useState(false);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [shareError, setShareError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shotsRef = useRef<(string | null)[]>([null, null, null, null]);
  const completionVersionRef = useRef(0);
  const autoSequenceRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);
  useEffect(() => { if (!id) return; fetch("/api/frames").then((r) => r.json() as Promise<Frame[]>).then((list) => { const selected = list.find((f) => f.id === id); if (selected) setFrame(selected); else setError("프레임을 찾을 수 없습니다."); }).catch(() => setError("프레임을 불러오지 못했습니다.")); }, [id]);
  useEffect(() => { if (!frame || finishing || result) return; if (!navigator.mediaDevices?.getUserMedia) { setError("이 브라우저에서는 카메라를 사용할 수 없습니다. HTTPS 연결을 확인해 주세요."); return; } let cancelled = false; navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }).then((stream) => { if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; } streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } setCameraReady(true); setError(""); }).catch(() => setError("카메라를 사용할 수 없습니다. 브라우저 권한과 HTTPS 연결을 확인해 주세요.")); return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; setCameraReady(false); }; }, [frame?.id, finishing, !!result]);
  useEffect(() => { if (videoRef.current && streamRef.current) { videoRef.current.srcObject = streamRef.current; videoRef.current.play().catch(() => {}); } }, [cameraReady, step, shots[step], result]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); completionVersionRef.current++; }, []);
  const complete = useCallback(async (capturedShots: string[]) => {
    if (!frame) return;
    const version = ++completionVersionRef.current;
    setFinishing(true);
    setError("");
    try {
      const image = await renderComposite(frame, capturedShots);
      if (version !== completionVersionRef.current) return;
      setResult(image);
      setFinishing(false);
      setRevealComplete(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      timers.current.push(setTimeout(() => setRevealComplete(true), 1700));
    } catch (e) {
      if (version !== completionVersionRef.current) return;
      autoSequenceRef.current = false;
      setError(e instanceof Error ? e.message : "이미지를 만들지 못했습니다.");
      const retry = capturedShots.map((shot, i) => i === 3 ? null : shot);
      shotsRef.current = retry;
      setShots(retry);
      setFinishing(false);
    }
  }, [frame]);
  const take = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) { setError("카메라가 준비되는 중입니다."); setCount(null); return; }
    const displayRatio = video.clientWidth && video.clientHeight ? video.clientWidth / video.clientHeight : video.videoWidth / video.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = Math.round(canvas.width / displayRatio);
    const ctx = canvas.getContext("2d")!;
    let sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
    let sourceX = 0, sourceY = 0;
    if (sourceWidth / sourceHeight > displayRatio) { sourceWidth = sourceHeight * displayRatio; sourceX = (video.videoWidth - sourceWidth) / 2; }
    else { sourceHeight = sourceWidth / displayRatio; sourceY = (video.videoHeight - sourceHeight) / 2; }
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL("image/jpeg", .92);
    const updatedShots = shotsRef.current.map((shot, i) => i === step ? captured : shot);
    shotsRef.current = updatedShots;
    setShots(updatedShots);
    setCount(null);
    setFlash(true);
    timers.current.push(setTimeout(() => setFlash(false), 320));
    if (step < 3) timers.current.push(setTimeout(() => setStep(step + 1), 650));
    else timers.current.push(setTimeout(() => complete(updatedShots as string[]), 450));
  }, [step, complete]);
  const startCapture = () => { if (!cameraReady || count !== null || shots[step] || finishing) return; if (mode === "manual") { autoSequenceRef.current = false; take(); return; } autoSequenceRef.current = true; setCount(3); timers.current.push(setTimeout(() => setCount(2), 1000), setTimeout(() => setCount(1), 2000), setTimeout(take, 3000)); };
  useEffect(() => { if (!autoSequenceRef.current || mode !== "auto" || step === 0 || !cameraReady || shots[step] || count !== null || finishing || result) return; const timer = setTimeout(() => startCapture(), 450); return () => clearTimeout(timer); }, [step, mode, cameraReady, shots[step], count, finishing, result]);
  const retake = () => { autoSequenceRef.current = false; timers.current.forEach(clearTimeout); timers.current = []; setCount(null); setFlash(false); const updated = shotsRef.current.map((shot, i) => i === step ? null : shot); shotsRef.current = updated; setShots(updated); };
  const restart = () => { autoSequenceRef.current = false; completionVersionRef.current++; timers.current.forEach(clearTimeout); timers.current = []; const empty = [null, null, null, null]; shotsRef.current = empty; setShots(empty); setStep(0); setFinishing(false); setRevealComplete(false); setResult(null); setError(""); setSharedId(null); setShareError(""); setFlash(false); };
  const download = () => { if (!result || !frame) return; const a = document.createElement("a"); a.href = result; a.download = `one-studio-${frame.title.replace(/[^a-zA-Z0-9가-힣_-]/g, "-")}.png`; a.click(); };
  const share = async () => {
    if (!result || !frame || sharing || sharedId) return;
    setSharing(true);
    setShareError("");
    try {
      const image = await fetch(result).then((response) => response.blob());
      const body = new FormData();
      body.append("image", image, "one-studio.png");
      body.append("frameId", frame.id);
      const response = await fetch("/api/gallery", { method: "POST", body });
      const data = await response.json() as { id?: string; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error || "갤러리에 공유하지 못했습니다.");
      setSharedId(data.id);
    } catch (cause) {
      setShareError(cause instanceof Error ? cause.message : "갤러리에 공유하지 못했습니다.");
    } finally { setSharing(false); }
  };
  return <><main className="site-shell studio-shell"><header className="topbar"><a href="/" className="brand">ONE STUDIO</a><a href="/" className="quiet-link"><ArrowLeft size={16}/> 프레임 선택</a></header>
    {frame ? <div className="studio-layout"><section className="studio-main"><div className="studio-kicker">PHOTO SESSION <span> / {result || finishing ? "04 OF 04" : `${String(step + 1).padStart(2, "0")} OF 04`}</span></div><h1>{result ? "네 컷이 완성됐어요!" : finishing ? "사진을 인화하고 있어요" : `${step + 1}번째 포즈를 준비해요`}</h1><p>{result ? "완성된 사진을 저장하거나 출력할 수 있어요." : finishing ? "잠시만 기다려 주세요. 완성된 사진이 곧 나옵니다." : shots[step] ? "잠시 후 다음 컷으로 자동 이동합니다." : "투명 인물 가이드를 보며 빈 공간에 위치해 주세요."}</p>
      <div className="studio-session-strip"><div className="session-identity"><span>YOUR SESSION</span><strong>{frame.title}</strong></div><div className="session-progress" aria-label="촬영 진행 상태">{shots.map((shot, i) => <span key={i} className={shot ? "done" : i === step && !result ? "current" : ""}>{shot ? <Check size={14}/> : String(i + 1).padStart(2, "0")}</span>)}</div></div>
      <div className="studio-preview">{result ? <div className="print-stage"><div className="booth-slot" aria-hidden="true"/><div className="print-sheet"><img src={result} alt="완성된 네 컷 이미지" /></div></div> : finishing ? <div className="finishing-screen" role="status">사진을 인화하는 중...</div> : <ShotPreview frame={frame} index={step} shot={shots[step]} liveVideo={videoRef}/>}{count !== null && <div className="countdown-overlay" role="status" aria-live="assertive"><span>{count}</span></div>}{flash && <div className="shutter-flash" aria-hidden="true" />}</div>
    </section><aside className="studio-side">
      {result ? <div className="side-card action-card"><div className="success-icon"><Check size={24}/></div><h3>사진이 완성됐어요</h3><p>공유 버튼을 누르기 전까지 사진은 서버에 저장되지 않습니다.</p>{error && <div className="error-note" role="alert">{error}</div>}{revealComplete && <><button className="primary-button full" onClick={download}><Download size={18}/> 저장하기</button><button className="outline-button full" onClick={() => window.print()}><Printer size={18}/> 출력하기</button>{sharedId ? <div className="gallery-shared" role="status"><Check size={17}/> 전체 갤러리에 공유됐어요. <a href="/gallery">사진 보러 가기</a></div> : <><button className="outline-button full" disabled={sharing} onClick={share}><Share2 size={17}/> {sharing ? "공유 중..." : "전체 갤러리에 공유"}</button><p className="share-privacy">공유하면 사진이 서버에 저장되고 누구나 갤러리에서 볼 수 있습니다.</p></>}{shareError && <div className="error-note" role="alert">{shareError}</div>}<button className="outline-button full" disabled={sharing} onClick={restart}><RotateCcw size={17}/> 처음부터 다시 찍기</button></>}</div> : finishing ? <div className="side-card action-card"><span className="eyebrow">PHOTO BOOTH</span><h3>사진을 인화하는 중...</h3><p>네 컷을 한 장으로 합치고 있어요.</p></div> : <div className="side-card action-card"><span className="eyebrow">CAPTURE MODE</span><div className="mode-switch"><button className={mode === "auto" ? "active" : ""} disabled={count !== null || !!shots[step]} onClick={() => setMode("auto")}><Timer size={16}/> 3초 자동</button><button className={mode === "manual" ? "active" : ""} disabled={count !== null || !!shots[step]} onClick={() => { autoSequenceRef.current = false; setMode("manual"); }}><Camera size={16}/> 수동</button></div>{error && <div className="error-note" role="alert">{error}</div>}{shots[step] ? <><p>{step === 3 ? "완성 사진을 준비합니다." : "다음 컷으로 자동 이동합니다."}</p><button className="outline-button full" onClick={retake}><RefreshCw size={17}/> 이 컷 다시 찍기</button></> : <button className="primary-button full" disabled={!cameraReady || count !== null} onClick={startCapture}><Camera size={18}/> {cameraReady ? mode === "auto" ? "카운트다운 시작" : "사진 찍기" : "카메라 연결 중"}</button>}<p className="privacy-note">※ 새로고침하면 촬영 중인 사진은 사라집니다.</p></div>}
    </aside></div> : <div className="empty-state">{error || "프레임을 불러오는 중..."}</div>}
  </main>{result && <div className="print-only"><img src={result} alt="출력할 완성 사진" /></div>}</>;
}
