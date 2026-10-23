"use client";
import { assetUrl, Frame, Rect, slotRect } from "@/lib/frame";

function style(rect: Rect): React.CSSProperties { return { left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }; }

export default function FramePreview({ frame, shots, activeShot, liveVideo, onDrag, onResize, onDecorationDrag, onDecorationResize }: { frame: Frame; shots?: (string | null)[]; activeShot?: number; liveVideo?: React.RefObject<HTMLVideoElement | null>; onDrag?: (index: number, part: "photo" | "person", dx: number, dy: number) => void; onResize?: (index: number, dw: number, dh: number) => void; onDecorationDrag?: (id: string, dx: number, dy: number) => void; onDecorationResize?: (id: string, dw: number, dh: number) => void; }) {
  return <div className="frame-art" style={{ backgroundColor: frame.backgroundColor }}>
    {Array.from({ length: 4 }, (_, i) => {
      const slot = slotRect(i, frame.showHero);
      return <div className="frame-slot" style={style(slot)} key={i}>
        <div className="photo-area" style={style(frame.layout[i].photo)} onPointerDown={onDrag ? (e) => startDrag(e, i, "photo", onDrag) : undefined}>
          {shots?.[i] ? <img src={shots[i]!} alt={`${i + 1}번째 촬영 사진`} /> : activeShot === i && liveVideo ? <video ref={liveVideo} autoPlay muted playsInline className="mirrored" /> : <div className="slot-empty" />}
        </div>
      </div>;
    })}
    {frame.showHero && <div className="hero-area">{frame.hero ? <img src={assetUrl(frame.hero)!} alt="프레임 대표 이미지" /> : <div className="hero-placeholder">HERO<br/>IMAGE</div>}</div>}
    {frame.poses.map((key, i) => key && <div className="pose-container" style={style(slotRect(i, frame.showHero))} key={i}>
      <img className="pose-layer" src={assetUrl(key)!} alt="" style={style(frame.layout[i].person)} onPointerDown={onDrag ? (e) => startDrag(e, i, "person", onDrag) : undefined} />
      {onResize && <button type="button" className="resize-handle pose-resize" style={{ left: `${(frame.layout[i].person.x + frame.layout[i].person.w) * 100}%`, top: `${(frame.layout[i].person.y + frame.layout[i].person.h) * 100}%` }} aria-label={`${i + 1}번 포즈 이미지 크기 조절`} onPointerDown={(e) => startResize(e, onResize, i, e.currentTarget.parentElement!)} />}
    </div>)}
    {frame.decoration && <img className="decoration-layer" src={assetUrl(frame.decoration)!} alt="" />}
    {frame.decorations.map((item) => {
      const draggable = !!onDecorationDrag;
      return <img key={item.id} className={`decoration-element${draggable ? " editable" : " locked"}`} src={assetUrl(item.key)!} alt="장식 요소" style={style(item.rect)} onPointerDown={draggable ? (e) => startDrag(e, item.id, onDecorationDrag!) : undefined} />;
    })}
    {onDecorationResize && frame.decorations.map((item) => <button type="button" key={`${item.id}-resize`} className="resize-handle decoration-resize" style={{ left: `${(item.rect.x + item.rect.w) * 100}%`, top: `${(item.rect.y + item.rect.h) * 100}%` }} aria-label="장식 요소 크기 조절" onPointerDown={(e) => startResize(e, onDecorationResize, item.id, e.currentTarget.parentElement!)} />)}
  </div>;
}

function startResize<T extends number | string>(e: React.PointerEvent<HTMLButtonElement>, onResize: (id: T, dw: number, dh: number) => void, id: T, parent: HTMLElement) {
  e.preventDefault(); e.stopPropagation();
  const handle = e.currentTarget;
  handle.setPointerCapture(e.pointerId);
  let lastX = e.clientX, lastY = e.clientY;
  const move = (event: PointerEvent) => {
    onResize(id, (event.clientX - lastX) / parent.clientWidth, (event.clientY - lastY) / parent.clientHeight);
    lastX = event.clientX; lastY = event.clientY;
  };
  const end = () => { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", end); handle.removeEventListener("pointercancel", end); };
  handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", end); handle.addEventListener("pointercancel", end);
}

function startDrag(e: React.PointerEvent, id: string, onDrag: (id: string, dx: number, dy: number) => void): void;
function startDrag(e: React.PointerEvent, index: number, part: "photo" | "person", onDrag: (index: number, part: "photo" | "person", dx: number, dy: number) => void): void;
function startDrag(e: React.PointerEvent, indexOrId: number | string, partOrDrag: "photo" | "person" | ((id: string, dx: number, dy: number) => void), maybeDrag?: (index: number, part: "photo" | "person", dx: number, dy: number) => void) {
  const onDrag = typeof partOrDrag === "function" ? partOrDrag : maybeDrag!;
  const part = typeof partOrDrag === "string" ? partOrDrag : null;
  e.preventDefault(); e.stopPropagation();
  const target = e.currentTarget as HTMLElement;
  const parent = target.parentElement!;
  target.setPointerCapture(e.pointerId);
  let lastX = e.clientX, lastY = e.clientY;
  const move = (event: PointerEvent) => {
    const dx = (event.clientX - lastX) / parent.clientWidth;
    const dy = (event.clientY - lastY) / parent.clientHeight;
    if (part) (onDrag as (index: number, part: "photo" | "person", dx: number, dy: number) => void)(indexOrId as number, part, dx, dy);
    else (onDrag as (id: string, dx: number, dy: number) => void)(indexOrId as string, dx, dy);
    lastX = event.clientX; lastY = event.clientY;
  };
  const end = () => { target.removeEventListener("pointermove", move); target.removeEventListener("pointerup", end); target.removeEventListener("pointercancel", end); };
  target.addEventListener("pointermove", move); target.addEventListener("pointerup", end); target.addEventListener("pointercancel", end);
}
