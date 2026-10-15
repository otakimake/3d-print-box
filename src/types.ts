export interface BoxDimensions {
  length: number; // X axis (width of box) in mm
  width: number;  // Y axis (depth of box) in mm
  baseHeight: number; // Z height of bottom base in mm
  lidHeight: number;  // Z height of top lid in mm
  wallThickness: number; // shell thickness in mm (e.g. 2.0mm)
  floorThickness: number; // base & lid floor thickness in mm (e.g. 2.0mm)
  cornerRadius: number; // outer corner fillet radius in mm (e.g. 3.0mm)
}

export interface HingeParameters {
  knuckleDiameter: number; // outer diameter of hinge cylinder (e.g. 7.5mm)
  pinDiameter: number;     // inner pin diameter (e.g. 3.8mm for 1.54mm collar wall)
  clearanceRadial: number; // clearance between pin & socket in mm (e.g. 0.30mm)
  clearanceAxial: number;  // clearance between base and lid knuckle faces in mm (e.g. 0.30mm)
  knuckleCount: number;    // number of knuckles along hinge (e.g. 3 = 2 outer lid + 1 center base)
  coneAngle: number;       // cone taper angle in degrees (e.g. 45 degrees for zero-support printing)
  filletTransition: boolean; // 45° chamfer / smooth transition to box back wall
  bodyClearance: number;   // standoff clearance gap between hinge and main body in mm (e.g. 1.2mm)
  pinLength?: number;      // total pin extension in mm
  cylindricalLength?: number; // straight cylindrical pilot engagement length (e.g. 5.0mm from user CAD sketch)
  centerKnuckleLength?: number; // center knuckle length in mm (e.g. 25.0mm from user CAD sketch)
  outerKnuckleLength?: number; // outer knuckle length in mm (e.g. 10.0mm from user CAD sketch)
}

export interface LatchParameters {
  type: 'cantilever';
  width: number;          // width of latch tab (e.g. 16mm)
  protrusion: number;     // snap bump height (e.g. 0.8mm)
  tolerance: number;      // latch catch clearance (e.g. 0.25mm)
  lipHeight: number;      // rim lip overlap height (e.g. 2.5mm)
  lipTolerance: number;   // rim perimeter slip clearance (e.g. 0.2mm)
  magnetDiameter?: number; // optional magnet diameter
}

export interface DividerParameters {
  enabled: boolean;
  rows: number;           // along Y axis (1 to 6)
  cols: number;           // along X axis (1 to 6)
  thickness: number;      // divider wall thickness (e.g. 1.2mm)
  heightPercent: number;  // divider height as % of base cavity (10% to 100%)
  notchType: 'none' | 'finger-scoop' | 'half-height';
}

export interface DebossParameters {
  enabled: boolean;
  type: 'image' | 'preset' | 'text';
  depth: number;          // deboss depth in mm (user specified 0.1mm default)
  invert: boolean;        // true = deboss (sunken), false = emboss (raised)
  scale: number;          // % scale relative to lid area (10% to 90%)
  offsetX: number;        // mm offset from lid center
  offsetY: number;        // mm offset from lid center
  rotation: number;       // degrees 0-360
  imageDataUrl?: string;  // custom uploaded image
  presetId?: string;      // preset icon ID
  text?: string;          // custom text
  fontFamily?: string;
  resolution: number;     // grid resolution (e.g. 64x64 or 96x96 for deboss geometry)
}

export interface PrintBedConfig {
  name: string;
  type: 'bambu-x1c' | 'bambu-a1-mini' | 'prusa-mk4' | 'ender-3' | 'custom';
  width: number;  // X mm
  depth: number;  // Y mm
  height: number; // Z mm
  textureType: 'textured-pei' | 'smooth-pei' | 'engineering' | 'carbon-plate';
}

export interface MaterialColor {
  id: string;
  name: string;
  hex: string;
  lidHex?: string; // Distinct lid color for dual-body CAD visualization
  roughness: number;
  metalness: number;
  opacity: number;
  filamentType: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'PLA-CF';
}

export interface ModelConfig {
  dimensions: BoxDimensions;
  hinge: HingeParameters;
  latch: LatchParameters;
  dividers: DividerParameters;
  deboss: DebossParameters;
  hingeAngle: number; // 0 (closed) to 180 (flat on print bed)
  material: MaterialColor;
  showBed: boolean;
  bedConfig: PrintBedConfig;
  autoDiagonal: boolean;
  showCrossSection: boolean;
  crossSectionAxis: 'x' | 'y' | 'z';
  crossSectionPos: number; // 0 to 1
  renderMode: 'solid' | 'wireframe' | 'layers' | 'clearance-inspect';
  layerHeight: number; // mm (e.g. 0.2mm for layer visualization)
}

export interface SlicerStats {
  volumeMm3: number;
  weightGrams: number;
  printTimeMinutes: number;
  bedCoveragePercent: number;
  fitsOnBed: boolean;
  filamentLengthMeters: number;
}
