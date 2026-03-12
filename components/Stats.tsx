'use client';

import { ArrowUpRight, Users } from 'lucide-react';

interface StatsProps {
  totalLeads: number;
  todaysLeads: number;
}

export function Stats({ totalLeads, todaysLeads }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-500 font-medium text-sm">Overall Leads Captured</h3>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold text-gray-900 tracking-tight">{totalLeads.toLocaleString()}</span>
          <span className="flex items-center text-emerald-600 text-sm font-medium mb-1 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            12%
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-500 font-medium text-sm">Today&apos;s Leads</h3>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold text-gray-900 tracking-tight">{todaysLeads.toLocaleString()}</span>
          <span className="flex items-center text-emerald-600 text-sm font-medium mb-1 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            4%
          </span>
        </div>
      </div>
    </div>
  );
}
