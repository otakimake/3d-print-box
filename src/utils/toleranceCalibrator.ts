import * as THREE from 'three';
import { mergeBufferGeometries } from './geometryGenerator';
import { exportToSTL } from './stlExporter';

/**
 * Generates a quick 10-minute 3D print test strip with 4 graduated hinge clearances (0.20mm, 0.30mm, 0.35mm, 0.45mm)
 */
export function generateToleranceTestStrip(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  const clearances = [0.20, 0.30, 0.35, 0.45];
  const testWidth = 15;
  const baseDepth = 18;
  const baseHeight = 6;
  const knuckleDiam = 6;
  const knuckleRadius = knuckleDiam / 2;
  const pinDiam = 3;
  const hingeZ = baseHeight; // Elevated at top rim level

  // Base spine linking all 4 test segments (at Y in [-baseDepth - knuckleRadius, -knuckleRadius])
  const totalStripLength = clearances.length * (testWidth + 4);
  const spine = new THREE.BoxGeometry(totalStripLength, baseDepth, baseHeight);
  spine.translate(0, -(baseDepth / 2 + knuckleRadius), baseHeight / 2);
  geometries.push(spine);

  // For each clearance value, generate an interlocked PIP hinge test knuckle
  clearances.forEach((gap, index) => {
    const xCenter = -((clearances.length - 1) * (testWidth + 4)) / 2 + index * (testWidth + 4);

    // Lid test arm (180° flat at Y in [+knuckleRadius, +baseDepth + knuckleRadius])
    const lidArm = new THREE.BoxGeometry(testWidth - gap * 2, baseDepth, baseHeight);
    lidArm.translate(xCenter, baseDepth / 2 + knuckleRadius, baseHeight / 2);
    geometries.push(lidArm);

    // Knuckle Base segment (at top rim level)
    const baseCyl = new THREE.CylinderGeometry(knuckleRadius, knuckleRadius, testWidth * 0.45, 20);
    baseCyl.rotateZ(Math.PI / 2);
    baseCyl.translate(xCenter - testWidth * 0.25, 0, hingeZ);
    geometries.push(baseCyl);

    // Base knuckle bridge to spine
    const baseBridge = new THREE.BoxGeometry(testWidth * 0.45, knuckleRadius, baseHeight);
    baseBridge.translate(xCenter - testWidth * 0.25, -knuckleRadius / 2, baseHeight / 2);
    geometries.push(baseBridge);

    // Knuckle Lid center segment with radial & axial clearance gap (at top rim level)
    const centerCyl = new THREE.CylinderGeometry(knuckleRadius, knuckleRadius, testWidth * 0.45 - gap, 20);
    centerCyl.rotateZ(Math.PI / 2);
    centerCyl.translate(xCenter + testWidth * 0.25, 0, hingeZ);
    geometries.push(centerCyl);

    // Lid center knuckle bridge to lid arm
    const lidBridge = new THREE.BoxGeometry(testWidth * 0.45 - gap, knuckleRadius, baseHeight);
    lidBridge.translate(xCenter + testWidth * 0.25, knuckleRadius / 2, baseHeight / 2);
    geometries.push(lidBridge);

    // Cone Pin
    const cone = new THREE.ConeGeometry(pinDiam / 2 - gap / 2, (pinDiam / 2) * 1.2, 16);
    cone.rotateZ(-Math.PI / 2);
    cone.translate(xCenter - testWidth * 0.05, 0, hingeZ);
    geometries.push(cone);
  });

  return mergeBufferGeometries(geometries);
}

export function downloadToleranceTestSTL(): void {
  const geom = generateToleranceTestStrip();
  const empty = new THREE.BufferGeometry();
  exportToSTL(geom, empty, undefined, 0, 180, 'PIP-Hinge-Tolerance-Test-Strip.stl');
}
