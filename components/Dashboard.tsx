import React from 'react';
import { DashboardStats } from '../types';
import { 
  Inbox, 
  SprayCan, 
  Palette, 
  Package, 
  Clock, 
  Truck 
} from 'lucide-react';

interface StatCardProps {
  label: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, total, icon, colorClass }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline mt-1 space-x-1.5 sm:space-x-2">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{count}</h3>
          <span className="text-xs text-slate-400">({percentage}%)</span>
        </div>
      </div>
      <div className={`p-2 sm:p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};

interface DashboardProps {
  stats: DashboardStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
      <StatCard 
        label="입고" 
        count={stats.received} 
        total={stats.total}
        icon={<Inbox className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
        colorClass="bg-blue-50"
      />
      <StatCard 
        label="블라스팅" 
        count={stats.blasting} 
        total={stats.total}
        icon={<SprayCan className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
        colorClass="bg-orange-50"
      />
      <StatCard 
        label="도장" 
        count={stats.painting} 
        total={stats.total}
        icon={<Palette className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
        colorClass="bg-purple-50"
      />
      <StatCard 
        label="포장" 
        count={stats.packing} 
        total={stats.total}
        icon={<Package className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />}
        colorClass="bg-amber-50"
      />
      <StatCard 
        label="출하대기" 
        count={stats.waiting} 
        total={stats.total}
        icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />}
        colorClass="bg-teal-50"
      />
      <StatCard 
        label="출하완료" 
        count={stats.shipped} 
        total={stats.total}
        icon={<Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />}
        colorClass="bg-emerald-50"
      />
    </div>
  );
};
