import * as THREE from 'three';

/**
 * High-performance Binary STL Exporter
 */
function writeGeometriesToSTL(geometries: THREE.BufferGeometry[], filename: string): void {
  // Compute total triangles
  let totalTriangles = 0;
  for (const geom of geometries) {
    const nonIndexed = geom.index ? geom.toNonIndexed() : geom;
    totalTriangles += nonIndexed.attributes.position.count / 3;
  }

  // Allocate Binary STL buffer
  // 80 bytes header + 4 bytes triangle count + 50 bytes per triangle
  const bufferSize = 84 + totalTriangles * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);

  // Header (80 bytes)
  const headerStr = 'Binary STL exported by Print-in-Place Hinge Box Designer (AI Studio)';
  for (let i = 0; i < 80; i++) {
    dataView.setUint8(i, i < headerStr.length ? headerStr.charCodeAt(i) : 0);
  }

  // Triangle Count (uint32, little-endian)
  dataView.setUint32(80, totalTriangles, true);

  let offset = 84;
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  for (const geom of geometries) {
    const nonIndexed = geom.index ? geom.toNonIndexed() : geom;
    const pos = nonIndexed.attributes.position;
    const triCount = pos.count / 3;

    for (let i = 0; i < triCount; i++) {
      vA.fromBufferAttribute(pos, i * 3);
      vB.fromBufferAttribute(pos, i * 3 + 1);
      vC.fromBufferAttribute(pos, i * 3 + 2);

      // Compute face normal
      cb.subVectors(vC, vB);
      ab.subVectors(vA, vB);
      normal.crossVectors(cb, ab).normalize();

      // Normal (3 x float32)
      dataView.setFloat32(offset, normal.x, true);
      dataView.setFloat32(offset + 4, normal.y, true);
      dataView.setFloat32(offset + 8, normal.z, true);

      // Vertex 1 (3 x float32)
      dataView.setFloat32(offset + 12, vA.x, true);
      dataView.setFloat32(offset + 16, vA.y, true);
      dataView.setFloat32(offset + 20, vA.z, true);

      // Vertex 2 (3 x float32)
      dataView.setFloat32(offset + 24, vB.x, true);
      dataView.setFloat32(offset + 28, vB.y, true);
      dataView.setFloat32(offset + 32, vB.z, true);

      // Vertex 3 (3 x float32)
      dataView.setFloat32(offset + 36, vC.x, true);
      dataView.setFloat32(offset + 40, vC.y, true);
      dataView.setFloat32(offset + 44, vC.z, true);

      // Attribute byte count (uint16 = 0)
      dataView.setUint16(offset + 48, 0, true);

      offset += 50;
    }
  }

  // Trigger browser download
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * High-performance Binary STL Exporter for unified Print-in-Place assembly
 */
export function exportToSTL(
  baseGeom: THREE.BufferGeometry,
  lidGeom: THREE.BufferGeometry,
  dividersGeom: THREE.BufferGeometry | undefined,
  hingeAxisZ: number,
  hingeAngleDeg: number = 180,
  filename: string = 'print-in-place-hinge-box.stl'
): void {
  const finalMeshGeometries: THREE.BufferGeometry[] = [];

  // 1. Base Geometry (at origin)
  finalMeshGeometries.push(baseGeom.clone());

  // 2. Dividers (if any)
  if (dividersGeom) {
    finalMeshGeometries.push(dividersGeom.clone());
  }

  // 3. Lid Geometry positioned according to hinge angle
  const lidClone = lidGeom.clone();
  if (hingeAngleDeg !== 180) {
    const rad = ((180 - hingeAngleDeg) * Math.PI) / 180;
    lidClone.translate(0, 0, -hingeAxisZ);
    lidClone.rotateX(rad);
    lidClone.translate(0, 0, hingeAxisZ);
  }
  finalMeshGeometries.push(lidClone);

  writeGeometriesToSTL(finalMeshGeometries, filename);
}

/**
 * Export Base and Lid as two independent STL files
 */
export function exportSeparateSTLs(
  baseGeom: THREE.BufferGeometry,
  lidGeom: THREE.BufferGeometry,
  dividersGeom: THREE.BufferGeometry | undefined,
  baseFilename: string = 'Base_Box.stl',
  lidFilename: string = 'Lid_Box.stl'
): void {
  const baseGeoms = [baseGeom.clone()];
  if (dividersGeom) baseGeoms.push(dividersGeom.clone());
  writeGeometriesToSTL(baseGeoms, baseFilename);

  // Small delay to allow the first download to start without collision
  setTimeout(() => {
    writeGeometriesToSTL([lidGeom.clone()], lidFilename);
  }, 250);
}
