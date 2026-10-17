// Jednorazovy generator ikon (bez zavislosti) - vytvori public/icon-192.png a icon-512.png
const zlib = require('zlib');
const fs = require('fs');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size) {
  const px = Buffer.alloc(size * size * 4);
  const c = (size - 1) / 2;
  const put = (x, y, r, g, b, a) => {
    const i = (y * size + x) * 4;
    const na = a / 255, oa = px[i + 3] / 255, out = na + oa * (1 - na);
    if (out <= 0) return;
    px[i]     = (r * na + px[i]     * oa * (1 - na)) / out;
    px[i + 1] = (g * na + px[i + 1] * oa * (1 - na)) / out;
    px[i + 2] = (b * na + px[i + 2] * oa * (1 - na)) / out;
    px[i + 3] = out * 255;
  };
  const rOuter = size * 0.47, rIn = size * 0.34, rIn2 = size * 0.40;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x - c, y - c);
    const aa = (edge) => Math.max(0, Math.min(1, edge));
    if (d < rOuter) put(x, y, 11, 13, 16, 255 * aa(rOuter - d));              // tmavy podklad
    if (d < rIn2 && d > rIn) put(x, y, 255, 92, 0, 255 * aa(Math.min(rIn2 - d, d - rIn))); // oranzovy prstenec
  }
  // bila rucicka ukazatele (sipka vzhuru)
  const w = size * 0.055;
  for (let y = Math.round(c - rIn * 0.82); y < Math.round(c + rIn * 0.25); y++)
    for (let x = Math.round(c - w); x <= Math.round(c + w); x++) put(x, y, 245, 246, 248, 255);
  for (let k = 0; k < Math.round(rIn * 0.3); k++)
    for (let x = Math.round(c - k * 0.9); x <= Math.round(c + k * 0.9); x++)
      put(x, Math.round(c - rIn * 0.82) + k, 245, 246, 248, 255);

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}
for (const s of [192, 512]) fs.writeFileSync(`public/icon-${s}.png`, png(s));
console.log('ikony hotovy');
