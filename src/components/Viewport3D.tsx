import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModelConfig, SlicerStats } from '../types';
import { HeightmapResult } from '../utils/imageProcessor';
import { generateBoxGeometry, GeneratedModel } from '../utils/geometryGenerator';
import { Eye, Layers, Scissors, RotateCcw, Maximize2, Play, Pause, Compass, Grid, Sparkles, Lock, Check } from 'lucide-react';

interface Viewport3DProps {
  config: ModelConfig;
  heightmap: HeightmapResult | null;
  onUpdateStats: (stats: SlicerStats) => void;
  onChangeHingeAngle: (angle: number) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  config,
  heightmap,
  onUpdateStats,
  onChangeHingeAngle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const baseMeshRef = useRef<THREE.Mesh | null>(null);
  const lidMeshRef = useRef<THREE.Mesh | null>(null);
  const lidGroupRef = useRef<THREE.Group | null>(null);
  const dividersMeshRef = useRef<THREE.Mesh | null>(null);
  const bedGroupRef = useRef<THREE.Group | null>(null);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);

  const [isPlayingAnim, setIsPlayingAnim] = useState(false);
  const animDirectionRef = useRef<1 | -1>(1);

  // Generate Geometry
  const modelData = useMemo(() => {
    return generateBoxGeometry(config, heightmap);
  }, [config.dimensions, config.hinge, config.latch, config.dividers, config.deboss, heightmap]);

  // Compute Volume & Slicer Stats
  useEffect(() => {
    if (!modelData) return;
    
    // Estimate volume from bounding box and wall thickness
    const { length, width, baseHeight, lidHeight, wallThickness, floorThickness } = config.dimensions;
    const outerBaseVol = length * width * baseHeight;
    const innerBaseVol = Math.max(0, (length - wallThickness * 2) * (width - wallThickness * 2) * (baseHeight - floorThickness));
    const baseSolidVol = outerBaseVol - innerBaseVol;

    const outerLidVol = length * width * lidHeight;
    const innerLidVol = Math.max(0, (length - wallThickness * 2) * (width - wallThickness * 2) * (lidHeight - floorThickness));
    const lidSolidVol = outerLidVol - innerLidVol;

    // Hinge & Latch volume approx
    const hingeVol = Math.PI * Math.pow(config.hinge.knuckleDiameter / 2, 2) * (length * 0.8);
    const totalVolMm3 = Math.max(100, Math.round(baseSolidVol + lidSolidVol + hingeVol));

    // Density of PLA is ~1.24 g/cm3 (0.00124 g/mm3). Infill 15% gyroid for hollow walls
    const weightGrams = parseFloat(((totalVolMm3 * 0.00124) * 0.95).toFixed(1));
    const filamentMeters = parseFloat((weightGrams / (Math.PI * Math.pow(1.75 / 2, 2) * 0.00124) / 1000).toFixed(2));
    
    // Print time estimate: ~15mm3/s volumetric speed + layer change overhead
    const printTimeMins = Math.max(12, Math.round((totalVolMm3 / (12 * 60)) + (Math.max(baseHeight, lidHeight) / config.layerHeight) * 0.1));

    // Bed coverage
    const flatW = length;
    const bodyClearance = config.hinge.bodyClearance ?? 1.2;
    const flatD = (width + config.hinge.knuckleDiameter / 2 + bodyClearance) * 2;
    const bedArea = config.bedConfig.width * config.bedConfig.depth;
    const coveragePercent = Math.min(100, parseFloat(((flatW * flatD / bedArea) * 100).toFixed(1)));
    
    const fitsOnBed = config.autoDiagonal
      ? Math.sqrt(flatW * flatW + flatD * flatD) <= Math.sqrt(Math.pow(config.bedConfig.width, 2) + Math.pow(config.bedConfig.depth, 2)) - 10
      : flatW <= config.bedConfig.width - 10 && flatD <= config.bedConfig.depth - 10;

    onUpdateStats({
      volumeMm3: totalVolMm3,
      weightGrams,
      printTimeMinutes: printTimeMins,
      bedCoveragePercent: coveragePercent,
      fitsOnBed,
      filamentLengthMeters: filamentMeters,
    });
  }, [modelData, config.bedConfig, config.autoDiagonal, config.layerHeight]);

  // Initialize Three.js
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#E2E8F0');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    camera.up.set(0, 0, 1);
    camera.position.set(120, -180, 140);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 600;
    controls.minDistance = 20;
    controls.target.set(0, 0, 15);
    controlsRef.current = controls;

    // Lighting setup (Z-up coordinate system)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(100, -120, 200);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xedf2f7, 0.5);
    fillLight.position.set(-120, 100, 120);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 150, -80);
    scene.add(rimLight);

    // Create Groups
    const lidGroup = new THREE.Group();
    scene.add(lidGroup);
    lidGroupRef.current = lidGroup;

    // Clipping plane
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1000);
    clipPlaneRef.current = clipPlane;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update Bed Grid
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (bedGroupRef.current) {
      scene.remove(bedGroupRef.current);
      bedGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }

    if (!config.showBed) return;

    const bedGroup = new THREE.Group();
    const { width: bedW, depth: bedD, type: bedType } = config.bedConfig;

    // Textured Bed Plate Mesh in XY plane (Z = -0.1)
    const plateGeom = new THREE.PlaneGeometry(bedW, bedD);
    const plateMat = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      roughness: 0.9,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const plateMesh = new THREE.Mesh(plateGeom, plateMat);
    plateMesh.position.set(0, 0, -0.1);
    plateMesh.receiveShadow = true;
    bedGroup.add(plateMesh);

    // Bed Grid Lines in XY plane
    const grid = new THREE.GridHelper(Math.max(bedW, bedD), Math.round(Math.max(bedW, bedD) / 10), 0x94A3B8, 0xCBD5E1);
    grid.rotateX(Math.PI / 2);
    grid.position.set(0, 0, 0.05);
    bedGroup.add(grid);

    // Bed Border Frame in XY plane (Z = 0.1)
    const borderPoints = [
      new THREE.Vector3(-bedW / 2, -bedD / 2, 0.1),
      new THREE.Vector3(bedW / 2, -bedD / 2, 0.1),
      new THREE.Vector3(bedW / 2, bedD / 2, 0.1),
      new THREE.Vector3(-bedW / 2, bedD / 2, 0.1),
      new THREE.Vector3(-bedW / 2, -bedD / 2, 0.1),
    ];
    const borderGeom = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x6366F1, linewidth: 2 });
    const borderLine = new THREE.Line(borderGeom, borderMat);
    bedGroup.add(borderLine);

    // Bed Notch / Text Indicator
    scene.add(bedGroup);
    bedGroupRef.current = bedGroup;
  }, [config.showBed, config.bedConfig]);

  // Update Box Geometry & Materials
  useEffect(() => {
    const scene = sceneRef.current;
    const lidGroup = lidGroupRef.current;
    if (!scene || !lidGroup || !modelData) return;

    // Remove old meshes
    if (baseMeshRef.current) {
      scene.remove(baseMeshRef.current);
      baseMeshRef.current.geometry.dispose();
    }
    if (dividersMeshRef.current) {
      scene.remove(dividersMeshRef.current);
      dividersMeshRef.current.geometry.dispose();
    }
    if (lidMeshRef.current) {
      lidGroup.remove(lidMeshRef.current);
      lidMeshRef.current.geometry.dispose();
    }

    // Configure Clipping
    let clippingPlanes: THREE.Plane[] = [];
    if (config.showCrossSection && clipPlaneRef.current) {
      const normal =
        config.crossSectionAxis === 'x'
          ? new THREE.Vector3(1, 0, 0)
          : config.crossSectionAxis === 'y'
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(0, 0, 1);
      
      const maxDim = Math.max(config.dimensions.length, config.dimensions.width * 2, config.dimensions.baseHeight);
      const constant = (config.crossSectionPos - 0.5) * maxDim;
      clipPlaneRef.current.set(normal, -constant);
      clippingPlanes = [clipPlaneRef.current];
    }

    // Material definition
    const baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.material.hex),
      roughness: config.material.roughness,
      metalness: config.material.metalness,
      transparent: config.material.opacity < 1.0,
      opacity: config.material.opacity,
      wireframe: config.renderMode === 'wireframe',
      clippingPlanes,
      clipShadows: true,
      side: THREE.DoubleSide,
    });

    const lidMat = baseMat.clone();
    if (config.material.lidHex) {
      lidMat.color = new THREE.Color(config.material.lidHex);
    }

    // 1. Base Mesh
    const baseMesh = new THREE.Mesh(modelData.baseGeometry, baseMat);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    baseMeshRef.current = baseMesh;

    // 2. Dividers Mesh
    if (modelData.dividersGeometry) {
      const divMat = baseMat.clone();
      const divMesh = new THREE.Mesh(modelData.dividersGeometry, divMat);
      divMesh.castShadow = true;
      divMesh.receiveShadow = true;
      scene.add(divMesh);
      dividersMeshRef.current = divMesh;
    }

    // 3. Lid Mesh attached to Lid Pivot Group
    // Lid Pivot Group is located at (0, hingeY, hingeZ)
    const hingeY = modelData.hingeAxisY;
    const hingeZ = modelData.hingeAxisZ;

    lidGroup.position.set(0, hingeY, hingeZ);

    const lidMesh = new THREE.Mesh(modelData.lidGeometry, lidMat);
    // Offset lid mesh so its local pivot aligns with hinge axis
    lidMesh.position.set(0, -hingeY, -hingeZ);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidGroup.add(lidMesh);
    lidMeshRef.current = lidMesh;

    // Diagonal bed orientation if enabled
    if (config.autoDiagonal) {
      baseMesh.rotation.z = Math.PI / 4;
      if (dividersMeshRef.current) dividersMeshRef.current.rotation.z = Math.PI / 4;
      lidGroup.rotation.z = Math.PI / 4;
    } else {
      baseMesh.rotation.z = 0;
      if (dividersMeshRef.current) dividersMeshRef.current.rotation.z = 0;
      lidGroup.rotation.z = 0;
    }
  }, [modelData, config.material, config.renderMode, config.showCrossSection, config.crossSectionAxis, config.crossSectionPos, config.autoDiagonal]);

  // Update Hinge Angle Rotation
  useEffect(() => {
    if (!lidGroupRef.current) return;
    // When hingeAngle is 180°: Lid is flat on print bed (rotation around X = 0)
    // When hingeAngle is 0°: Lid is closed over base (rotation around X = PI)
    const angleDeltaRad = ((180 - config.hingeAngle) * Math.PI) / 180;
    lidGroupRef.current.rotation.x = angleDeltaRad;
  }, [config.hingeAngle]);

  // Play subtle tactile snap click sound when latch engages snugly
  const playSnapSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio playback safety catch
    }
  };

  // Play snap sound when transitioning into closed state (0°)
  const prevAngleRef = useRef(config.hingeAngle);
  useEffect(() => {
    if (prevAngleRef.current > 0 && config.hingeAngle === 0) {
      playSnapSound();
    }
    prevAngleRef.current = config.hingeAngle;
  }, [config.hingeAngle]);

  // Animation Loop for Hinge Folding
  // When closing, lid closes smoothly, locks into base catch, and STAYS CLOSED!
  useEffect(() => {
    if (!isPlayingAnim) return;

    const interval = setInterval(() => {
      onChangeHingeAngle((prev) => {
        let next = prev + animDirectionRef.current * 2.5;
        if (next >= 180) {
          next = 180;
          setIsPlayingAnim(false); // Stays open flat at 180°
          animDirectionRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          setIsPlayingAnim(false); // Closes and STAYS CLOSED at 0°!
          animDirectionRef.current = 1;
        }
        return next;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [isPlayingAnim, onChangeHingeAngle]);

  // Camera preset view helpers
  const setCameraView = (view: 'iso' | 'top' | 'front' | 'hinge' | 'closed') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    const maxDim = Math.max(config.dimensions.length, config.dimensions.width * 2);

    if (view === 'iso') {
      cam.up.set(0, 0, 1);
      cam.position.set(maxDim * 1.3, -maxDim * 1.5, maxDim * 1.4);
      ctrl.target.set(0, 0, 15);
    } else if (view === 'top') {
      cam.up.set(0, 1, 0);
      cam.position.set(0, 0, maxDim * 2.8);
      ctrl.target.set(0, 0, 0);
    } else if (view === 'front') {
      const bodyClearance = config.hinge.bodyClearance ?? 1.4;
      const hingeOffset = config.hinge.knuckleDiameter / 2 + bodyClearance;
      const frontY = -(config.dimensions.width + hingeOffset);
      cam.up.set(0, 0, 1);
      cam.position.set(0, frontY - 45, config.dimensions.baseHeight + 15);
      ctrl.target.set(0, frontY, config.dimensions.baseHeight - 2);
    } else if (view === 'hinge') {
      cam.up.set(0, 0, 1);
      cam.position.set(0, maxDim * 1.2, modelData.hingeAxisZ + 20);
      ctrl.target.set(0, 0, modelData.hingeAxisZ);
    } else if (view === 'closed') {
      onChangeHingeAngle(0);
      cam.up.set(0, 0, 1);
      cam.position.set(maxDim * 1.2, -maxDim * 1.3, maxDim * 1.2);
      ctrl.target.set(0, -config.dimensions.width / 2, config.dimensions.baseHeight / 2);
    }
    ctrl.update();
  };

  return (
    <div className="relative w-full h-full min-h-[480px] bg-[#E2E8F0] flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* 3D Canvas */}
      <div ref={containerRef} className="relative w-full flex-1 touch-none">
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Viewport Floating Controls Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none gap-2">
          {/* Status Badge */}
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200/90 text-xs font-medium shadow-xs">
            {config.hingeAngle === 0 ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            )}
            <span className="text-slate-800 font-medium">
              {config.hingeAngle === 180 ? (
                'Print Bed Layout (180° Flat)'
              ) : config.hingeAngle === 0 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Closed Box • Latch Snug & Locked
                </span>
              ) : (
                `Hinge Angle: ${Math.round(config.hingeAngle)}°`
              )}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono">
              {config.dimensions.length} × {config.dimensions.width} × {config.dimensions.baseHeight + config.dimensions.lidHeight} mm
            </span>
          </div>

          {/* Quick View Camera Buttons */}
          <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs">
            <button
              onClick={() => setCameraView('iso')}
              title="Isometric 3D View"
              className="px-2.5 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              3D Iso
            </button>
            <button
              onClick={() => setCameraView('top')}
              title="Top View (Bed Layout)"
              className="px-2.5 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Top (Bed)
            </button>
            <button
              onClick={() => setCameraView('hinge')}
              title="Hinge Knuckle Close-up"
              className="px-2.5 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Hinge Joint
            </button>
            <button
              onClick={() => setCameraView('front')}
              title="Front Latch View"
              className="px-2.5 py-1 text-xs font-medium rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Latch
            </button>
          </div>
        </div>

        {/* Hinge Angle & Animation Floating Bottom Bar */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Hinge Slider Card */}
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md max-w-md w-full sm:w-auto">
            <button
              onClick={() => setIsPlayingAnim(!isPlayingAnim)}
              className={`p-2 rounded-lg transition-all ${
                isPlayingAnim
                  ? 'bg-indigo-700 text-white font-bold shadow-xs'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
              }`}
              title={isPlayingAnim ? 'Pause folding animation' : 'Play folding animation'}
            >
              {isPlayingAnim ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <div className="flex-1 flex flex-col gap-1 min-w-[140px]">
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                <span className="cursor-pointer hover:text-indigo-600" onClick={() => onChangeHingeAngle(0)}>
                  0° (Closed)
                </span>
                <span className="text-indigo-600 font-bold font-mono">{Math.round(config.hingeAngle)}°</span>
                <span className="cursor-pointer hover:text-indigo-600" onClick={() => onChangeHingeAngle(180)}>
                  180° (Print)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={config.hingeAngle}
                onChange={(e) => {
                  setIsPlayingAnim(false);
                  onChangeHingeAngle(parseFloat(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setIsPlayingAnim(false);
                  onChangeHingeAngle(0);
                  playSnapSound();
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  config.hingeAngle === 0
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Close box and lock latch snugly"
              >
                {config.hingeAngle === 0 ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {config.hingeAngle === 0 ? 'Snug & Locked' : 'Close & Lock'}
              </button>
              <button
                onClick={() => {
                  setIsPlayingAnim(false);
                  onChangeHingeAngle(180);
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  config.hingeAngle === 180
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Open flat on print bed (180°)"
              >
                Open Flat
              </button>
            </div>
          </div>

          {/* Slicer Stats Pill */}
          <div className="pointer-events-auto flex items-center gap-4 px-5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-xs text-slate-700">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Filament</span>
              <span className="font-bold text-slate-900">
                {((config.dimensions.length * config.dimensions.width * 0.05) * 0.8).toFixed(1)}g
              </span>
            </div>
            <div className="h-6 w-[1px] bg-slate-200" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Est. Time</span>
              <span className="font-bold text-indigo-600">~{Math.round(config.dimensions.baseHeight * 1.5 + 20)}m</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-200" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Total Height</span>
              <span className="font-bold text-slate-900 font-mono">{config.dimensions.baseHeight + config.dimensions.lidHeight}mm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
