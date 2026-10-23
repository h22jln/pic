import { eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { qrPhotos } from "@/db/schema";

export const metadata = { title: "QR 사진 | ONE STUDIO", robots: { index: false, follow: false } };

export default async function QrPhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [photo] = /^[a-f0-9-]{36}$/.test(id)
    ? await getDb().select({ id: qrPhotos.id }).from(qrPhotos).where(eq(qrPhotos.id, id)).limit(1)
    : [];
  return <main className="site-shell qr-page"><header className="topbar"><Link href="/" className="brand">ONE STUDIO</Link></header>
    {photo ? <section className="qr-photo-card"><h1>완성된 사진</h1><p>QR 링크를 가진 사람은 이 사진을 볼 수 있습니다.</p><img src={`/api/qr-photos/${id}/image`} alt="완성된 네 컷 사진"/><a className="primary-button" href={`/api/qr-photos/${id}/image`} download={`one-studio-${id}.png`}>PNG 저장하기</a></section>
      : <section className="empty-state"><h1>사진을 찾을 수 없습니다.</h1><Link href="/" className="outline-button">처음으로</Link></section>}
  </main>;
}
