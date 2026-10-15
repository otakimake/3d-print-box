import React from 'react';
import { ModelConfig, SlicerStats, PrintBedConfig } from '../types';
import { PRINT_BED_PRESETS, MATERIAL_PALETTES } from '../utils/presets';
import { LayoutGrid, RotateCcw, AlertTriangle, CheckCircle2, Scissors, Gauge, Clock, DollarSign, Palette, Sparkles } from 'lucide-react';

interface BedLayoutOptimizerProps {
  config: ModelConfig;
  stats: SlicerStats | null;
  onChangeConfig: (newConfig: ModelConfig) => void;
}

export const BedLayoutOptimizer: React.FC<BedLayoutOptimizerProps> = ({ config, stats, onChangeConfig }) => {
  const updateBed = (bed: PrintBedConfig) => {
    onChangeConfig({
      ...config,
      bedConfig: bed,
    });
  };

  const updateMaterial = (mat: typeof MATERIAL_PALETTES[0]) => {
    onChangeConfig({
      ...config,
      material: mat,
    });
  };

  const toggleDiagonal = () => {
    onChangeConfig({
      ...config,
      autoDiagonal: !config.autoDiagonal,
    });
  };

  const toggleCrossSection = () => {
    onChangeConfig({
      ...config,
      showCrossSection: !config.showCrossSection,
    });
  };

  // Dimensions of flat box when printed at 180°
  const flatWidth = config.dimensions.length;
  const hingeOffset = (config.hinge.knuckleDiameter / 2) + (config.hinge.bodyClearance ?? 1.4);
  const flatDepth = (config.dimensions.width + hingeOffset) * 2 + (config.latch.protrusion || 0.7);
  const bedWidth = config.bedConfig.width;
  const bedDepth = config.bedConfig.depth;

  const fitsStandard = flatWidth <= bedWidth - 10 && flatDepth <= bedDepth - 10;
  const diagonalSpan = Math.sqrt(flatWidth * flatWidth + flatDepth * flatDepth);
  const bedDiagonal = Math.sqrt(bedWidth * bedWidth + bedDepth * bedDepth);
  const fitsDiagonal = diagonalSpan <= bedDiagonal - 15;

  return (
    <div className="space-y-4">
      {/* 1. Print Bed Preset Selector */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <LayoutGrid className="w-4 h-4 text-indigo-600" />
            <span>Target 3D Printer & Build Plate</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {config.bedConfig.width} × {config.bedConfig.depth} mm
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {PRINT_BED_PRESETS.map((bed) => {
            const isSelected = config.bedConfig.type === bed.type;
            return (
              <button
                key={bed.type}
                onClick={() => updateBed(bed)}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{bed.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 font-mono">
                  {bed.width} × {bed.depth} × {bed.height} mm
                </span>
              </button>
            );
          })}
        </div>

        {/* Auto Layout Space Optimizer Box */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900">Auto-Layout & Orientation</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Optimize build plate footprint for maximum clearance and print speed
              </p>
            </div>
            <button
              onClick={toggleDiagonal}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                config.autoDiagonal
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{config.autoDiagonal ? '45° Diagonal Auto-Fit' : 'Orthogonal 0°'}</span>
            </button>
          </div>

          {/* Bed Fit Status Card */}
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 ${
              (config.autoDiagonal ? fitsDiagonal : fitsStandard)
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {(config.autoDiagonal ? fitsDiagonal : fitsStandard) ? (
              <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div className="text-xs leading-relaxed">
              {(config.autoDiagonal ? fitsDiagonal : fitsStandard) ? (
                <div>
                  <span className="font-semibold text-indigo-950">Fits perfectly on {config.bedConfig.name}</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Model unfolded print footprint: <strong className="font-mono text-slate-900">{flatWidth} × {Math.round(flatDepth)} mm</strong>{' '}
                    ({stats?.bedCoveragePercent || 15}% bed area occupied).
                  </p>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-rose-900">Exceeds standard build area limits</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Box size is larger than {config.bedConfig.width}×{config.bedConfig.depth}mm. Enable <strong>45° Diagonal Auto-Fit</strong> or reduce dimensions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Slicing Inspection Tools & Cross-Section */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Scissors className="w-4 h-4 text-indigo-600" />
            <span>Hinge Cross-Section & Clearance Inspection</span>
          </div>
          <button
            onClick={toggleCrossSection}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              config.showCrossSection
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {config.showCrossSection ? 'Cut Plane Active' : 'Off'}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Slice through the hinge barrel and conical pins to verify that internal clearances won't fuse during printing.
        </p>

        {config.showCrossSection && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Slice Axis</span>
              <div className="flex gap-2">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <button
                    key={axis}
                    onClick={() => onChangeConfig({ ...config, crossSectionAxis: axis })}
                    className={`px-3 py-1 text-xs font-mono uppercase font-bold rounded-lg border transition-all ${
                      config.crossSectionAxis === axis
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {axis}-Axis
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Cut Position</span>
                <span className="font-mono text-indigo-600 font-bold">{Math.round(config.crossSectionPos * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.crossSectionPos}
                onChange={(e) => onChangeConfig({ ...config, crossSectionPos: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Filament Material & Color Swatches */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>Filament Material & Color</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">{config.material.name}</span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {MATERIAL_PALETTES.map((mat) => {
            const isSelected = config.material.id === mat.id;
            return (
              <button
                key={mat.id}
                onClick={() => updateMaterial(mat)}
                className={`p-2.5 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: mat.hex }}
                />
                <span className="text-[10px] text-slate-700 text-center font-medium truncate w-full">
                  {mat.name.replace('Bambu PLA ', '').replace('PLA ', '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
