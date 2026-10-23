"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Image as ImageIcon } from "lucide-react";

type GalleryItem = { id: string; frameTitle: string; createdAt: number; imageUrl: string };
type GalleryPage = { items: GalleryItem[]; hasMore: boolean };

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/gallery?page=${page}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as GalleryPage & { error?: string };
        if (!response.ok) throw new Error(data.error || "갤러리를 불러오지 못했습니다.");
        return data;
      })
      .then((data) => { setItems((old) => page === 0 ? data.items : [...old, ...data.items]); setHasMore(data.hasMore); })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "갤러리를 불러오지 못했습니다."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, retry]);

  return <main className="site-shell gallery-shell">
    <header className="topbar"><a href="/" className="brand">ONE STUDIO</a><a href="/" className="quiet-link"><ArrowLeft size={16}/> 첫 화면</a></header>
    <section className="gallery-window">
      <div className="gallery-titlebar">ONE STUDIO — GALLERY</div>
      <div className="gallery-content">
        <div className="gallery-heading"><div><span className="eyebrow">SHARED PHOTOS</span><h1>전체 갤러리</h1><p>촬영자가 직접 공유한 완성 사진입니다.</p></div><a className="primary-button" href="/frames"><Camera size={17}/> 나도 사진 찍기</a></div>
        {error && <div className="error-note" role="alert">{error}</div>}
        {!loading && items.length === 0 && !error && <div className="empty-state"><ImageIcon size={36}/><h3>아직 공유된 사진이 없어요</h3><p>첫 번째 사진을 찍고 갤러리에 공유해 보세요.</p><a className="primary-button" href="/frames">사진 찍기</a></div>}
        {items.length > 0 && <div className="gallery-grid">{items.map((item) => <a className="gallery-card" href={item.imageUrl} target="_blank" rel="noopener noreferrer" key={item.id} aria-label={`${item.frameTitle} 완성 사진 보기`}><div className="gallery-photo"><img src={item.imageUrl} alt={`${item.frameTitle}로 만든 네 컷 사진`} loading="lazy" /></div><div className="gallery-caption"><strong>{item.frameTitle}</strong><time dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleDateString("ko-KR")}</time></div></a>)}</div>}
        {loading && <p className="gallery-status" role="status">사진을 불러오는 중...</p>}
        {!loading && hasMore && <button className="outline-button gallery-more" onClick={() => setPage((value) => value + 1)}>더 보기</button>}
        {!loading && error && <button className="outline-button gallery-more" onClick={() => setRetry((value) => value + 1)}>다시 시도</button>}
      </div>
    </section>
  </main>;
}
