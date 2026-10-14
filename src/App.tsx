import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { QuickActionModal } from './components/QuickActionModal';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CapitalPage } from './pages/CapitalPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { OtherIncomePage } from './pages/OtherIncomePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Sparkles } from 'lucide-react';

const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'Ringkasan Bisnis',
  capital: 'Modal Usaha',
  inventory: 'Manajemen Stok Parfum',
  sales: 'Penjualan Parfum',
  expenses: 'Biaya & Pengeluaran',
  'other-income': 'Pemasukan Lainnya',
  reports: 'Laporan Keuangan',
  settings: 'Pengaturan Bisnis',
};

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<'sale' | 'stock' | 'expense' | 'capital' | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-serif text-3xl font-bold tracking-tight text-[#1A1A1A]">
            shining.co
          </span>
          <span className="w-2 h-2 rounded-full bg-[#9E7D52] animate-ping"></span>
        </div>
        <p className="font-serif italic text-xs tracking-widest text-[#7C776D]">
          shine with just one spray
        </p>
        <div className="w-16 h-0.5 bg-[#E5E1D8] overflow-hidden rounded-full mt-4">
          <div className="w-full h-full bg-[#1A1A1A] animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1A1A1A] flex flex-col lg:flex-row font-sans selection:bg-[#EBE7DF]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <Navbar
          title={TAB_TITLES[currentTab]}
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onQuickAction={(action) => setQuickAction(action)}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onQuickAction={(action) => setQuickAction(action)}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
            />
          )}
          {currentTab === 'capital' && <CapitalPage />}
          {currentTab === 'inventory' && <InventoryPage />}
          {currentTab === 'sales' && (
            <SalesPage onOpenNewSaleModal={() => setQuickAction('sale')} />
          )}
          {currentTab === 'expenses' && <ExpensesPage />}
          {currentTab === 'other-income' && <OtherIncomePage />}
          {currentTab === 'reports' && <ReportsPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal
        action={quickAction}
        onClose={() => setQuickAction(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <MainApp />
      </BusinessProvider>
    </AuthProvider>
  );
}
