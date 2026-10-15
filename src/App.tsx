import React, { useState, useEffect } from 'react';
import { ModelConfig, SlicerStats } from './types';
import { DEFAULT_MODEL_CONFIG, BOX_PRESETS, BoxPreset } from './utils/presets';
import { HeightmapResult, generateHeightmap } from './utils/imageProcessor';
import { Header } from './components/Header';
import { Viewport3D } from './components/Viewport3D';
import { ParameterPanel } from './components/ParameterPanel';
import { DebossPanel } from './components/DebossPanel';
import { BedLayoutOptimizer } from './components/BedLayoutOptimizer';
import { ExportModal } from './components/ExportModal';
import { downloadToleranceTestSTL } from './utils/toleranceCalibrator';
import { Sliders, Image as ImageIcon, LayoutGrid, Sparkles, Download, ShieldCheck, Box, Info } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('fusion-classic');
  const [activeTab, setActiveTab] = useState<'parameters' | 'deboss' | 'layout' | 'presets'>('parameters');
  const [heightmap, setHeightmap] = useState<HeightmapResult | null>(null);
  const [stats, setStats] = useState<SlicerStats | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Generate / update deboss heightmap whenever deboss settings change
  useEffect(() => {
    if (!config.deboss.enabled) {
      setHeightmap(null);
      return;
    }

    let isMounted = true;
    generateHeightmap(config.deboss.type, config.deboss.resolution, {
      imageDataUrl: config.deboss.imageDataUrl,
      presetId: config.deboss.presetId,
      text: config.deboss.text,
      fontFamily: config.deboss.fontFamily,
      invert: config.deboss.invert,
    }).then((res) => {
      if (isMounted) {
        setHeightmap(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [
    config.deboss.enabled,
    config.deboss.type,
    config.deboss.presetId,
    config.deboss.imageDataUrl,
    config.deboss.text,
    config.deboss.fontFamily,
    config.deboss.invert,
    config.deboss.resolution,
  ]);

  const handleSelectPreset = (preset: BoxPreset) => {
    setSelectedPresetId(preset.id);
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
      dimensions: {
        ...prev.dimensions,
        ...(preset.config.dimensions || {}),
      },
      hinge: {
        ...prev.hinge,
        ...(preset.config.hinge || {}),
      },
      latch: {
        ...prev.latch,
        ...(preset.config.latch || {}),
      },
      dividers: {
        ...prev.dividers,
        ...(preset.config.dividers || {}),
      },
      deboss: {
        ...prev.deboss,
        ...(preset.config.deboss || {}),
      },
    }));
  };

  const handleReset = () => {
    setConfig(DEFAULT_MODEL_CONFIG);
    setSelectedPresetId('fusion-classic');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        config={config}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenToleranceTest={() => downloadToleranceTestSTL()}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Interactive Viewport (7 cols on lg screens) */}
        <div className="lg:col-span-7 flex flex-col gap-4 sticky top-20">
          <div className="h-[520px] xl:h-[580px] w-full">
            <Viewport3D
              config={config}
              heightmap={heightmap}
              onUpdateStats={setStats}
              onChangeHingeAngle={(angle) => {
                if (typeof angle === 'function') {
                  setConfig((prev) => ({ ...prev, hingeAngle: angle(prev.hingeAngle) }));
                } else {
                  setConfig((prev) => ({ ...prev, hingeAngle: angle }));
                }
              }}
            />
          </div>

          {/* Quick Info & Reference Banner */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-900">Print-in-Place Hinge Guarantee</span>
                <p className="text-[11px] text-slate-500">
                  45° cone-pin interlock requires zero support material. Ready to print flat on build plate.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExportOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Export
            </button>
          </div>
        </div>

        {/* Right Column: Customisation Panel & Tabs (5 cols on lg screens) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('parameters')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === 'parameters'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Geometry</span>
            </button>

            <button
              onClick={() => setActiveTab('deboss')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === 'deboss'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Deboss Lid</span>
            </button>

            <button
              onClick={() => setActiveTab('layout')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === 'layout'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bed Layout</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === 'presets'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="transition-all duration-200">
            {activeTab === 'parameters' && (
              <ParameterPanel config={config} onChangeConfig={setConfig} />
            )}

            {activeTab === 'deboss' && (
              <DebossPanel config={config} heightmap={heightmap} onChangeConfig={setConfig} />
            )}

            {activeTab === 'layout' && (
              <BedLayoutOptimizer config={config} stats={stats} onChangeConfig={setConfig} />
            )}

            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Box Templates & Use-Cases</h3>
                  <p className="text-xs text-slate-500">
                    Pre-calibrated parametric designs ready for immediate 3D printing or fine-tuning.
                  </p>
                </div>

                <div className="space-y-3">
                  {BOX_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-300 text-indigo-950 ring-1 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Box className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900">{preset.name}</span>
                            {isSelected && (
                              <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{preset.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                            <span>
                              {preset.config?.dimensions?.length}×{preset.config?.dimensions?.width}×
                              {(preset.config?.dimensions?.baseHeight || 0) + (preset.config?.dimensions?.lidHeight || 0)}mm
                            </span>
                            <span>•</span>
                            <span>{preset.config?.hinge?.clearanceRadial}mm Clearance</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        config={config}
        heightmap={heightmap}
        stats={stats}
      />
    </div>
  );
}
