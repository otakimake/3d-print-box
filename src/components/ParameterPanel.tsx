import React, { useState } from 'react';
import { ModelConfig } from '../types';
import { Sliders, Lock, Grid3X3, Layers, Link2, Link2Off, CheckCircle2 } from 'lucide-react';

interface ParameterPanelProps {
  config: ModelConfig;
  onChangeConfig: (newConfig: ModelConfig) => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({ config, onChangeConfig }) => {
  const [linkHeights, setLinkHeights] = useState(false);

  const updateDimensions = (key: keyof ModelConfig['dimensions'], value: number) => {
    if (linkHeights && (key === 'baseHeight' || key === 'lidHeight')) {
      onChangeConfig({
        ...config,
        dimensions: {
          ...config.dimensions,
          baseHeight: value,
          lidHeight: value,
        },
      });
      return;
    }
    onChangeConfig({
      ...config,
      dimensions: {
        ...config.dimensions,
        [key]: value,
      },
    });
  };

  const applyHeightRatio = (baseRatio: number, lidRatio: number) => {
    const totalH = config.dimensions.baseHeight + config.dimensions.lidHeight;
    const newBase = Math.round((totalH * baseRatio) / (baseRatio + lidRatio));
    const newLid = Math.max(6, totalH - newBase);
    onChangeConfig({
      ...config,
      dimensions: {
        ...config.dimensions,
        baseHeight: Math.max(10, newBase),
        lidHeight: newLid,
      },
    });
  };

  const updateLatch = (key: keyof ModelConfig['latch'], value: any) => {
    onChangeConfig({
      ...config,
      latch: {
        ...config.latch,
        [key]: value,
      },
    });
  };

  const updateHinge = (key: keyof ModelConfig['hinge'], value: any) => {
    onChangeConfig({
      ...config,
      hinge: {
        ...config.hinge,
        [key]: value,
      },
    });
  };

  const updateDividers = (key: keyof ModelConfig['dividers'], value: any) => {
    onChangeConfig({
      ...config,
      dividers: {
        ...config.dividers,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Box Dimensions */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Box Dimensions (mm)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {config.dimensions.length} × {config.dimensions.width} × {config.dimensions.baseHeight + config.dimensions.lidHeight}mm
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Length (X)</span>
              <span className="font-mono text-indigo-600 font-medium">{config.dimensions.length} mm</span>
            </div>
            <input
              type="range"
              min="35"
              max="200"
              step="1"
              value={config.dimensions.length}
              onChange={(e) => updateDimensions('length', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Width (Y)</span>
              <span className="font-mono text-indigo-600 font-medium">{config.dimensions.width} mm</span>
            </div>
            <input
              type="range"
              min="30"
              max="150"
              step="1"
              value={config.dimensions.width}
              onChange={(e) => updateDimensions('width', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

        </div>

        {/* Height Presets & Synchronization Bar */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Base & Lid Height Ratio:</span>
            <button
              type="button"
              onClick={() => {
                const next = !linkHeights;
                setLinkHeights(next);
                if (next) {
                  // Synchronize lid to base when locking
                  updateDimensions('lidHeight', config.dimensions.baseHeight);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                linkHeights
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Lock Base & Lid to equal heights for symmetric 1:1 clamshell boxes"
            >
              {linkHeights ? <Link2 className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
              <span>{linkHeights ? 'Linked (1:1 Equal)' : 'Independent'}</span>
            </button>
          </div>

          {/* Quick Ergonomic Height Ratio Buttons */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => applyHeightRatio(1, 1)}
              className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded text-slate-700 text-center font-medium transition-all"
            >
              1:1 Clamshell
            </button>
            <button
              type="button"
              onClick={() => applyHeightRatio(2, 1)}
              className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded text-slate-700 text-center font-medium transition-all"
            >
              2:1 Deep Base
            </button>
            <button
              type="button"
              onClick={() => applyHeightRatio(3, 1)}
              className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded text-slate-700 text-center font-medium transition-all"
            >
              3:1 Shallow Lid
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Base Height</span>
                <span className="font-mono text-indigo-600 font-medium">{config.dimensions.baseHeight} mm</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="1"
                value={config.dimensions.baseHeight}
                onChange={(e) => updateDimensions('baseHeight', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Lid Height</span>
                <span className="font-mono text-indigo-600 font-medium">{config.dimensions.lidHeight} mm</span>
              </div>
              <input
                type="range"
                min="6"
                max="60"
                step="1"
                value={config.dimensions.lidHeight}
                onChange={(e) => updateDimensions('lidHeight', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Live Hinge Axis & Closure Alignment Badge */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Hinge Always Aligned & Connected</span>
            </div>
            <div className="font-mono text-slate-500">
              Axis Z: <span className="font-semibold text-slate-800">{((config.dimensions.baseHeight + config.dimensions.lidHeight) / 2).toFixed(1)}mm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Wall Thickness</span>
              <span className="font-mono text-indigo-600 font-medium">{config.dimensions.wallThickness} mm</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="4.0"
              step="0.2"
              value={config.dimensions.wallThickness}
              onChange={(e) => updateDimensions('wallThickness', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {(config.dimensions.wallThickness / 0.4).toFixed(0)} perimeter wall loops (0.4 nozzle)
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Corner Radius</span>
              <span className="font-mono text-indigo-600 font-medium">{config.dimensions.cornerRadius} mm</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12.0"
              step="0.5"
              value={config.dimensions.cornerRadius}
              onChange={(e) => updateDimensions('cornerRadius', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* 2. Integrated Snap-Fit Latch Mechanism */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Integrated Locking Mechanism</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Cantilever Snap-Fit
          </span>
        </div>

        {/* Mechanism Overview Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Cantilever Snap Mechanism:</span>
            <button
              onClick={() => onChangeConfig({ ...config, hingeAngle: config.hingeAngle === 0 ? 180 : 0 })}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 cursor-pointer"
            >
              {config.hingeAngle === 0 ? 'Open Flat (180°)' : 'Inspect Closed & Snug (0°)'}
            </button>
          </div>
          <p className="leading-relaxed">
            Support-free snap latch tab with inverted triangular gusset: engineered with a 45° camming lead-in ramp, positive retention undercut shelf (~28° from horizontal) that firmly catches under the base shelf, slip-clearance root stem (0.20mm) to prevent rim binding, and an inverted triangular buttress below the rim for rigid layer-line shear resistance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Snap Protrusion</span>
              <span className="font-mono text-indigo-600 font-medium">{config.latch.protrusion} mm</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.4"
              step="0.05"
              value={config.latch.protrusion}
              onChange={(e) => updateLatch('protrusion', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Snap Clearance</span>
              <span className="font-mono text-indigo-600 font-medium">{config.latch.tolerance} mm</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.45"
              step="0.05"
              value={config.latch.tolerance}
              onChange={(e) => updateLatch('tolerance', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Latch Width</span>
              <span className="font-mono text-indigo-600 font-medium">{config.latch.width} mm</span>
            </div>
            <input
              type="range"
              min="8"
              max="35"
              step="1"
              value={config.latch.width}
              onChange={(e) => updateLatch('width', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Sealing Rim Lip</span>
              <span className="font-mono text-indigo-600 font-medium">{config.latch.lipHeight} mm</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.5"
              value={config.latch.lipHeight}
              onChange={(e) => updateLatch('lipHeight', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* 3. Heavy-Duty Print-In-Place Hinge */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Heavy-Duty PIP Hinge</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Reinforced 45° Chamfer
          </span>
        </div>

        {/* Hinge Overview Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Print-in-Place Architecture:</span>
            <span className="font-mono text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {(((config.hinge.knuckleDiameter - (config.hinge.pinDiameter + (config.hinge.clearanceRadial || 0.42) * 2)) / 2)).toFixed(2)} mm Collar Wall
            </span>
          </div>
          <p className="leading-relaxed">
            Thickened knuckle cylinder with 45° self-supporting printable support gusset that cradles the cylinder from the bottom up to the equator. Eliminates mid-air overhang clashes in Bambu Studio / OrcaSlicer preview while providing robust, solid-layer strength.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Knuckle Diameter</span>
              <span className="font-mono text-indigo-600 font-medium">{config.hinge.knuckleDiameter} mm</span>
            </div>
            <input
              type="range"
              min="7.0"
              max="13.0"
              step="0.2"
              value={config.hinge.knuckleDiameter}
              onChange={(e) => updateHinge('knuckleDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Thickened outer knuckle profile
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Hinge Standoff Gap</span>
              <span className="font-mono text-indigo-600 font-medium">{(config.hinge.bodyClearance ?? 1.4).toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.1"
              value={config.hinge.bodyClearance ?? 1.4}
              onChange={(e) => updateHinge('bodyClearance', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Clearance from box body walls
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Pin Diameter</span>
              <span className="font-mono text-indigo-600 font-medium">{config.hinge.pinDiameter} mm</span>
            </div>
            <input
              type="range"
              min="3.0"
              max="5.0"
              step="0.1"
              value={config.hinge.pinDiameter}
              onChange={(e) => updateHinge('pinDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Radial Clearance</span>
              <span className="font-mono text-indigo-600 font-medium">{config.hinge.clearanceRadial} mm</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.60"
              step="0.02"
              value={config.hinge.clearanceRadial}
              onChange={(e) => updateHinge('clearanceRadial', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* 4. Internal Compartment Dividers */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Grid3X3 className="w-4 h-4 text-indigo-600" />
            <span>Internal Dividers & Trays</span>
          </div>
          <button
            onClick={() => updateDividers('enabled', !config.dividers.enabled)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              config.dividers.enabled
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {config.dividers.enabled ? 'Enabled' : 'Disabled (Open Box)'}
          </button>
        </div>

        {config.dividers.enabled && (
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Rows (Y Axis)</span>
                <span className="font-mono text-indigo-600 font-medium">{config.dividers.rows}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={config.dividers.rows}
                onChange={(e) => updateDividers('rows', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Columns (X Axis)</span>
                <span className="font-mono text-indigo-600 font-medium">{config.dividers.cols}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={config.dividers.cols}
                onChange={(e) => updateDividers('cols', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Divider Height</span>
                <span className="font-mono text-indigo-600 font-medium">{config.dividers.heightPercent}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={config.dividers.heightPercent}
                onChange={(e) => updateDividers('heightPercent', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Divider Thickness</span>
                <span className="font-mono text-indigo-600 font-medium">{config.dividers.thickness} mm</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.4"
                step="0.2"
                value={config.dividers.thickness}
                onChange={(e) => updateDividers('thickness', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
