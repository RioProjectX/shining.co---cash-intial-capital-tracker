import React from 'react';
import { Menu, Plus, ShoppingBag, Package, TrendingDown, Coins } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';
import { PWAInstallButton } from './PWAInstallButton';
import { useBusiness } from '../context/BusinessContext';

interface Props {
  title: string;
  onOpenMobile: () => void;
  onQuickAction: (action: 'sale' | 'stock' | 'expense' | 'capital') => void;
}

export const Navbar: React.FC<Props> = ({ title, onOpenMobile, onQuickAction }) => {
  const { syncStatus, lastSyncTime } = useBusiness();

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#E5E1D8] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile menu & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-lg"
          aria-label="Buka navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-lg sm:text-xl font-bold text-[#1A1A1A] tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: PWA Install, Sync Badge & Quick Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <PWAInstallButton variant="navbar" />
        <SyncStatusBadge status={syncStatus} lastSyncTime={lastSyncTime} />

        {/* Quick Actions Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => onQuickAction('sale')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-medium rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Penjualan</span>
          </button>
          <button
            onClick={() => onQuickAction('stock')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBE7DF] text-[#1A1A1A] hover:bg-[#E0DBD0] text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Stok</span>
          </button>
          <button
            onClick={() => onQuickAction('expense')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBE7DF] text-[#1A1A1A] hover:bg-[#E0DBD0] text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Pengeluaran</span>
          </button>
          <button
            onClick={() => onQuickAction('capital')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBE7DF] text-[#1A1A1A] hover:bg-[#E0DBD0] text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Modal</span>
          </button>
        </div>

        {/* Quick Action Mobile Trigger */}
        <div className="md:hidden">
          <button
            onClick={() => onQuickAction('sale')}
            className="flex items-center gap-1 p-2 bg-[#1A1A1A] text-white rounded-lg text-xs"
            title="Tambah Penjualan Cepat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
