"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, QrCode } from "lucide-react";

type Photo = { id: string; frameTitle: string; createdAt: number; imageUrl: string; pageUrl: string };

export default function AdminQrPhotos() {
  const [items, setItems] = useState<Photo[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/qr-photos?page=${page}`).then(async (response) => {
      if (response.status === 401) { setUnauthorized(true); throw new Error("관리자 로그인이 필요합니다."); }
      const data = await response.json() as { items?: Photo[]; hasMore?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "사진을 불러오지 못했습니다.");
      if (!cancelled) { setItems((old) => page === 0 ? data.items || [] : [...old, ...(data.items || [])]); setHasMore(!!data.hasMore); }
    }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "사진을 불러오지 못했습니다."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);
  return <main className="site-shell admin-qr-page"><header className="topbar"><a href="/admin" className="brand">ONE STUDIO <small>ADMIN</small></a><a href="/admin" className="quiet-link"><ArrowLeft size={16}/> 프레임 관리</a></header>
    <section className="admin-qr-header"><QrCode size={28}/><h1>QR 사진</h1><p>촬영 전에 ‘QR로 사진 받기’를 선택한 완성 사진입니다.</p></section>
    {error && <div className="error-note" role="alert">{error} {unauthorized && <a href="/admin">관리자 로그인</a>}</div>}
    {!loading && !error && items.length === 0 && <div className="empty-state">저장된 QR 사진이 없습니다.</div>}
    <div className="admin-qr-grid">{items.map((photo) => <article className="admin-qr-card" key={photo.id}><a href={photo.pageUrl} target="_blank" rel="noreferrer"><img src={photo.imageUrl} alt={`${photo.frameTitle} 완성 사진`}/></a><strong>{photo.frameTitle}</strong><small>{new Date(photo.createdAt).toLocaleString("ko-KR")}</small><a className="outline-button" href={photo.imageUrl} download={`one-studio-${photo.id}.png`}><Download size={16}/> 사진 저장</a></article>)}</div>
    {hasMore && <button className="outline-button qr-more" disabled={loading} onClick={() => { setLoading(true); setPage((old) => old + 1); }}>사진 더 보기</button>}
  </main>;
}
