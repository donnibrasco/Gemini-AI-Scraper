import React from 'react';
import { Lead } from '../types';
import { ExternalLink, Star, MapPin, Phone, Globe } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
}

const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  if (leads.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-800/50 shadow-xl backdrop-blur-sm mt-8">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/50 text-xs uppercase text-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Score</th>
              <th className="px-6 py-4 font-semibold">Company</th>
              <th className="px-6 py-4 font-semibold">Contact</th>
              <th className="px-6 py-4 font-semibold">Category/Desc</th>
              <th className="px-6 py-4 font-semibold">Address</th>
              <th className="px-6 py-4 font-semibold">Socials</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {leads.map((lead) => (
              <tr key={lead["Lead Number"]} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      lead["Quality Score"] >= 80 
                        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' 
                        : lead["Quality Score"] >= 50
                        ? 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 ring-red-500/20'
                    }`}>
                      {lead["Quality Score"]}
                    </span>
                    <span className="text-[10px] text-slate-500 text-center max-w-[100px] leading-tight">
                      {lead["Quality Reasoning"]}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-white text-base">{lead["Company Name"]}</div>
                  <div className="flex items-center gap-1 text-yellow-500 mt-1">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs">{lead["Rating"]} ({lead["Review Count"]})</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {lead["Phone"] && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone size={12} />
                        <span>{lead["Phone"]}</span>
                      </div>
                    )}
                    {lead["Website"] && (
                      <a href={lead["Website"]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 truncate max-w-[150px]">
                        <Globe size={12} />
                        <span className="truncate">{new URL(lead["Website"]).hostname}</span>
                      </a>
                    )}
                    {lead["Email"] && (
                      <div className="text-xs text-slate-400">{lead["Email"]}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="text-slate-200 font-medium mb-1">{lead["Category"]}</div>
                  <div className="text-xs text-slate-500 line-clamp-2" title={lead["Description"]}>
                    {lead["Description"]}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-slate-500" />
                    <span className="text-xs leading-relaxed">{lead["Address"]}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">{lead["City"]}, {lead["Country"]}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {lead["LinkedIn"] && <a href={lead["LinkedIn"]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400" title="LinkedIn"><ExternalLink size={14} /></a>}
                    {lead["Facebook"] && <a href={lead["Facebook"]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500" title="Facebook"><ExternalLink size={14} /></a>}
                    {lead["Instagram"] && <a href={lead["Instagram"]} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400" title="Instagram"><ExternalLink size={14} /></a>}
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