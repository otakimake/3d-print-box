import React from 'react';
import { ModelConfig } from '../types';
import { BOX_PRESETS, BoxPreset, DEFAULT_MODEL_CONFIG } from '../utils/presets';
import { Box, Download, RotateCcw, Sparkles, Layers, ShieldCheck, HelpCircle } from 'lucide-react';

interface HeaderProps {
  config: ModelConfig;
  selectedPresetId: string;
  onSelectPreset: (preset: BoxPreset) => void;
  onReset: () => void;
  onOpenExport: () => void;
  onOpenToleranceTest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  selectedPresetId,
  onSelectPreset,
  onReset,
  onOpenExport,
  onOpenToleranceTest,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 px-4 lg:px-6 py-3 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-xs">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">BoxSmith <span className="text-slate-400 font-normal">3D v1.2</span></h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Print-in-Place Hinge
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Parametric 45° conical hinge box • snap latches • 0.1mm deboss lid
            </p>
          </div>
        </div>

        {/* Quick Preset Selector & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {BOX_PRESETS.slice(0, 3).map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    isSelected
                      ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {preset.name.replace(' Fusion 360', '').replace(' Organizer', '').replace(' Vault', '')}
                </button>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              title="Reset parameters to default"
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={onOpenExport}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs flex items-center gap-2 shadow-xs transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export STL / 3MF</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
