import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ModelConfig, SlicerStats } from '../types';
import { exportToSTL, exportSeparateSTLs } from '../utils/stlExporter';
import { exportTo3MF } from '../utils/threemfExporter';
import { downloadToleranceTestSTL } from '../utils/toleranceCalibrator';
import { generateBoxGeometry } from '../utils/geometryGenerator';
import { HeightmapResult } from '../utils/imageProcessor';
import { Download, Check, FileCode, Box, Sparkles, BookOpen, AlertCircle, Copy, Printer, ExternalLink, X, Layers } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ModelConfig;
  heightmap: HeightmapResult | null;
  stats: SlicerStats | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  config,
  heightmap,
  stats,
}) => {
  const [exportLayout, setExportLayout] = useState<'flat' | 'closed'>('flat');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleExportSTL = () => {
    setIsExporting(true);
    try {
      const { baseGeometry, lidGeometry, dividersGeometry, hingeAxisZ } = generateBoxGeometry(config, heightmap);
      const angle = exportLayout === 'flat' ? 180 : 0;
      const filename = `PIP-Hinge-Box_${config.dimensions.length}x${config.dimensions.width}x${config.dimensions.baseHeight + config.dimensions.lidHeight}mm_${exportLayout}.stl`;
      exportToSTL(baseGeometry, lidGeometry, dividersGeometry, hingeAxisZ, angle, filename);
      triggerConfetti();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSeparateSTLs = () => {
    setIsExporting(true);
    try {
      const { baseGeometry, lidGeometry, dividersGeometry } = generateBoxGeometry(config, heightmap);
      const baseFilename = `Base_Box_${config.dimensions.length}x${config.dimensions.width}mm.stl`;
      const lidFilename = `Lid_Box_${config.dimensions.length}x${config.dimensions.width}mm.stl`;
      exportSeparateSTLs(baseGeometry, lidGeometry, dividersGeometry, baseFilename, lidFilename);
      triggerConfetti();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport3MF = async () => {
    setIsExporting(true);
    try {
      const { baseGeometry, lidGeometry, dividersGeometry, hingeAxisZ } = generateBoxGeometry(config, heightmap);
      const angle = exportLayout === 'flat' ? 180 : 0;
      const filename = `BambuStudio_PIP-Hinge-Box_${config.dimensions.length}x${config.dimensions.width}mm.3mf`;
      await exportTo3MF(baseGeometry, lidGeometry, dividersGeometry, hingeAxisZ, angle, filename);
      triggerConfetti();
    } finally {
      setIsExporting(false);
    }
  };

  const copySlicingSettings = () => {
    const text = `=== BAMBU STUDIO / ORCASLICER PRINT-IN-PLACE SETTINGS ===
Model: ${config.dimensions.length}x${config.dimensions.width}x${config.dimensions.baseHeight + config.dimensions.lidHeight}mm Hinge Box
• Layer Height: 0.20mm Standard
• Wall Loops: 4 (Crucial for hinge pin structural strength)
• Top / Bottom Shells: 4 layers each
• Infill: 15% Gyroid
• Support: DISABLED (Hinge uses 45° conical overhangs, zero support needed)
• First Layer Speed: 40-50 mm/s
• Hinge Clearance: ${config.hinge.clearanceRadial}mm radial / ${config.hinge.clearanceAxial}mm axial (Free-Movement Calibrated)
• Hinge Design: ${config.hinge.cylindricalLength || 2.8}mm straight cylindrical pilot + 45° conical taper, ${config.hinge.centerKnuckleLength || 25.0}mm center knuckle
• Detect Thin Walls: OFF (Prevents slicer from bridging knuckle air gap)
• Deboss Depth: ${config.deboss.enabled ? `${config.deboss.depth}mm` : 'None'}
• Filament: ${config.material.name} (${stats?.weightGrams || 25}g est.)`;

    navigator.clipboard.writeText(text);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Export 3D Print Files</h2>
              <p className="text-xs text-slate-500">Ready for Bambu Studio, OrcaSlicer, PrusaSlicer & Cura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Export Orientation Choice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800">Export Orientation</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportLayout('flat')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  exportLayout === 'flat'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">180° Print-in-Place (Flat)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold uppercase">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Both base and lid resting on the build plate. Hinge prints interlocked in one seamless print.
                </p>
              </button>

              <button
                onClick={() => setExportLayout('closed')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  exportLayout === 'closed'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">0° Closed Assembly</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Export with lid clicked shut. Best for digital CAD rendering or multi-body inspection.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Download Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bambu Studio 3MF */}
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Bambu Studio
                  </span>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-semibold">
                    .3MF
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  Dual-object 3MF with recommended 4-wall profile metadata and print plate alignment.
                </p>
              </div>

              <button
                onClick={handleExport3MF}
                disabled={isExporting}
                className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Export .3MF</span>
              </button>
            </div>

            {/* Standard Binary STL (Print-in-Place) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-slate-600" />
                    Print-in-Place STL
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-200 px-2 py-0.5 rounded font-semibold">
                    .STL
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  Unified interlocking mesh with tight 0.30mm clearance & extended pins built-in.
                </p>
              </div>

              <button
                onClick={handleExportSTL}
                disabled={isExporting}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Export PIP .STL</span>
              </button>
            </div>

            {/* Separate STLs (Base & Lid Independent) */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Split STLs (2 Files)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                    2x .STL
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  Base & Lid downloaded separately. Zero chance of slicer fusing, or print in two different colors!
                </p>
              </div>

              <button
                onClick={handleExportSeparateSTLs}
                disabled={isExporting}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Base + Lid STLs</span>
              </button>
            </div>
          </div>

          {/* 3. Free Tolerance Test Strip Download */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <Box className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-amber-900">10-Minute Hinge Tolerance Test Strip</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Test 0.20, 0.30, 0.35, and 0.45mm clearances on your printer before printing large boxes.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                downloadToleranceTestSTL();
                triggerConfetti();
              }}
              className="shrink-0 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Test Strip (.STL)</span>
            </button>
          </div>

          {/* 4. Slicing Recommendations & Copy Checklist */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Optimal Slicing Rules for Print-in-Place Hinges</span>
              </div>
              <button
                onClick={copySlicingSettings}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                {copiedGuide ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGuide ? 'Copied!' : 'Copy Settings'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-mono">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 block text-[10px]">WALL LOOPS</span>
                <span className="text-indigo-600 font-bold">4 Walls (Nozzle 0.4mm)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 block text-[10px]">SUPPORTS</span>
                <span className="text-indigo-600 font-bold">Disabled (0% Support)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 block text-[10px]">LAYER HEIGHT</span>
                <span className="text-slate-800 font-medium">0.20mm Standard</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 block text-[10px]">INFILL</span>
                <span className="text-slate-800 font-medium">15% Gyroid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
