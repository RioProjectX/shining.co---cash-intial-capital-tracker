import React from 'react';
import {
  LayoutDashboard,
  Coins,
  Package,
  ShoppingBag,
  TrendingDown,
  ArrowDownRight,
  FileSpreadsheet,
  Settings,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab =
  | 'dashboard'
  | 'capital'
  | 'inventory'
  | 'sales'
  | 'expenses'
  | 'other-income'
  | 'reports'
  | 'settings';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, userProfile, logout } = useAuth();

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Ringkasan Bisnis', icon: LayoutDashboard },
    { id: 'sales', label: 'Penjualan Parfum', icon: ShoppingBag },
    { id: 'inventory', label: 'Manajemen Stok', icon: Package },
    { id: 'expenses', label: 'Biaya & Pengeluaran', icon: TrendingDown },
    { id: 'capital', label: 'Modal Usaha', icon: Coins },
    { id: 'other-income', label: 'Pemasukan Lain', icon: ArrowDownRight },
    { id: 'reports', label: 'Laporan Keuangan', icon: FileSpreadsheet },
    { id: 'settings', label: 'Pengaturan Bisnis', icon: Settings },
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#F6F4EE] border-r border-[#E5E1D8] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E5E1D8] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A]">
                shining.co
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#9E7D52]"></span>
            </div>
            <p className="font-serif italic text-xs text-[#7C776D] mt-0.5 tracking-wider">
              shine with just one spray
            </p>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#7C776D] hover:text-[#1A1A1A] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest uppercase text-[#8C887E]">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white shadow-xs font-semibold'
                    : 'text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FAF9F5]' : 'text-[#7C776D]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* PWA Download / Install App Section */}
        <PWAInstallButton variant="sidebar" />

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-[#E5E1D8] bg-[#EFECE4]/60">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-[#1A1A1A] truncate">
                {userProfile?.displayName || currentUser?.displayName || 'Pemilik Usaha'}
              </p>
              <p className="text-[11px] text-[#7C776D] truncate">
                {currentUser?.email || ''}
              </p>
            </div>
            <button
              onClick={() => logout()}
              title="Keluar"
              className="p-2 text-[#7C776D] hover:text-rose-700 hover:bg-[#E2DDD3] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
