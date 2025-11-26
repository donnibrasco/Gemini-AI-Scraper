import React from 'react';
import { Lead } from '../types';
import { ExternalLink, Star, MapPin, Phone, Globe } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
}

const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  if (leads.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/10">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/80 text-xs uppercase text-slate-200 border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-4 font-bold">Score</th>
              <th className="px-6 py-4 font-bold">Company</th>
              <th className="px-6 py-4 font-bold">Contact</th>
              <th className="px-6 py-4 font-bold">Category/Desc</th>
              <th className="px-6 py-4 font-bold">Address</th>
              <th className="px-6 py-4 font-bold">Socials</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {leads.map((lead) => (
              <tr key={lead["Lead Number"]} className="hover:bg-slate-700/40 transition-all duration-200 group">
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold ring-2 ring-inset shadow-lg ${
                      lead["Quality Score"] >= 80 
                        ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40 shadow-emerald-500/20' 
                        : lead["Quality Score"] >= 50
                        ? 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/40 shadow-yellow-500/20'
                        : 'bg-red-500/20 text-red-300 ring-red-500/40 shadow-red-500/20'
                    }`}>
                      {lead["Quality Score"]}
                    </span>
                    <span className="text-[10px] text-slate-500 text-center max-w-[100px] leading-tight">
                      {lead["Quality Reasoning"]}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-white text-base group-hover:text-emerald-400 transition-colors">{lead["Company Name"]}</div>
                  <div className="flex items-center gap-1 text-yellow-400 mt-1">
                    <Star size={13} fill="currentColor" />
                    <span className="text-xs font-medium">{lead["Rating"]} ({lead["Review Count"]})</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    {lead["Phone"] && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone size={13} className="text-emerald-400" />
                        <span className="font-medium">{lead["Phone"]}</span>
                      </div>
                    )}
                    {lead["Website"] && (
                      <a href={lead["Website"]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 truncate max-w-[180px] transition-colors">
                        <Globe size={13} />
                        <span className="truncate font-medium">{new URL(lead["Website"]).hostname}</span>
                      </a>
                    )}
                    {lead["Email"] && (
                      <div className="text-xs text-slate-400 font-medium">{lead["Email"]}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="text-slate-100 font-semibold mb-1.5">{lead["Category"]}</div>
                  <div className="text-xs text-slate-500 line-clamp-2" title={lead["Description"]}>
                    {lead["Description"]}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span className="text-xs leading-relaxed">{lead["Address"]}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 font-medium">{lead["City"]}, {lead["Country"]}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {lead["LinkedIn"] && <a href={lead["LinkedIn"]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500/10 rounded" title="LinkedIn"><ExternalLink size={16} /></a>}
                    {lead["Facebook"] && <a href={lead["Facebook"]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors p-1 hover:bg-blue-500/10 rounded" title="Facebook"><ExternalLink size={16} /></a>}
                    {lead["Instagram"] && <a href={lead["Instagram"]} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 transition-colors p-1 hover:bg-pink-500/10 rounded" title="Instagram"><ExternalLink size={16} /></a>}
                    {!lead["LinkedIn"] && !lead["Facebook"] && !lead["Instagram"] && <span className="text-slate-600 text-xs">-</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTable;