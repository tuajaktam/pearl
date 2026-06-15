import * as mupdf from "mupdf";
import { PNG } from "pngjs";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const dir = "C:/Users/Petch/Downloads/";
const OUT = "assets/img";
mkdirSync(OUT, { recursive: true });
const SCALE = 2.5;

// word -> {file, page(0-based), id}  page picture = 2nd largest image block
// 爱(love) is a vector heart -> manual crop box in PDF points
const items = [
  { w: "W2", p: 1, id: "star" },
  { w: "W2", p: 2, id: "moon" },
  { w: "W3", p: 1, id: "sun" },
  { w: "W3", p: 2, id: "cloud" },
  { w: "W4", p: 1, id: "tree" },
  { w: "W4", p: 2, id: "love", manual: { x: 360, y: 70, w: 250, h: 250 } },
  { w: "W5", p: 1, id: "flower" },
  { w: "W5", p: 2, id: "grass" },
  { w: "W6", p: 1, id: "airplane" },
  { w: "W6", p: 2, id: "boat" },
  { w: "W7", p: 1, id: "car" },
  { w: "W7", p: 2, id: "bus" },
];

const docs = {};
function getDoc(w) {
  if (!docs[w]) {
    const data = readFileSync(`${dir}N1 T3 ${w} 2026.pdf`);
    docs[w] = mupdf.Document.openDocument(data, "application/pdf");
  }
  return docs[w];
}

function cropPNG(buf, sx, sy, sw, sh) {
  const src = PNG.sync.read(Buffer.from(buf));
  sx = Math.max(0, Math.round(sx));
  sy = Math.max(0, Math.round(sy));
  sw = Math.min(src.width - sx, Math.round(sw));
  sh = Math.min(src.height - sy, Math.round(sh));
  const dst = new PNG({ width: sw, height: sh });
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const si = ((sy + y) * src.width + (sx + x)) * 4;
      const di = (y * sw + x) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
  return PNG.sync.write(dst);
}

for (const it of items) {
  const doc = getDoc(it.w);
  const page = doc.loadPage(it.p);
  const pix = page.toPixmap(mupdf.Matrix.scale(SCALE, SCALE), mupdf.ColorSpace.DeviceRGB, false, true);
  const png = pix.asPNG();

  let box;
  if (it.manual) {
    box = it.manual;
  } else {
    const st = page.toStructuredText("preserve-images");
    const json = JSON.parse(st.asJSON());
    const imgs = json.blocks
      .filter((b) => b.type === "image")
      .map((b) => ({ x: b.bbox.x, y: b.bbox.y, w: b.bbox.w, h: b.bbox.h, area: b.bbox.w * b.bbox.h }))
      .sort((a, b) => b.area - a.area);
    box = imgs[1]; // 2nd largest = main picture (largest = full bg)
  }
  // small padding inward avoided; crop exact box scaled
  const out = cropPNG(png, box.x * SCALE, box.y * SCALE, box.w * SCALE, box.h * SCALE);
  writeFileSync(`${OUT}/${it.id}.png`, out);
  console.log(`${it.id}: crop ${Math.round(box.w)}x${Math.round(box.h)} -> ${out.length} bytes`);
}
console.log("DONE");
