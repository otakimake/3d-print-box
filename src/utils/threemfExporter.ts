import * as THREE from 'three';
import JSZip from 'jszip';

interface MeshData {
  vertices: { x: number; y: number; z: number }[];
  triangles: { v1: number; v2: number; v3: number }[];
}

function processGeometriesToMesh(geometries: THREE.BufferGeometry[]): MeshData {
  const vertexMap = new Map<string, number>();
  const vertices: { x: number; y: number; z: number }[] = [];
  const triangles: { v1: number; v2: number; v3: number }[] = [];

  for (const geom of geometries) {
    const nonIndexed = geom.index ? geom.toNonIndexed() : geom;
    const pos = nonIndexed.attributes.position;
    const count = pos.count;
    const triCount = count / 3;

    for (let t = 0; t < triCount; t++) {
      const triIndices: number[] = [];
      for (let k = 0; k < 3; k++) {
        const idx = t * 3 + k;
        const x = parseFloat(pos.getX(idx).toFixed(4));
        const y = parseFloat(pos.getY(idx).toFixed(4));
        const z = parseFloat(pos.getZ(idx).toFixed(4));
        const key = `${x}_${y}_${z}`;

        let vertIdx = vertexMap.get(key);
        if (vertIdx === undefined) {
          vertIdx = vertices.length;
          vertexMap.set(key, vertIdx);
          vertices.push({ x, y, z });
        }
        triIndices.push(vertIdx);
      }

      // Avoid degenerate zero-area triangles
      if (
        triIndices[0] !== triIndices[1] &&
        triIndices[1] !== triIndices[2] &&
        triIndices[0] !== triIndices[2]
      ) {
        triangles.push({
          v1: triIndices[0],
          v2: triIndices[1],
          v3: triIndices[2],
        });
      }
    }
  }

  return { vertices, triangles };
}

/**
 * 3MF Exporter compatible with Bambu Studio, OrcaSlicer, and PrusaSlicer
 */
export async function exportTo3MF(
  baseGeom: THREE.BufferGeometry,
  lidGeom: THREE.BufferGeometry,
  dividersGeom: THREE.BufferGeometry | undefined,
  hingeAxisZ: number,
  hingeAngleDeg: number = 180,
  filename: string = 'bambu-pip-hinge-box.3mf'
): Promise<void> {
  const zip = new JSZip();

  // Base geometries
  const baseGeometries: THREE.BufferGeometry[] = [baseGeom.clone()];
  if (dividersGeom) baseGeometries.push(dividersGeom.clone());

  // Lid geometry positioned according to print angle
  const lidClone = lidGeom.clone();
  if (hingeAngleDeg !== 180) {
    const rad = ((180 - hingeAngleDeg) * Math.PI) / 180;
    lidClone.translate(0, 0, -hingeAxisZ);
    lidClone.rotateX(rad);
    lidClone.translate(0, 0, hingeAxisZ);
  }
  const lidGeometries: THREE.BufferGeometry[] = [lidClone];

  const baseMesh = processGeometriesToMesh(baseGeometries);
  const lidMesh = processGeometriesToMesh(lidGeometries);

  function buildMeshXml(mesh: MeshData): string {
    let xml = '        <vertices>\n';
    for (let i = 0; i < mesh.vertices.length; i++) {
      const v = mesh.vertices[i];
      xml += `          <vertex x="${v.x}" y="${v.y}" z="${v.z}" />\n`;
    }
    xml += '        </vertices>\n        <triangles>\n';
    for (let i = 0; i < mesh.triangles.length; i++) {
      const t = mesh.triangles[i];
      xml += `          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />\n`;
    }
    xml += '        </triangles>\n';
    return xml;
  }

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021">
  <metadata name="Application">Print-in-Place Hinge Box Designer</metadata>
  <metadata name="Title">Parametric Print-In-Place Hinge Box</metadata>
  <metadata name="Designer">AI Studio</metadata>
  <metadata name="CreationDate">${new Date().toISOString()}</metadata>
  <metadata name="BambuStudio:ProfileName">0.20mm Standard @BBL X1C</metadata>
  <resources>
    <object id="1" type="model" name="Base_Box">
      <mesh>
${buildMeshXml(baseMesh)}      </mesh>
    </object>
    <object id="2" type="model" name="Lid_Box">
      <mesh>
${buildMeshXml(lidMesh)}      </mesh>
    </object>
    <object id="3" type="model" name="Hinge_Box_Assembly">
      <components>
        <component objectid="1" />
        <component objectid="2" />
      </components>
    </object>
  </resources>
  <build>
    <item objectid="3" />
  </build>
</model>`;

  // 3. Add required 3MF package structure
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`
  );

  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`
  );

  zip.folder('3D')?.file('3dmodel.model', modelXml);

  // Bambu Studio specific slicing recommendations for print-in-place
  zip.folder('Metadata')?.file(
    'model_settings.config',
    `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="3">
    <metadata key="name" value="Hinge_Box_Assembly"/>
  </object>
  <object id="1">
    <metadata key="name" value="Base_Box"/>
    <metadata key="layer_height" value="0.20"/>
    <metadata key="wall_loops" value="4"/>
    <metadata key="top_shell_layers" value="4"/>
    <metadata key="bottom_shell_layers" value="4"/>
    <metadata key="sparse_infill_density" value="15%"/>
    <metadata key="sparse_infill_pattern" value="gyroid"/>
    <metadata key="enable_support" value="0"/>
    <metadata key="seam_position" value="back"/>
  </object>
  <object id="2">
    <metadata key="name" value="Lid_Box"/>
    <metadata key="layer_height" value="0.20"/>
    <metadata key="wall_loops" value="4"/>
    <metadata key="top_shell_layers" value="4"/>
    <metadata key="bottom_shell_layers" value="4"/>
    <metadata key="sparse_infill_density" value="15%"/>
    <metadata key="sparse_infill_pattern" value="gyroid"/>
    <metadata key="enable_support" value="0"/>
    <metadata key="seam_position" value="back"/>
  </object>
</config>`
  );

  // Generate zip file and download
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
