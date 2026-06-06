import { describe, it, expect } from 'vitest';
import { parseStl, meshBounds } from './stl';

function binaryTriangle(): ArrayBuffer {
  // 80-byte header + uint32 count(1) + 50-byte triangle.
  const buf = new ArrayBuffer(84 + 50);
  const view = new DataView(buf);
  view.setUint32(80, 1, true);
  let o = 84;
  const writeVec = (x: number, y: number, z: number) => {
    view.setFloat32(o, x, true); view.setFloat32(o + 4, y, true); view.setFloat32(o + 8, z, true); o += 12;
  };
  writeVec(0, 0, 1);   // normal
  writeVec(0, 0, 0);   // v1
  writeVec(1, 0, 0);   // v2
  writeVec(0, 1, 0);   // v3
  view.setUint16(o, 0, true);
  return buf;
}

const ASCII = `solid t
 facet normal 0 0 1
  outer loop
   vertex 0 0 0
   vertex 2 0 0
   vertex 0 2 0
  endloop
 endfacet
endsolid t`;

describe('parseStl', () => {
  it('parses a binary triangle', () => {
    const m = parseStl(binaryTriangle());
    expect(m.triangleCount).toBe(1);
    expect(m.positions.length).toBe(9);
    expect(m.normals.length).toBe(9);
    expect(m.positions.slice(0, 3)).toEqual([0, 0, 0]);
    expect(m.positions.slice(3, 6)).toEqual([1, 0, 0]);
  });

  it('parses an ASCII triangle', () => {
    const m = parseStl(new TextEncoder().encode(ASCII).buffer);
    expect(m.triangleCount).toBe(1);
    expect(m.positions.length).toBe(9);
    expect(m.normals.slice(0, 3)).toEqual([0, 0, 1]);
  });

  it('computes bounds', () => {
    const b = meshBounds([0, 0, 0, 2, 0, 0, 0, 2, 0]);
    expect(b.min).toEqual([0, 0, 0]);
    expect(b.max).toEqual([2, 2, 0]);
  });
});
