import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createDisplacementMapData, createUVMapData, createEdgeMapData, createNormalMapData } from '../src/geometry/normal-map.js';
import type { SurfaceShape } from '../src/core/types.js';

type MapType = 'displacement' | 'uv' | 'edge' | 'normal';

function createMapData(
  type: MapType,
  width: number,
  height: number,
  radius: number,
  bevel: number,
  shape: SurfaceShape,
  invertNormals: boolean,
): { data: Uint8Array; width: number; height: number } {
  switch (type) {
    case 'displacement':
      return createDisplacementMapData(width, height, radius, bevel, shape, false);
    case 'uv':
      return createUVMapData(width, height, radius);
    case 'edge':
      return createEdgeMapData(width, height, radius, bevel);
    case 'normal':
      return createNormalMapData(width, height, radius, bevel, shape, invertNormals);
  }
}

// PNG encoder (minimal implementation)
function encodePNG(width: number, height: number, rgba: Uint8Array): Buffer {
  const crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc32Table[i] = c;
  }

  function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc = crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ 0xffffffff;
  }

  function adler32(data: Uint8Array): number {
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % 65521;
      b = (b + a) % 65521;
    }
    return (b << 16) | a;
  }

  function chunk(type: string, data: Uint8Array): Uint8Array {
    const typeBytes = new TextEncoder().encode(type);
    const result = new Uint8Array(4 + 4 + data.length + 4);
    const view = new DataView(result.buffer);
    view.setUint32(0, data.length);
    result.set(typeBytes, 4);
    result.set(data, 8);
    const crcData = new Uint8Array(4 + data.length);
    crcData.set(typeBytes);
    crcData.set(data, 4);
    view.setUint32(8 + data.length, crc32(crcData));
    return result;
  }

  // IHDR
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - raw image data with filter bytes
  const rawData = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter byte
    for (let x = 0; x < width * 4; x++) {
      rawData[y * (1 + width * 4) + 1 + x] = rgba[y * width * 4 + x];
    }
  }

  // Simple zlib compression (store only, no actual compression)
  const blocks: Uint8Array[] = [];
  const blockSize = 65535;
  for (let i = 0; i < rawData.length; i += blockSize) {
    const end = Math.min(i + blockSize, rawData.length);
    const len = end - i;
    const block = new Uint8Array(5 + len);
    block[0] = end >= rawData.length ? 1 : 0;
    block[1] = len & 0xff;
    block[2] = (len >> 8) & 0xff;
    block[3] = ~len & 0xff;
    block[4] = (~len >> 8) & 0xff;
    block.set(rawData.subarray(i, end), 5);
    blocks.push(block);
  }

  const totalLen = blocks.reduce((sum, b) => sum + b.length, 0);
  const compressed = new Uint8Array(2 + totalLen + 4);
  compressed[0] = 0x78; // zlib header
  compressed[1] = 0x01;
  let offset = 2;
  for (const block of blocks) {
    compressed.set(block, offset);
    offset += block.length;
  }
  const adler = adler32(rawData);
  compressed[offset] = (adler >> 24) & 0xff;
  compressed[offset + 1] = (adler >> 16) & 0xff;
  compressed[offset + 2] = (adler >> 8) & 0xff;
  compressed[offset + 3] = adler & 0xff;

  // Assemble PNG
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', new Uint8Array(0));

  const png = new Uint8Array(signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length);
  let pos = 0;
  png.set(signature, pos); pos += signature.length;
  png.set(ihdrChunk, pos); pos += ihdrChunk.length;
  png.set(idatChunk, pos); pos += idatChunk.length;
  png.set(iendChunk, pos);

  return Buffer.from(png);
}

// Main
const shapes: SurfaceShape[] = ['circle', 'squircle', 'concave', 'lip', 'dome', 'wave', 'flat', 'ramp'];
const mapTypes: MapType[] = ['normal', 'displacement', 'uv', 'edge'];
const outputDir = '/tmp/maps';
const width = 256;
const height = 256;
const radius = 32;
const bevel = 64;
const invertNormals = false;

mkdirSync(outputDir, { recursive: true });

let count = 0;
for (const shape of shapes) {
  for (const mapType of mapTypes) {
    const result = createMapData(mapType, width, height, radius, bevel, shape, invertNormals);
    const png = encodePNG(result.width, result.height, result.data);
    const filename = join(outputDir, `${shape}-${mapType}.png`);
    writeFileSync(filename, png);
    console.log(`Saved: ${filename}`);
    count++;
  }
}

console.log(`\nGenerated ${count} maps (${mapTypes.length} types × ${shapes.length} shapes) in ${outputDir}`);
