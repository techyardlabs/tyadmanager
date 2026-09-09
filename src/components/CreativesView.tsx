import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Link,
  Youtube,
  Video,
  Code,
  Calendar,
  Sliders,
  ExternalLink,
  RefreshCw,
  X,
  Play,
} from 'lucide-react';
import { Campaign, Creative, PREDEFINED_SLOTS, VideoType } from '../types.js';

interface CreativesViewProps {
  creatives: Creative[];
  campaigns: Campaign[];
  selectedSlotFilter: string;
  onSelectSlotFilter: (slotId: string) => void;
  onSaveCreative: (creative: Partial<Creative>, isNew: boolean) => Promise<void>;
  onDeleteCreative: (id: string) => Promise<void>;
  onToggleStatus: (creative: Creative) => Promise<void>;
}

export const CreativesView: React.FC<CreativesViewProps> = ({
  creatives,
  campaigns,
  selectedSlotFilter,
  onSelectSlotFilter,
  onSaveCreative,
  onDeleteCreative,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'image' | 'video'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCampaignId, setFormCampaignId] = useState('');
  const [formSlotId, setFormSlotId] = useState('MR-300x250-1');
  const [formFormatType, setFormFormatType] = useState<'image' | 'video'>('image');
  const [formVideoType, setFormVideoType] = useState<VideoType>('youtube');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formEmbedCode, setFormEmbedCode] = useState('');
  const [formTargetUrl, setFormTargetUrl] = useState('https://example.com');
  const [formStatus, setFormStatus] = useState<'active' | 'paused'>('active');
  const [formWeight, setFormWeight] = useState(60);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  // Client-Side Dimension Validation State
  const [dimensionError, setDimensionError] = useState<{
    actualWidth: number;
    actualHeight: number;
    requiredWidth: number;
    requiredHeight: number;
    rawImageSrc?: string;
  } | null>(null);
  const [isValidatingFile, setIsValidatingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSlotDef = PREDEFINED_SLOTS.find((s) => s.id === formSlotId) || PREDEFINED_SLOTS[0];

  // Open modal for new creative
  const handleOpenNew = () => {
    setEditingCreative(null);
    setFormName('');
    setFormCampaignId(campaigns[0]?.id || '');
    setFormSlotId(selectedSlotFilter !== 'all' ? selectedSlotFilter : 'MR-300x250-1');
    const targetSlot = PREDEFINED_SLOTS.find(
      (s) => s.id === (selectedSlotFilter !== 'all' ? selectedSlotFilter : 'MR-300x250-1')
    );
    const isVid = targetSlot?.allowedFormats.includes('video') && !targetSlot?.allowedFormats.includes('image');
    setFormFormatType(isVid ? 'video' : 'image');
    setFormVideoType('youtube');
    setFormMediaUrl('');
    setFormYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    setFormEmbedCode('');
    setFormTargetUrl('https://example.com/promo');
    setFormStatus('active');
    setFormWeight(60);
    setDimensionError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing creative
  const handleOpenEdit = (cr: Creative) => {
    setEditingCreative(cr);
    setFormName(cr.name);
    setFormCampaignId(cr.campaignId);
    setFormSlotId(cr.slotId);
    setFormFormatType(cr.formatType);
    setFormVideoType(cr.videoType || 'youtube');
    setFormMediaUrl(cr.mediaUrl);
    setFormYoutubeUrl(cr.youtubeUrl || '');
    setFormEmbedCode(cr.embedCode || '');
    setFormTargetUrl(cr.targetUrl);
    setFormStatus(cr.status);
    setFormWeight(cr.weight || 50);
    setFormStartDate(cr.startDate ? cr.startDate.slice(0, 10) : '');
    setFormEndDate(cr.endDate ? cr.endDate.slice(0, 10) : '');
    setDimensionError(null);
    setIsModalOpen(true);
  };

  // Update format type automatically if slot changes
  const handleSlotChange = (newSlotId: string) => {
    setFormSlotId(newSlotId);
    const slot = PREDEFINED_SLOTS.find((s) => s.id === newSlotId);
    if (slot) {
      if (slot.category === 'video') {
        setFormFormatType('video');
      } else {
        setFormFormatType('image');
      }
      setDimensionError(null);
    }
  };

  // Strict Client-Side File Dimension Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidatingFile(true);
    setDimensionError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          setIsValidatingFile(false);
          const reqW = activeSlotDef.width;
          const reqH = activeSlotDef.height;

          if (img.naturalWidth !== reqW || img.naturalHeight !== reqH) {
            // Dimension mismatch detected!
            setDimensionError({
              actualWidth: img.naturalWidth,
              actualHeight: img.naturalHeight,
              requiredWidth: reqW,
              requiredHeight: reqH,
              rawImageSrc: dataUrl,
            });
          } else {
            // Strict match! Set mediaUrl directly
            setFormMediaUrl(dataUrl);
            setDimensionError(null);
          }
        };
        img.onerror = () => {
          setIsValidatingFile(false);
          alert('Could not parse image file. Please provide a valid JPG, PNG, GIF, or WebP.');
        };
        img.src = dataUrl;
      } else if (file.type.startsWith('video/')) {
        setIsValidatingFile(false);
        setFormFormatType('video');
        setFormVideoType('mp4');
        setFormMediaUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto-Crop / Canvas Scale to enforce strict pixel dimensions
  const handleAutoFitToSlot = () => {
    if (!dimensionError || !dimensionError.rawImageSrc) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = dimensionError.requiredWidth;
      canvas.height = dimensionError.requiredHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High quality cover scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Calculate aspect ratio cover fit
        const scale = Math.max(
          canvas.width / img.naturalWidth,
          canvas.height / img.naturalHeight
        );
        const scaledW = img.naturalWidth * scale;
        const scaledH = img.naturalHeight * scale;
        const offsetX = (canvas.width - scaledW) / 2;
        const offsetY = (canvas.height - scaledH) / 2;

        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
        const fittedDataUrl = canvas.toDataURL('image/png', 0.95);
        setFormMediaUrl(fittedDataUrl);
        setDimensionError(null);
      }
    };
    img.src = dimensionError.rawImageSrc;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dimensionError) {
      alert('Please resolve the dimension mismatch before saving.');
      return;
    }

    const payload: Partial<Creative> = {
      ...(editingCreative ? { id: editingCreative.id } : {}),
      name: formName || `${activeSlotDef.name} Creative`,
      campaignId: formCampaignId || campaigns[0]?.id,
      slotId: formSlotId,
      formatType: formFormatType,
      videoType: formFormatType === 'video' ? formVideoType : undefined,
      mediaUrl: formMediaUrl,
      youtubeUrl: formYoutubeUrl,
      embedCode: formEmbedCode,
      targetUrl: formTargetUrl || 'https://example.com',
      width: activeSlotDef.width,
      height: activeSlotDef.height,
      status: formStatus,
      weight: Number(formWeight) || 50,
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
    };

    await onSaveCreative(payload, !editingCreative);
    setIsModalOpen(false);
  };

  // Filtered creatives list
  const filtered = creatives.filter((cr) => {
    if (selectedSlotFilter && selectedSlotFilter !== 'all' && cr.slotId !== selectedSlotFilter) {
      return false;
    }
    if (statusFilter !== 'all' && cr.status !== statusFilter) {
      return false;
    }
    if (formatFilter !== 'all' && cr.formatType !== formatFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        cr.name.toLowerCase().includes(q) ||
        cr.slotId.toLowerCase().includes(q) ||
        (cr.campaignName && cr.campaignName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Creative Management
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {creatives.length} Creatives Total
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Upload banner assets with strict pixel dimension enforcement, video embeds, and rotation weights.
          </p>
        </div>

        <button
          id="btn-new-creative"
          onClick={handleOpenNew}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Creative</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search creative name, slot ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Slot Dropdown Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSlotFilter}
            onChange={(e) => onSelectSlotFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Inventory Slots ({PREDEFINED_SLOTS.length})</option>
            {PREDEFINED_SLOTS.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.id} ({slot.width}x{slot.height}) - {slot.name}
              </option>
            ))}
          </select>
        </div>

        {/* Format Filter */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFormatFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              formatFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Formats
          </button>
          <button
            onClick={() => setFormatFilter('image')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              formatFilter === 'image' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Banners
          </button>
          <button
            onClick={() => setFormatFilter('video')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              formatFilter === 'video' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Videos
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'active' ? 'bg-emerald-950 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'paused' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paused
          </button>
        </div>
      </div>

      {/* Creatives Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
            <p className="text-sm font-semibold">No creatives match your filter criteria.</p>
            <button
              onClick={handleOpenNew}
              className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create one now</span>
            </button>
          </div>
        ) : (
          filtered.map((cr) => {
            const slotDef = PREDEFINED_SLOTS.find((s) => s.id === cr.slotId);
            return (
              <div
                key={cr.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Slot & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                      {cr.slotId}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {cr.width}&times;{cr.height}
                      </span>
                      <button
                        onClick={() => onToggleStatus(cr)}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                          cr.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {cr.status}
                      </button>
                    </div>
                  </div>

                  {/* Creative Name & Campaign */}
                  <h4 className="font-bold text-white text-sm line-clamp-1">{cr.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    Campaign: <span className="text-slate-300">{cr.campaignName || cr.campaignId}</span>
                  </p>

                  {/* Visual Preview Box */}
                  <div className="mt-3 w-full h-36 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden relative flex items-center justify-center">
                    {cr.formatType === 'video' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-3 text-center">
                        {cr.videoType === 'youtube' ? (
                          <>
                            <Youtube className="w-8 h-8 text-rose-500 mb-1" />
                            <span className="text-xs text-white font-medium">YouTube Video Stream</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-full">
                              {cr.youtubeUrl || 'Direct Player'}
                            </span>
                          </>
                        ) : cr.videoType === 'embed' ? (
                          <>
                            <Code className="w-8 h-8 text-cyan-400 mb-1" />
                            <span className="text-xs text-white font-medium">Custom Embed Snippet</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Sandboxed iframe</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-8 h-8 text-blue-400 mb-1" />
                            <span className="text-xs text-white font-medium">Self-Hosted MP4/WebM</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-full">
                              HTML5 Video Player
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <img
                        src={cr.mediaUrl}
                        alt={cr.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                    <span className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded">
                      Weight: {cr.weight}%
                    </span>
                  </div>

                  {/* Target URL */}
                  <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-400 truncate">
                    <Link className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate text-slate-300">{cr.targetUrl}</span>
                  </div>
                </div>

                {/* Metrics & Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">IMPR</span>
                      <span className="text-slate-200 font-bold">{cr.impressions.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">CLICKS</span>
                      <span className="text-slate-200 font-bold">{cr.clicks.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">CTR</span>
                      <span className="text-emerald-400 font-bold">
                        {cr.impressions > 0 ? ((cr.clicks / cr.impressions) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(cr)}
                      title="Edit Creative"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCreative(cr.id)}
                      title="Delete Creative"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT CREATIVE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingCreative ? 'Edit Creative' : 'Create New Ad Creative'}
                </h3>
                <p className="text-xs text-slate-400">
                  Target slot: <span className="font-mono text-cyan-400 font-semibold">{formSlotId}</span> ({activeSlotDef.width}x{activeSlotDef.height} px)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name & Campaign */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Creative Title / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CloudScale Q3 Product Banner"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assign to Campaign
                  </label>
                  <select
                    value={formCampaignId}
                    onChange={(e) => setFormCampaignId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {campaigns.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name} ({camp.advertiser})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slot Selector & Dimension Info */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Inventory Slot
                </label>
                <select
                  value={formSlotId}
                  onChange={(e) => handleSlotChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {PREDEFINED_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.id} — {slot.name} ({slot.width}x{slot.height}px) [{slot.category}]
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-cyan-400">Enforced Dimensions:</span>
                  <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-200">
                    {activeSlotDef.width} &times; {activeSlotDef.height} px
                  </span>
                  <span>({activeSlotDef.description})</span>
                </div>
              </div>

              {/* Format Switcher (Image vs Video) */}
              {activeSlotDef.category === 'video' ? (
                <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl">
                  <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <Video className="w-4 h-4" /> Video Outstream / In-page Player Slot
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-300">Format:</span>
                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormFormatType('image')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        formFormatType === 'image' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Image Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFormatType('video')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        formFormatType === 'video' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Video Player
                    </button>
                  </div>
                </div>
              )}

              {/* VIDEO OPTIONS WITH RADIO TOGGLE: [YouTube | Direct MP4 | Embed Code] */}
              {formFormatType === 'video' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Select Video Delivery Format:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <label
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                        formVideoType === 'youtube'
                          ? 'bg-rose-950/40 border-rose-600 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="videoType"
                        value="youtube"
                        checked={formVideoType === 'youtube'}
                        onChange={() => setFormVideoType('youtube')}
                        className="sr-only"
                      />
                      <Youtube className="w-5 h-5 mb-1 text-rose-500" />
                      <span className="text-xs font-semibold">YouTube URL</span>
                    </label>

                    <label
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                        formVideoType === 'mp4'
                          ? 'bg-blue-950/40 border-blue-600 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="videoType"
                        value="mp4"
                        checked={formVideoType === 'mp4'}
                        onChange={() => setFormVideoType('mp4')}
                        className="sr-only"
                      />
                      <Video className="w-5 h-5 mb-1 text-blue-400" />
                      <span className="text-xs font-semibold">Direct MP4 / WebM</span>
                    </label>

                    <label
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                        formVideoType === 'embed'
                          ? 'bg-purple-950/40 border-purple-600 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="videoType"
                        value="embed"
                        checked={formVideoType === 'embed'}
                        onChange={() => setFormVideoType('embed')}
                        className="sr-only"
                      />
                      <Code className="w-5 h-5 mb-1 text-purple-400" />
                      <span className="text-xs font-semibold">Custom Embed Code</span>
                    </label>
                  </div>

                  {/* YouTube Input */}
                  {formVideoType === 'youtube' && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs text-slate-300 font-medium">YouTube Video URL</label>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formYoutubeUrl}
                        onChange={(e) => setFormYoutubeUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                      <p className="text-[11px] text-slate-500">
                        Auto-embeds with responsive container, muted autoplay, and unobtrusive controls.
                      </p>
                    </div>
                  )}

                  {/* Direct MP4 Input */}
                  {formVideoType === 'mp4' && (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs text-slate-300 font-medium">
                        Direct Video Stream URL (MP4 / WebM)
                      </label>
                      <input
                        type="text"
                        placeholder="https://cdn.example.com/videos/promo-30s.mp4"
                        value={formMediaUrl}
                        onChange={(e) => setFormMediaUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <div className="text-[11px] text-slate-500">Or upload local video asset:</div>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={handleFileUpload}
                        className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Custom Embed Code */}
                  {formVideoType === 'embed' && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs text-slate-300 font-medium">
                        Arbitrary iframe or Embed Snippet
                      </label>
                      <textarea
                        rows={3}
                        placeholder="<iframe src='...' width='100%' height='100%'></iframe>"
                        value={formEmbedCode}
                        onChange={(e) => setFormEmbedCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* IMAGE BANNER UPLOAD WITH STRICT CLIENT-SIDE DIMENSION VALIDATION */}
              {formFormatType === 'image' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Banner Graphic File (Strict Dimension Enforced)
                  </label>

                  <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/80 text-center hover:border-slate-600 transition-colors">
                    <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-80" />
                    <p className="text-xs text-slate-300 font-medium">
                      Select or drop banner asset ({activeSlotDef.width} &times; {activeSlotDef.height} px)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Accepts JPG, PNG, GIF, WebP. Strict pixel validation enforced client-side.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer border border-slate-700"
                    >
                      Browse Image File
                    </button>
                  </div>

                  {/* STRICT DIMENSION ERROR BANNER WITH AUTO-FIT RESCUE */}
                  {dimensionError && (
                    <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-600/50 text-amber-200 space-y-2">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs">Pixel Dimension Mismatch Detected!</span>
                          <p className="text-xs text-amber-300/90 mt-0.5">
                            Uploaded asset is{' '}
                            <strong className="font-mono text-white">
                              {dimensionError.actualWidth}&times;{dimensionError.actualHeight} px
                            </strong>
                            , but slot <strong className="text-white">{formSlotId}</strong> strictly requires{' '}
                            <strong className="font-mono text-emerald-300">
                              {dimensionError.requiredWidth}&times;{dimensionError.requiredHeight} px
                            </strong>
                            .
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAutoFitToSlot}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Auto-Crop &amp; Scale to {dimensionError.requiredWidth}&times;{dimensionError.requiredHeight} px</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDimensionError(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preview Banner */}
                  {formMediaUrl && !dimensionError && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Dimension Matched
                        </span>
                        <span className="text-slate-500 font-mono">
                          {activeSlotDef.width} &times; {activeSlotDef.height} px
                        </span>
                      </div>
                      <div className="max-h-40 overflow-hidden rounded-lg bg-slate-900 flex items-center justify-center p-2 border border-slate-800">
                        <img
                          src={formMediaUrl}
                          alt="Preview"
                          className="max-h-36 max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Target URL (Click Tracking Destination) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Destination URL (Redirect upon click)
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/landing-page"
                    value={formTargetUrl}
                    onChange={(e) => setFormTargetUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Clicks route through <code className="text-slate-400">/api/click/:creativeId</code> for verified click counting before 302 redirecting to this URL.
                </p>
              </div>

              {/* Weight & Rotation Settings */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    Rotation Weight: <span className="font-mono text-cyan-400">{formWeight}%</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Weighted probability when multiple creatives share this slot
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={formWeight}
                  onChange={(e) => setFormWeight(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Schedule Dates & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'paused')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="active">Active (Serving)</option>
                    <option value="paused">Paused (Halted)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {editingCreative ? 'Update Creative' : 'Save &amp; Deploy Creative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
