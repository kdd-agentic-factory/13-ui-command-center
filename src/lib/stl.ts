/**
 * Minimal STL parser (binary + ASCII) → flat position/normal arrays.
 *
 * Used to load real CAD parts (e.g. CHASIS / BASCULANTE exported from SolidWorks
 * as STL) into the Babylon PartViewer3D without pulling in @babylonjs/loaders.
 *
 * NOTE: SolidWorks ``.SLDPRT`` is a proprietary binary format with no reliable
 * headless converter — export it to STL (SolidWorks "Save As → STL", or FreeCAD)
 * and load the resulting mesh here.
 */

export interface StlMesh {
  positions: number[];
  normals: number[];
  triangleCount: number;
}

function isBinaryStl(buffer: ArrayBuffer): boolean {
  // Binary STL: 80-byte header + uint32 count + count*50 bytes.
  if (buffer.byteLength < 84) return false;
  const count = new DataView(buffer).getUint32(80, true);
  return buffer.byteLength === 84 + count * 50;
}

function parseBinary(buffer: ArrayBuffer): StlMesh {
  const view = new DataView(buffer);
  const count = view.getUint32(80, true);
  const positions: number[] = [];
  const normals: number[] = [];
  let offset = 84;
  for (let i = 0; i < count; i++) {
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);
    offset += 12;
    for (let v = 0; v < 3; v++) {
      positions.push(
        view.getFloat32(offset, true),
        view.getFloat32(offset + 4, true),
        view.getFloat32(offset + 8, true),
      );
      normals.push(nx, ny, nz);
      offset += 12;
    }
    offset += 2; // attribute byte count
  }
  return { positions, normals, triangleCount: count };
}

function parseAscii(text: string): StlMesh {
  const positions: number[] = [];
  const normals: number[] = [];
  let current: [number, number, number] = [0, 0, 1];
  let triangleCount = 0;
  const numRe = /-?\d+\.?\d*(?:[eE][-+]?\d+)?/g;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('facet normal')) {
      const m = line.match(numRe);
      if (m && m.length >= 3) current = [parseFloat(m[0]), parseFloat(m[1]), parseFloat(m[2])];
    } else if (line.startsWith('vertex')) {
      const m = line.match(numRe);
      if (m && m.length >= 3) {
        positions.push(parseFloat(m[0]), parseFloat(m[1]), parseFloat(m[2]));
        normals.push(current[0], current[1], current[2]);
      }
    } else if (line.startsWith('endfacet')) {
      triangleCount++;
    }
  }
  return { positions, normals, triangleCount };
}

export function parseStl(buffer: ArrayBuffer): StlMesh {
  if (isBinaryStl(buffer)) return parseBinary(buffer);
  const text = new TextDecoder().decode(buffer);
  if (text.includes('facet')) return parseAscii(text);
  // Fall back to binary even if the size heuristic was off.
  return parseBinary(buffer);
}

/** Axis-aligned bounding box of a flat positions array (for auto-centering/scaling). */
export function meshBounds(positions: number[]) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const v = positions[i + a];
      if (v < min[a]) min[a] = v;
      if (v > max[a]) max[a] = v;
    }
  }
  return { min, max };
}
