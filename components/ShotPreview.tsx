"use client";

import { assetUrl, Frame, Rect, slotRect } from "@/lib/frame";

function rectStyle(rect: Rect): React.CSSProperties {
  return { left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` };
}

export default function ShotPreview({ frame, index, shot, liveVideo }: { frame: Frame; index: number; shot: string | null; liveVideo: React.RefObject<HTMLVideoElement | null> }) {
  const slot = slotRect(index, frame.showHero);
  return <div className="single-shot" style={{ aspectRatio: `${slot.w * 800} / ${slot.h * 1000}` }}>
    <div className="single-shot-photo" style={rectStyle(frame.layout[index].photo)}>
      {shot ? <img src={shot} alt={`${index + 1}번째 촬영 사진`} /> : <video ref={liveVideo} autoPlay muted playsInline className="mirrored" />}
    </div>
    {frame.poses[index] && <img className="single-shot-pose" src={assetUrl(frame.poses[index])!} alt="포즈 가이드" style={rectStyle(frame.layout[index].person)} />}
  </div>;
}
