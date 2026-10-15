import React, { useRef, useState } from 'react';
import { ModelConfig } from '../types';
import { PRESET_ICONS, HeightmapResult } from '../utils/imageProcessor';
import { Image as ImageIcon, Type, Sparkles, Upload, RotateCw, Move, Layers, Check } from 'lucide-react';

interface DebossPanelProps {
  config: ModelConfig;
  heightmap: HeightmapResult | null;
  onChangeConfig: (newConfig: ModelConfig) => void;
}

export const DebossPanel: React.FC<DebossPanelProps> = ({ config, heightmap, onChangeConfig }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const updateDeboss = (key: keyof ModelConfig['deboss'], value: any) => {
    onChangeConfig({
      ...config,
      deboss: {
        ...config.deboss,
        [key]: value,
      },
    });
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChangeConfig({
        ...config,
        deboss: {
          ...config.deboss,
          enabled: true,
          type: 'image',
          imageDataUrl: dataUrl,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Enable Toggle & Depth Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span>Lid Embedded Deboss / Relief</span>
          </div>
          <button
            onClick={() => updateDeboss('enabled', !config.deboss.enabled)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              config.deboss.enabled
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {config.deboss.enabled ? 'Deboss Active' : 'Disabled (Plain Lid)'}
          </button>
        </div>

        {/* Feature Explainer */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
          <p>
            Embed raster images, preset logos, or text directly into the lid roof. The default <strong className="text-indigo-600 font-semibold">0.10mm</strong> depth creates clean, crisp first-layer / top-surface contrast on textured PEI sheets without weakening shell structure.
          </p>
        </div>

        {config.deboss.enabled && (
          <div className="space-y-4 pt-1">
            {/* Deboss Depth Control */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Deboss Depth</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateDeboss('depth', 0.1)}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-all ${
                      config.deboss.depth === 0.1
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    0.10mm (Standard)
                  </button>
                  <span className="font-mono text-indigo-600 font-bold">{config.deboss.depth} mm</span>
                </div>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={config.deboss.depth}
                onChange={(e) => updateDeboss('depth', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Mode Select: Image Upload vs Preset Symbol vs Custom Text */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateDeboss('type', 'image')}
                className={`py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  config.deboss.type === 'image'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
              </button>

              <button
                onClick={() => updateDeboss('type', 'preset')}
                className={`py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  config.deboss.type === 'preset'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preset Icons</span>
              </button>

              <button
                onClick={() => updateDeboss('type', 'text')}
                className={`py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  config.deboss.type === 'text'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Custom Text</span>
              </button>
            </div>

            {/* 1. Image Upload Dropzone */}
            {config.deboss.type === 'image' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/60'
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
                <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  {config.deboss.imageDataUrl ? 'Change Image (PNG, JPG, SVG)' : 'Click to Upload or Drag & Drop'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">High contrast black & white images produce the crispest 3D deboss results</p>
              </div>
            )}

            {/* 2. Preset Symbols Library */}
            {config.deboss.type === 'preset' && (
              <div className="grid grid-cols-3 gap-2">
                {PRESET_ICONS.map((preset) => {
                  const isSelected = config.deboss.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => updateDeboss('presetId', preset.id)}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-medium truncate">{preset.name}</span>
                      <span className="text-[10px] text-slate-400 mt-1">{preset.category}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Custom Text */}
            {config.deboss.type === 'text' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Debossed Text</label>
                  <input
                    type="text"
                    value={config.deboss.text || ''}
                    onChange={(e) => updateDeboss('text', e.target.value)}
                    placeholder="e.g. BAMBU NOZZLES or M3 BOLTS"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Font Style</label>
                  <select
                    value={config.deboss.fontFamily || 'system-ui'}
                    onChange={(e) => updateDeboss('fontFamily', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="system-ui">Modern Clean (Sans-Serif)</option>
                    <option value="monospace">Technical Monospace</option>
                    <option value="serif">Classic Serif</option>
                    <option value="Impact">Bold Industrial (Impact)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Geometry Transformations (Scale, Offset, Rotation, Invert) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Scale</span>
                    <span className="font-mono text-indigo-600 font-medium">{config.deboss.scale}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="85"
                    step="5"
                    value={config.deboss.scale}
                    onChange={(e) => updateDeboss('scale', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Rotation</span>
                    <span className="font-mono text-indigo-600 font-medium">{config.deboss.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={config.deboss.rotation}
                    onChange={(e) => updateDeboss('rotation', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Offset X</span>
                    <span className="font-mono text-indigo-600 font-medium">{config.deboss.offsetX} mm</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={config.deboss.offsetX}
                    onChange={(e) => updateDeboss('offsetX', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Offset Y</span>
                    <span className="font-mono text-indigo-600 font-medium">{config.deboss.offsetY} mm</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={config.deboss.offsetY}
                    onChange={(e) => updateDeboss('offsetY', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* Invert Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-600">Relief Direction</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateDeboss('invert', false)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                      !config.deboss.invert
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Deboss (Sunken)
                  </button>
                  <button
                    onClick={() => updateDeboss('invert', true)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                      config.deboss.invert
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Emboss (Raised)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
