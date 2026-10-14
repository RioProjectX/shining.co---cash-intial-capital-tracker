import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatIndonesianDate, formatRupiah, getTodayDateString } from '../lib/formatters';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  CircleDollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShoppingBag,
  Plus,
  Filter,
} from 'lucide-react';
import { Sale, Expense } from '../types';

interface Props {
  onQuickAction: (action: 'sale' | 'stock' | 'expense' | 'capital') => void;
  onNavigateToTab: (tab: any) => void;
}

type PeriodFilter = 'today' | '7days' | 'month' | 'all';

export const DashboardPage: React.FC<Props> = ({ onQuickAction, onNavigateToTab }) => {
  const {
    products,
    capitalTransactions,
    sales,
    salePayments,
    expenses,
    otherIncomes,
    summary,
    loading,
  } = useBusiness();

  const [period, setPeriod] = useState<PeriodFilter>('month');

  // Filter items by selected period
  const filterByDate = (dateStr: string) => {
    if (period === 'all') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();
    const todayStr = getTodayDateString();

    if (period === 'today') {
      return dateStr === todayStr;
    }

    if (period === '7days') {
      const diffTime = now.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays <= 7 && diffDays >= 0;
    }

    if (period === 'month') {
      return (
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      );
    }

    return true;
  };

  const filteredSales = useMemo(() => sales.filter((s) => !s.isCancelled && filterByDate(s.date)), [sales, period]);
  const filteredExpenses = useMemo(() => expenses.filter((e) => filterByDate(e.date)), [expenses, period]);
  const filteredOtherIncomes = useMemo(() => otherIncomes.filter((o) => filterByDate(o.date)), [otherIncomes, period]);
  const filteredCapital = useMemo(() => capitalTransactions.filter((c) => filterByDate(c.date)), [capitalTransactions, period]);

  // Periodic metrics
  const periodMetrics = useMemo(() => {
    const periodSalesCash = filteredSales.reduce((acc, s) => acc + (s.amountPaid || 0), 0);
    const periodOtherIncome = filteredOtherIncomes.reduce((acc, o) => acc + (o.amount || 0), 0);
    const periodTotalInflow = periodSalesCash + periodOtherIncome;

    const periodTotalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const periodStockExpenses = filteredExpenses
      .filter((e) => e.isStockPurchase || e.category === 'Pembelian stok parfum')
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const periodOperatingExpenses = periodTotalExpenses - periodStockExpenses;

    const periodSalesGross = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const periodCogs = filteredSales.reduce((acc, s) => acc + (s.cogs || 0), 0);
    const periodGrossProfit = periodSalesGross - periodCogs;
    const periodNetProfit = periodGrossProfit - periodOperatingExpenses;

    return {
      periodTotalInflow,
      periodTotalExpenses,
      periodGrossProfit,
      periodNetProfit,
      periodSalesCount: filteredSales.length,
    };
  }, [filteredSales, filteredExpenses, filteredOtherIncomes]);

  // Low stock alert products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStockAlert);
  }, [products]);

  // Recent activity stream (combined latest sales, expenses, and capital)
  const recentActivities = useMemo(() => {
    const combined: Array<{
      id: string;
      type: 'sale' | 'expense' | 'capital';
      title: string;
      subtitle: string;
      amount: number;
      date: string;
      badge: string;
    }> = [];

    sales.slice(0, 5).forEach((s) => {
      combined.push({
        id: s.id,
        type: 'sale',
        title: s.productName,
        subtitle: `Faktur #${s.invoiceNumber} • ${s.quantity} botol`,
        amount: s.totalAmount,
        date: s.date,
        badge: s.paymentStatus === 'lunas' ? 'Lunas' : 'Sebagian',
      });
    });

    expenses.slice(0, 5).forEach((e) => {
      combined.push({
        id: e.id,
        type: 'expense',
        title: e.description,
        subtitle: `Kategori: ${e.category}`,
        amount: -e.amount,
        date: e.date,
        badge: 'Pengeluaran',
      });
    });

    capitalTransactions.slice(0, 3).forEach((c) => {
      combined.push({
        id: c.id,
        type: 'capital',
        title: c.type === 'initial' ? 'Modal Awal Disetor' : 'Tambahan Modal',
        subtitle: `Sumber: ${c.source}`,
        amount: c.amount,
        date: c.date,
        badge: 'Ekuitas',
      });
    });

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
  }, [sales, expenses, capitalTransactions]);

  // Simple pure SVG/HTML chart data for last 7 days cash trend
  const dailyCashflowTrend = useMemo(() => {
    const days: Array<{ date: string; label: string; inflow: number; outflow: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      const daySalesIn = sales
        .filter((s) => !s.isCancelled && s.date === iso)
        .reduce((sum, s) => sum + (s.amountPaid || 0), 0);
      const dayOtherIn = otherIncomes
        .filter((o) => o.date === iso)
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      const dayExp = expenses
        .filter((e) => e.date === iso)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      days.push({
        date: iso,
        label,
        inflow: daySalesIn + dayOtherIn,
        outflow: dayExp,
      });
    }
    const maxVal = Math.max(
      1,
      ...days.map((d) => Math.max(d.inflow, d.outflow))
    );
    return { days, maxVal };
  }, [sales, otherIncomes, expenses]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Ikhtisar Keuangan & Inventaris
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
            Kondisi Bisnis Real-Time
          </h2>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#F3F0E8] p-1 rounded-lg border border-[#E5E1D8] text-xs self-start sm:self-auto">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'today'
                ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                : 'text-[#5A5751] hover:text-[#1A1A1A]'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === '7days'
                ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                : 'text-[#5A5751] hover:text-[#1A1A1A]'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'month'
                ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                : 'text-[#5A5751] hover:text-[#1A1A1A]'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'all'
                ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                : 'text-[#5A5751] hover:text-[#1A1A1A]'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Low Stock Alert if any */}
      {lowStockProducts.length > 0 && (
        <div className="bg-[#FAF3E8] border border-[#E6D4B8] rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-amber-950 text-sm">
              Peringatan Stok Menipis ({lowStockProducts.length} Varian Parfum)
            </h4>
            <p className="text-amber-900 mt-1 leading-relaxed">
              Varian berikut berada di bawah batas minimum:{' '}
              <span className="font-medium">
                {lowStockProducts
                  .map((p) => `${p.name} (sisa ${p.currentStock} botol)`)
                  .join(', ')}
              </span>
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onQuickAction('stock')}
                className="px-3 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg font-medium text-[11px] uppercase tracking-wider"
              >
                + Restock Sekarang
              </button>
              <button
                onClick={() => onNavigateToTab('inventory')}
                className="px-3 py-1.5 border border-[#D5C2A5] text-amber-950 hover:bg-[#F3E7D3] rounded-lg font-medium text-[11px] uppercase tracking-wider"
              >
                Buka Katalog Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 KEY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* 1. Modal Awal & Tambahan */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5 shadow-xs hover:border-[#D5D0C5] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-medium">
              1. Modal Usaha
            </span>
            <div className="p-2 bg-[#F3F0E8] rounded-lg text-[#1A1A1A]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1A1A] mt-3">
            {formatRupiah(summary.totalCapital)}
          </p>
          <div className="mt-2 text-xs text-[#7C776D] flex items-center justify-between">
            <span>{capitalTransactions.length} transaksi setoran modal</span>
            <button
              onClick={() => onNavigateToTab('capital')}
              className="text-[#1A1A1A] font-medium hover:underline text-[11px]"
            >
              Lihat Detail →
            </button>
          </div>
        </div>

        {/* 2. Total Pemasukan Terealisasi */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5 shadow-xs hover:border-[#D5D0C5] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-medium">
              2. Kas Masuk (Pemasukan)
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-800 mt-3">
            {formatRupiah(summary.totalCashReceived + summary.totalOtherIncome)}
          </p>
          <div className="mt-2 text-xs text-[#7C776D] flex items-center justify-between">
            <span>
              Penjualan: {formatRupiah(summary.totalCashReceived)}
            </span>
            {summary.totalAccountsReceivable > 0 && (
              <span className="text-amber-800 font-medium">
                Piutang: {formatRupiah(summary.totalAccountsReceivable)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Total Pengeluaran */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5 shadow-xs hover:border-[#D5D0C5] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-medium">
              3. Total Pengeluaran Kas
            </span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-800">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-rose-800 mt-3">
            {formatRupiah(summary.totalExpenses)}
          </p>
          <div className="mt-2 text-xs text-[#7C776D] flex items-center justify-between">
            <span>Operasional: {formatRupiah(summary.operationalExpenses)}</span>
            <span>Stok: {formatRupiah(summary.stockPurchaseExpenses)}</span>
          </div>
        </div>

        {/* 4. Saldo Kas Riil */}
        <div className="bg-[#1A1A1A] text-white rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-[#B5B0A4] font-medium">
              4. Saldo Kas Riil
            </span>
            <div className="p-2 bg-[#2E2C2A] rounded-lg text-[#EBE7DF]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-white mt-3">
            {formatRupiah(summary.realCashBalance)}
          </p>
          <p className="text-[11px] text-[#A6A094] mt-2">
            Kas terealisasi (Modal + Penerimaan Penjualan - Pengeluaran)
          </p>
        </div>

        {/* 5. Nilai Stok Saat Ini */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5 shadow-xs hover:border-[#D5D0C5] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-medium">
              5. Nilai Stok Persediaan
            </span>
            <div className="p-2 bg-[#F3F0E8] rounded-lg text-[#1A1A1A]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1A1A] mt-3">
            {formatRupiah(summary.inventoryValuation)}
          </p>
          <div className="mt-2 text-xs text-[#7C776D] flex items-center justify-between">
            <span>
              Total {products.reduce((acc, p) => acc + (p.currentStock || 0), 0)} botol tersedia
            </span>
            <button
              onClick={() => onNavigateToTab('inventory')}
              className="text-[#1A1A1A] font-medium hover:underline text-[11px]"
            >
              Kelola Stok →
            </button>
          </div>
        </div>

        {/* 6. Laba / Rugi Bersih */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5 shadow-xs hover:border-[#D5D0C5] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-medium">
              6. Estimasi Laba Bersih
            </span>
            <div className="p-2 bg-[#F3F0E8] rounded-lg text-[#1A1A1A]">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`font-serif text-2xl font-bold mt-3 ${
              summary.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {formatRupiah(summary.netProfit)}
          </p>
          <div className="mt-2 text-xs text-[#7C776D] flex items-center justify-between">
            <span>Laba Kotor: {formatRupiah(summary.grossProfit)}</span>
            <span>Beban: {formatRupiah(summary.operationalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* CHARTS & RECENT ACTIVITY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cashflow Trend Chart */}
        <div className="lg:col-span-2 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
                Tren Arus Kas 7 Hari Terakhir
              </h3>
              <p className="text-xs text-[#7C776D]">
                Perbandingan kas masuk dari penjualan vs pengeluaran harian
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#1A1A1A]"></span>
                <span className="text-[#5A5751]">Kas Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#C5A880]"></span>
                <span className="text-[#5A5751]">Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4 h-56 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {dailyCashflowTrend.days.map((item, idx) => {
              const inHeightPct = Math.min(100, (item.inflow / dailyCashflowTrend.maxVal) * 100);
              const outHeightPct = Math.min(100, (item.outflow / dailyCashflowTrend.maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    {/* Inflow bar */}
                    <div
                      style={{ height: `${Math.max(4, inHeightPct)}%` }}
                      className="w-1/2 max-w-[20px] bg-[#1A1A1A] rounded-t-sm transition-all group-hover:opacity-80 relative"
                      title={`Kas Masuk: ${formatRupiah(item.inflow)}`}
                    ></div>
                    {/* Outflow bar */}
                    <div
                      style={{ height: `${Math.max(4, outHeightPct)}%` }}
                      className="w-1/2 max-w-[20px] bg-[#C5A880] rounded-t-sm transition-all group-hover:opacity-80 relative"
                      title={`Pengeluaran: ${formatRupiah(item.outflow)}`}
                    ></div>
                  </div>
                  <span className="text-[10px] text-[#7C776D] font-medium text-center truncate w-full">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E5E1D8] flex items-center justify-between text-xs text-[#7C776D]">
            <span>Filter saat ini: <strong className="text-[#1A1A1A]">{period.toUpperCase()}</strong></span>
            <span>
              Penjualan periode: <strong className="text-[#1A1A1A]">{periodMetrics.periodSalesCount} transaksi</strong>
            </span>
          </div>
        </div>

        {/* Right 1 Col: Recent Transactions Stream */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              Aktivitas Terbaru
            </h3>
            <span className="text-xs text-[#7C776D]">Real-Time</span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8C887E] space-y-2">
              <Clock className="w-6 h-6 mx-auto opacity-40" />
              <p>Belum ada transaksi tercatat</p>
              <button
                onClick={() => onQuickAction('sale')}
                className="mt-2 text-xs font-medium text-[#1A1A1A] underline"
              >
                + Mulai catat penjualan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={`${act.type}-${act.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F3F0E8] transition-colors text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-[#1A1A1A] truncate">{act.title}</p>
                    <p className="text-[11px] text-[#7C776D] truncate">{act.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-semibold block ${
                        act.amount >= 0 ? 'text-emerald-800' : 'text-rose-800'
                      }`}
                    >
                      {formatRupiah(act.amount)}
                    </span>
                    <span className="text-[10px] text-[#8C887E]">
                      {formatIndonesianDate(act.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
