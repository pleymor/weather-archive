// Generates the PWA icons (no external image deps): a blue sky background with a
// sun and a cloud, drawn pixel-by-pixel and encoded as valid PNG (RGB, with CRC32).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

// --- CRC32 (PNG-standard) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function encodePNG(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor RGB
  // rows prefixed with filter byte 0
  const stride = size * 3
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    pixels.subarray(y * stride, (y + 1) * stride).copy(raw, y * (stride + 1) + 1)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

function draw(size) {
  const px = Buffer.alloc(size * size * 3)
  const set = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 3
    px[i] = r; px[i + 1] = g; px[i + 2] = b
  }
  // Sky gradient: top #1e50a0 -> bottom #4a8fe0
  for (let y = 0; y < size; y++) {
    const t = y / size
    const r = Math.round(0x1e + (0x4a - 0x1e) * t)
    const g = Math.round(0x50 + (0x8f - 0x50) * t)
    const b = Math.round(0xa0 + (0xe0 - 0xa0) * t)
    for (let x = 0; x < size; x++) set(x, y, r, g, b)
  }
  // Sun (yellow) upper-right
  const sunX = size * 0.66, sunY = size * 0.34, sunR = size * 0.16
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - sunX, y - sunY)
      if (d <= sunR) set(x, y, 0xff, 0xd1, 0x3b)
    }
  // Cloud (white) lower-left: union of circles + base rectangle
  const cloud = [
    [size * 0.36, size * 0.62, size * 0.13],
    [size * 0.52, size * 0.6, size * 0.16],
    [size * 0.66, size * 0.64, size * 0.12],
  ]
  const baseTop = size * 0.64, baseBot = size * 0.72, baseL = size * 0.3, baseR = size * 0.72
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let inCloud = x >= baseL && x <= baseR && y >= baseTop && y <= baseBot
      for (const [cx, cy, cr] of cloud) if (Math.hypot(x - cx, y - cy) <= cr) inCloud = true
      if (inCloud) set(x, y, 0xf5, 0xf7, 0xfa)
    }
  return px
}

mkdirSync('public', { recursive: true })
for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  writeFileSync(`public/${name}`, encodePNG(size, draw(size)))
  console.log(`wrote public/${name}`)
}
