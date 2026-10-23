import { assetUrl, Frame, Rect, slotRect } from "./frame";

const W = 800;
const H = 1000;

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = src;
  });
}

function box(rect: Rect, parent: Rect) {
  return { x: (parent.x + rect.x * parent.w) * W, y: (parent.y + rect.y * parent.h) * H, w: rect.w * parent.w * W, h: rect.h * parent.h * H };
}

function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, b: { x: number; y: number; w: number; h: number }) {
  const scale = Math.max(b.w / image.width, b.h / image.height);
  const iw = image.width * scale;
  const ih = image.height * scale;
  ctx.save();
  ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
  ctx.drawImage(image, b.x + (b.w - iw) / 2, b.y + (b.h - ih) / 2, iw, ih);
  ctx.restore();
}

function contain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, b: { x: number; y: number; w: number; h: number }) {
  const scale = Math.min(b.w / image.width, b.h / image.height);
  const iw = image.width * scale;
  const ih = image.height * scale;
  ctx.drawImage(image, b.x + (b.w - iw) / 2, b.y + (b.h - ih) / 2, iw, ih);
}

export async function renderComposite(frame: Frame, shots: string[]): Promise<string> {
  if (shots.length !== 4 || shots.some((shot) => !shot)) throw new Error("네 컷을 모두 촬영해 주세요.");
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없습니다.");
  ctx.fillStyle = frame.backgroundColor; ctx.fillRect(0, 0, W, H);
  const shotImages = await Promise.all(shots.map(loadImage));
  const poseImages = await Promise.all(frame.poses.map((key) => key ? loadImage(assetUrl(key)!) : Promise.resolve(null)));
  for (let i = 0; i < 4; i++) {
    const slot = slotRect(i, frame.showHero);
    const outer = { x: slot.x * W, y: slot.y * H, w: slot.w * W, h: slot.h * H };
    ctx.fillStyle = "#ffffff"; ctx.fillRect(outer.x, outer.y, outer.w, outer.h);
    cover(ctx, shotImages[i], box(frame.layout[i].photo, slot));
  }
  if (frame.showHero) {
    const heroBox = { x: W * .51, y: H * .045, w: W * .44, h: H * .9 };
    ctx.fillStyle = "#d8d7d1"; ctx.fillRect(heroBox.x, heroBox.y, heroBox.w, heroBox.h);
    if (frame.hero) cover(ctx, await loadImage(assetUrl(frame.hero)!), heroBox);
  }
  for (let i = 0; i < 4; i++) {
    if (poseImages[i]) contain(ctx, poseImages[i]!, box(frame.layout[i].person, slotRect(i, frame.showHero)));
  }
  if (frame.decoration) contain(ctx, await loadImage(assetUrl(frame.decoration)!), { x: 0, y: 0, w: W, h: H });
  for (const item of frame.decorations) contain(ctx, await loadImage(assetUrl(item.key)!), box(item.rect, { x: 0, y: 0, w: 1, h: 1 }));
  return canvas.toDataURL("image/png");
}
