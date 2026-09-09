import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FolderKanban, DollarSign, Calendar, CheckCircle2, PauseCircle } from 'lucide-react';
import { Campaign, Creative } from '../types.js';

interface CampaignsViewProps {
  campaigns: Campaign[];
  creatives: Creative[];
  onSaveCampaign: (campaign: Partial<Campaign>, isNew: boolean) => Promise<void>;
  onDeleteCampaign: (id: string) => Promise<void>;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  creatives,
  onSaveCampaign,
  onDeleteCampaign,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Campaign | null>(null);

  const [name, setName] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [budget, setBudget] = useState(5000);
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>('active');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  const handleOpenNew = () => {
    setEditingCamp(null);
    setName('');
    setAdvertiser('');
    setBudget(5000);
    setStatus('active');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (camp: Campaign) => {
    setEditingCamp(camp);
    setName(camp.name);
    setAdvertiser(camp.advertiser);
    setBudget(camp.budget);
    setStatus(camp.status);
    setStartDate(camp.startDate ? camp.startDate.slice(0, 10) : '');
    setEndDate(camp.endDate ? camp.endDate.slice(0, 10) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveCampaign(
      {
        ...(editingCamp ? { id: editingCamp.id } : {}),
        name,
        advertiser,
        budget: Number(budget),
        status,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      },
      !editingCamp
    );
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-400" />
            Campaign Management
          </h2>
          <p className="text-xs text-slate-400">
            Organize advertising clients, flight dates, budget caps, and aggregate campaign ROI.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Campaign &amp; Client</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Flight Dates</th>
                <th className="py-3.5 px-4 text-right">Budget</th>
                <th className="py-3.5 px-4 text-center">Creatives</th>
                <th className="py-3.5 px-4 text-right">Impressions</th>
                <th className="py-3.5 px-4 text-right">Clicks</th>
                <th className="py-3.5 px-4 text-right">CTR</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {campaigns.map((camp) => {
                const campCreatives = creatives.filter((c) => c.campaignId === camp.id);
                const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : '0.00';

                return (
                  <tr key={camp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{camp.name}</div>
                      <div className="text-[11px] text-slate-400">{camp.advertiser}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {camp.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <PauseCircle className="w-3 h-3 mr-1" /> {camp.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-mono text-slate-400">
                      <div>{camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'N/A'}</div>
                      <div className="text-slate-500">to {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-200 whitespace-nowrap">
                      ${camp.budget.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-slate-800 text-cyan-400 border border-slate-700">
                        {campCreatives.length}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                      {camp.impressions.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                      {camp.clicks.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                      {ctr}%
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(camp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Campaign"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCampaign(camp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingCamp ? 'Edit Campaign' : 'Create New Campaign'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Brand Awareness"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Advertiser / Agency
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Media Corp"
                  value={advertiser}
                  onChange={(e) => setAdvertiser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Flight
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Flight
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  {editingCamp ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
