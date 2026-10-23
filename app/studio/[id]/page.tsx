"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Download, Eye, EyeOff, Move, Printer, RefreshCw, RotateCcw, Timer } from "lucide-react";
import FramePreview from "@/components/FramePreview";
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
  const [updatingResult, setUpdatingResult] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [activeDecorationId, setActiveDecorationId] = useState<string | null>(null);
  const [hiddenDecorationIds, setHiddenDecorationIds] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shotsRef = useRef<(string | null)[]>([null, null, null, null]);
  const completionVersionRef = useRef(0);
  const compositionKeyRef = useRef("");
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
    const key = JSON.stringify({ decorations: frame.decorations, hiddenDecorationIds });
    try {
      const image = await renderComposite({ ...frame, decorations: frame.decorations.filter((item) => !hiddenDecorationIds.includes(item.id)) }, capturedShots);
      if (version !== completionVersionRef.current) return;
      compositionKeyRef.current = key;
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
  }, [frame, hiddenDecorationIds]);
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
  const restart = () => { autoSequenceRef.current = false; completionVersionRef.current++; timers.current.forEach(clearTimeout); timers.current = []; const empty = [null, null, null, null]; shotsRef.current = empty; setShots(empty); setStep(0); setFinishing(false); setRevealComplete(false); setUpdatingResult(false); setResult(null); setError(""); setFlash(false); };
  const download = () => { if (!result || !frame) return; const a = document.createElement("a"); a.href = result; a.download = `one-studio-${frame.title.replace(/[^a-zA-Z0-9가-힣_-]/g, "-")}.png`; a.click(); };
  const userDecorations = frame?.decorations.filter((item) => item.editableByUser) ?? [];
  const activeDecoration = userDecorations.find((item) => item.id === activeDecorationId) ?? userDecorations[0];
  const updateUserDecoration = (id: string, patch: Partial<{ x: number; y: number; w: number; h: number }>) => setFrame((old) => old ? { ...old, decorations: old.decorations.map((item) => item.id === id && item.editableByUser ? { ...item, rect: { ...item.rect, ...patch } } : item) } : old);
  const dragUserDecoration = (id: string, dx: number, dy: number) => { const item = frame?.decorations.find((d) => d.id === id && d.editableByUser); if (!item) return; setActiveDecorationId(id); setFrame((old) => old ? { ...old, decorations: old.decorations.map((d) => d.id === id && d.editableByUser ? { ...d, rect: { ...d.rect, x: Math.max(-1, Math.min(1, d.rect.x + dx)), y: Math.max(-1, Math.min(1, d.rect.y + dy)) } } : d) } : old); };
  const toggleDecoration = (id: string) => setHiddenDecorationIds((old) => old.includes(id) ? old.filter((value) => value !== id) : [...old, id]);
  useEffect(() => {
    if (!result || !frame) return;
    const key = JSON.stringify({ decorations: frame.decorations, hiddenDecorationIds });
    if (key === compositionKeyRef.current) return;
    let cancelled = false;
    setUpdatingResult(true);
    const timer = setTimeout(() => {
      renderComposite({ ...frame, decorations: frame.decorations.filter((item) => !hiddenDecorationIds.includes(item.id)) }, shotsRef.current as string[])
        .then((image) => { if (!cancelled) { compositionKeyRef.current = key; setResult(image); setUpdatingResult(false); } })
        .catch(() => { if (!cancelled) { setError("장식 변경을 이미지에 적용하지 못했습니다."); setUpdatingResult(false); } });
    }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [frame?.decorations, hiddenDecorationIds, result]);
  return <><main className="site-shell studio-shell"><header className="topbar"><a href="/" className="brand">ONE STUDIO</a><a href="/" className="quiet-link"><ArrowLeft size={16}/> 프레임 선택</a></header>
    {frame ? <div className="studio-layout"><section className="studio-main"><div className="studio-kicker">PHOTO SESSION <span> / {result || finishing ? "04 OF 04" : `${String(step + 1).padStart(2, "0")} OF 04`}</span></div><h1>{result ? "네 컷이 완성됐어요!" : finishing ? "사진을 인화하고 있어요" : `${step + 1}번째 포즈를 준비해요`}</h1><p>{result ? "완성된 사진을 저장하거나 출력할 수 있어요." : finishing ? "잠시만 기다려 주세요. 완성된 사진이 곧 나옵니다." : shots[step] ? "잠시 후 다음 컷으로 자동 이동합니다." : "투명 인물 가이드를 보며 빈 공간에 위치해 주세요."}</p>
      <div className="studio-session-strip"><div className="session-identity"><span>YOUR SESSION</span><strong>{frame.title}</strong></div><div className="session-progress" aria-label="촬영 진행 상태">{shots.map((shot, i) => <span key={i} className={shot ? "done" : i === step && !result ? "current" : ""}>{shot ? <Check size={14}/> : String(i + 1).padStart(2, "0")}</span>)}</div></div>
      <div className="studio-preview">{result ? <div className="print-stage"><div className="booth-slot" aria-hidden="true"/><div className="print-sheet"><img src={result} alt="완성된 네 컷 이미지" /></div></div> : finishing ? <div className="finishing-screen" role="status">사진을 인화하는 중...</div> : <ShotPreview frame={frame} index={step} shot={shots[step]} liveVideo={videoRef}/>}{count !== null && <div className="countdown-overlay" role="status" aria-live="assertive"><span>{count}</span></div>}{flash && <div className="shutter-flash" aria-hidden="true" />}</div>
    </section><aside className="studio-side">
      {result && userDecorations.length > 0 && <div className="side-card user-decoration-card"><span className="eyebrow"><Move size={14}/> DECORATE</span><h3>장식 꾸미기</h3><p>아래 미리보기에서 사용자용 장식을 드래그하거나 크기를 조절할 수 있어요.</p><FramePreview frame={frame} shots={shots} onDecorationDrag={dragUserDecoration} editableDecorationIds={userDecorations.map((item) => item.id)} hiddenDecorationIds={hiddenDecorationIds}/><div className="user-decoration-tabs">{userDecorations.map((item, i) => <button key={item.id} className={activeDecoration?.id === item.id ? "active" : ""} onClick={() => setActiveDecorationId(item.id)}>장식 {i + 1}</button>)}</div>{activeDecoration && <><button className="decoration-visibility" onClick={() => toggleDecoration(activeDecoration.id)}>{hiddenDecorationIds.includes(activeDecoration.id) ? <Eye size={16}/> : <EyeOff size={16}/>} {hiddenDecorationIds.includes(activeDecoration.id) ? "장식 표시" : "장식 숨기기"}</button><div className="user-decoration-ranges">{(["x", "y", "w", "h"] as const).map((axis) => <label key={axis}>{({ x: "가로 위치", y: "세로 위치", w: "너비", h: "높이" } as const)[axis]}<input type="range" min={axis === "x" || axis === "y" ? "-1" : "0.05"} max="1" step="0.01" value={activeDecoration.rect[axis]} onChange={(e) => updateUserDecoration(activeDecoration.id, { [axis]: Number(e.target.value) })}/></label>)}</div></>}</div>}
      {result ? <div className="side-card action-card"><div className="success-icon"><Check size={24}/></div><h3>사진이 완성됐어요</h3><p>촬영 사진은 서버에 보관되지 않습니다.</p>{error && <div className="error-note" role="alert">{error}</div>}{revealComplete && <><button className="primary-button full" disabled={updatingResult} onClick={download}><Download size={18}/> {updatingResult ? "사진 반영 중..." : "저장하기"}</button><button className="outline-button full" disabled={updatingResult} onClick={() => window.print()}><Printer size={18}/> 출력하기</button><button className="outline-button full" onClick={restart}><RotateCcw size={17}/> 처음부터 다시 찍기</button></>}</div> : finishing ? <div className="side-card action-card"><span className="eyebrow">PHOTO BOOTH</span><h3>사진을 인화하는 중...</h3><p>네 컷을 한 장으로 합치고 있어요.</p></div> : <div className="side-card action-card"><span className="eyebrow">CAPTURE MODE</span><div className="mode-switch"><button className={mode === "auto" ? "active" : ""} disabled={count !== null || !!shots[step]} onClick={() => setMode("auto")}><Timer size={16}/> 3초 자동</button><button className={mode === "manual" ? "active" : ""} disabled={count !== null || !!shots[step]} onClick={() => { autoSequenceRef.current = false; setMode("manual"); }}><Camera size={16}/> 수동</button></div>{error && <div className="error-note" role="alert">{error}</div>}{shots[step] ? <><p>{step === 3 ? "완성 사진을 준비합니다." : "다음 컷으로 자동 이동합니다."}</p><button className="outline-button full" onClick={retake}><RefreshCw size={17}/> 이 컷 다시 찍기</button></> : <button className="primary-button full" disabled={!cameraReady || count !== null} onClick={startCapture}><Camera size={18}/> {cameraReady ? mode === "auto" ? "카운트다운 시작" : "사진 찍기" : "카메라 연결 중"}</button>}<p className="privacy-note">※ 새로고침하면 촬영 중인 사진은 사라집니다.</p></div>}
    </aside></div> : <div className="empty-state">{error || "프레임을 불러오는 중..."}</div>}
  </main>{result && <div className="print-only"><img src={result} alt="출력할 완성 사진" /></div>}</>;
}
