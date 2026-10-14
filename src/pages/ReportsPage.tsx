import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  formatIndonesianDate,
  formatRupiah,
  exportToCSV,
  getTodayDateString,
} from '../lib/formatters';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Coins,
  Package,
  Layers,
  CheckCircle,
} from 'lucide-react';

type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export const ReportsPage: React.FC = () => {
  const {
    products,
    capitalTransactions,
    sales,
    salePayments,
    expenses,
    otherIncomes,
    summary,
  } = useBusiness();

  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [activeReportTab, setActiveReportTab] = useState<'income' | 'cashflow' | 'products'>('income');

  // Filter helper
  const isDateInPeriod = (dateStr: string) => {
    const itemDate = new Date(dateStr);
    const now = new Date();
    const todayStr = getTodayDateString();

    if (period === 'today') {
      return dateStr === todayStr;
    }
    if (period === 'week') {
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
    if (period === 'year') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    if (period === 'custom') {
      return dateStr >= startDate && dateStr <= endDate;
    }
    return true;
  };

  // Filtered datasets for the chosen period
  const periodSales = useMemo(() => sales.filter((s) => !s.isCancelled && isDateInPeriod(s.date)), [sales, period, startDate, endDate]);
  const periodExpenses = useMemo(() => expenses.filter((e) => isDateInPeriod(e.date)), [expenses, period, startDate, endDate]);
  const periodOtherIncome = useMemo(() => otherIncomes.filter((o) => isDateInPeriod(o.date)), [otherIncomes, period, startDate, endDate]);
  const periodCapital = useMemo(() => capitalTransactions.filter((c) => isDateInPeriod(c.date)), [capitalTransactions, period, startDate, endDate]);

  // Income Statement (Laba Rugi) Calculations
  const incomeStatement = useMemo(() => {
    const totalGrossSales = periodSales.reduce((acc, s) => acc + (s.totalAmount + s.discount - s.extraCost), 0);
    const totalDiscounts = periodSales.reduce((acc, s) => acc + s.discount, 0);
    const netSales = periodSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const cogs = periodSales.reduce((acc, s) => acc + s.cogs, 0);
    const grossProfit = netSales - cogs;
    const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    const stockPurchases = periodExpenses
      .filter((e) => e.isStockPurchase || e.category === 'Pembelian stok parfum')
      .reduce((acc, e) => acc + e.amount, 0);

    const operationalExpenses = periodExpenses
      .filter((e) => !e.isStockPurchase && e.category !== 'Pembelian stok parfum')
      .reduce((acc, e) => acc + e.amount, 0);

    const netProfit = grossProfit - operationalExpenses;
    const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    return {
      totalGrossSales,
      totalDiscounts,
      netSales,
      cogs,
      grossProfit,
      grossMarginPct,
      operationalExpenses,
      netProfit,
      netMarginPct,
      stockPurchases,
    };
  }, [periodSales, periodExpenses]);

  // Cashflow Statement Calculations
  const cashflowStatement = useMemo(() => {
    const capitalIn = periodCapital.reduce((acc, c) => acc + c.amount, 0);
    const salesCashIn = periodSales.reduce((acc, s) => acc + s.amountPaid, 0);
    const otherIn = periodOtherIncome.reduce((acc, o) => acc + o.amount, 0);
    const totalCashIn = capitalIn + salesCashIn + otherIn;

    const totalCashOut = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netCashflow = totalCashIn - totalCashOut;

    return {
      capitalIn,
      salesCashIn,
      otherIn,
      totalCashIn,
      totalCashOut,
      netCashflow,
    };
  }, [periodCapital, periodSales, periodOtherIncome, periodExpenses]);

  // Sales per product performance
  const productPerformance = useMemo(() => {
    const map = new Map<string, { name: string; qtySold: number; totalSales: number; totalProfit: number }>();

    periodSales.forEach((s) => {
      const existing = map.get(s.productId) || {
        name: s.productName,
        qtySold: 0,
        totalSales: 0,
        totalProfit: 0,
      };
      existing.qtySold += s.quantity;
      existing.totalSales += s.totalAmount;
      existing.totalProfit += s.grossProfit;
      map.set(s.productId, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [periodSales]);

  // Export handlers
  const handleExportSalesCSV = () => {
    const headers = ['No Faktur', 'Tanggal', 'Produk', 'Jumlah', 'Harga Satuan', 'Diskon', 'Total', 'Kas Diterima', 'Sisa Piutang', 'Metode Bayar', 'Status Bayar', 'Pelanggan'];
    const rows = sales.map((s) => [
      s.invoiceNumber,
      s.date,
      s.productName,
      s.quantity,
      s.unitPrice,
      s.discount,
      s.totalAmount,
      s.amountPaid,
      s.remainingBalance,
      s.paymentMethod,
      s.isCancelled ? 'Dibatalkan' : s.paymentStatus,
      s.customerName || '-',
    ]);
    exportToCSV(`shining_co_penjualan_${getTodayDateString()}`, headers, rows);
  };

  const handleExportInventoryCSV = () => {
    const headers = ['SKU', 'Nama Parfum', 'Kategori', 'Ukuran ml', 'Modal per Botol', 'Harga Jual', 'Stok Tersedia', 'Nilai Persediaan', 'Batas Minimum'];
    const rows = products.map((p) => [
      p.sku,
      p.name,
      p.category || 'Eau de Parfum',
      p.bottleSizeMl,
      p.costPrice,
      p.sellingPrice,
      p.currentStock,
      p.currentStock * p.costPrice,
      p.minStockAlert,
    ]);
    exportToCSV(`shining_co_stok_${getTodayDateString()}`, headers, rows);
  };

  const handleExportExpensesCSV = () => {
    const headers = ['Tanggal', 'Kategori', 'Deskripsi', 'Metode Bayar', 'Nominal', 'No Referensi'];
    const rows = expenses.map((e) => [
      e.date,
      e.category,
      e.description,
      e.paymentMethod,
      e.amount,
      e.receiptRef || '-',
    ]);
    exportToCSV(`shining_co_pengeluaran_${getTodayDateString()}`, headers, rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Transparansi & Pembukuan
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
            Laporan Keuangan shining.co
          </h2>
          <p className="text-xs text-[#7C776D] mt-1">
            Laporan laba rugi, mutasi arus kas terealisasi, dan ekspor data pembukuan ke CSV/Excel.
          </p>
        </div>

        {/* CSV Export Dropdown / Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSalesCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF9F5] border border-[#D5D0C5] text-[#1A1A1A] hover:bg-[#EBE7DF] text-xs font-medium rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#9E7D52]" />
            <span>Ekspor Penjualan</span>
          </button>
          <button
            onClick={handleExportInventoryCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF9F5] border border-[#D5D0C5] text-[#1A1A1A] hover:bg-[#EBE7DF] text-xs font-medium rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#9E7D52]" />
            <span>Ekspor Stok</span>
          </button>
          <button
            onClick={handleExportExpensesCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF9F5] border border-[#D5D0C5] text-[#1A1A1A] hover:bg-[#EBE7DF] text-xs font-medium rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#9E7D52]" />
            <span>Ekspor Biaya</span>
          </button>
        </div>
      </div>

      {/* Period Selection Controls */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#7C776D] font-medium">Periode Laporan:</span>
          <div className="flex gap-1 bg-[#F3F0E8] p-1 rounded-lg border border-[#E5E1D8]">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1 rounded-md transition-colors ${
                period === 'today' ? 'bg-[#1A1A1A] text-white font-medium' : 'text-[#5A5751]'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 rounded-md transition-colors ${
                period === 'week' ? 'bg-[#1A1A1A] text-white font-medium' : 'text-[#5A5751]'
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-md transition-colors ${
                period === 'month' ? 'bg-[#1A1A1A] text-white font-medium' : 'text-[#5A5751]'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1 rounded-md transition-colors ${
                period === 'year' ? 'bg-[#1A1A1A] text-white font-medium' : 'text-[#5A5751]'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1 rounded-md transition-colors ${
                period === 'custom' ? 'bg-[#1A1A1A] text-white font-medium' : 'text-[#5A5751]'
              }`}
            >
              Kustom
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-2.5 py-1 text-xs"
            />
            <span className="text-[#7C776D]">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-2.5 py-1 text-xs"
            />
          </div>
        )}
      </div>

      {/* Report View Tabs */}
      <div className="flex gap-2 border-b border-[#E5E1D8] text-xs font-semibold">
        <button
          onClick={() => setActiveReportTab('income')}
          className={`pb-3 px-3 border-b-2 transition-all ${
            activeReportTab === 'income'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-transparent text-[#7C776D] hover:text-[#1A1A1A]'
          }`}
        >
          Laporan Laba Rugi (Income Statement)
        </button>
        <button
          onClick={() => setActiveReportTab('cashflow')}
          className={`pb-3 px-3 border-b-2 transition-all ${
            activeReportTab === 'cashflow'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-transparent text-[#7C776D] hover:text-[#1A1A1A]'
          }`}
        >
          Laporan Arus Kas (Cash Flow)
        </button>
        <button
          onClick={() => setActiveReportTab('products')}
          className={`pb-3 px-3 border-b-2 transition-all ${
            activeReportTab === 'products'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-transparent text-[#7C776D] hover:text-[#1A1A1A]'
          }`}
        >
          Performa Penjualan per Varian
        </button>
      </div>

      {/* 1. INCOME STATEMENT */}
      {activeReportTab === 'income' && (
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-[#E5E1D8] pb-4">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Laporan Laba / Rugi Komprehensif
            </h3>
            <p className="text-xs text-[#7C776D]">
              Format akuntansi resmi memisahkan Penjualan Bersih, HPP, Laba Kotor, dan Biaya Operasional.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Penjualan */}
            <div className="space-y-2">
              <div className="flex justify-between font-semibold text-sm text-[#1A1A1A]">
                <span>1. PENDAPATAN PENJUALAN</span>
                <span>{formatRupiah(incomeStatement.netSales)}</span>
              </div>
              <div className="pl-4 space-y-1 text-[#5A5751]">
                <div className="flex justify-between">
                  <span>Penjualan Bruto ({periodSales.length} transaksi)</span>
                  <span>{formatRupiah(incomeStatement.totalGrossSales)}</span>
                </div>
                {incomeStatement.totalDiscounts > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Diskon Penjualan Diberikan</span>
                    <span>-{formatRupiah(incomeStatement.totalDiscounts)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-[#1A1A1A] pt-1 border-t border-[#E5E1D8]">
                  <span>Total Penjualan Bersih</span>
                  <span>{formatRupiah(incomeStatement.netSales)}</span>
                </div>
              </div>
            </div>

            {/* 2. HPP */}
            <div className="space-y-2 pt-2 border-t border-[#E5E1D8]">
              <div className="flex justify-between font-semibold text-sm text-[#1A1A1A]">
                <span>2. HARGA POKOK PENJUALAN (HPP)</span>
                <span className="text-rose-800">-{formatRupiah(incomeStatement.cogs)}</span>
              </div>
              <div className="pl-4 text-[#5A5751]">
                <div className="flex justify-between">
                  <span>Biaya Bahan/Pokok Botol Terjual</span>
                  <span>{formatRupiah(incomeStatement.cogs)}</span>
                </div>
              </div>
            </div>

            {/* 3. Laba Kotor */}
            <div className="bg-[#F3F0E8] p-3 rounded-lg flex justify-between items-center text-sm font-bold text-[#1A1A1A] border border-[#E5E1D8]">
              <div>
                <span>LABA KOTOR (GROSS PROFIT)</span>
                <span className="block text-[11px] font-normal text-[#7C776D]">
                  Margin Laba Kotor: {incomeStatement.grossMarginPct.toFixed(1)}%
                </span>
              </div>
              <span className="font-serif text-base text-emerald-800">
                {formatRupiah(incomeStatement.grossProfit)}
              </span>
            </div>

            {/* 4. Beban Operasional */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between font-semibold text-sm text-[#1A1A1A]">
                <span>3. BIAYA OPERASIONAL & BEBAN USAHA</span>
                <span className="text-rose-800">-{formatRupiah(incomeStatement.operationalExpenses)}</span>
              </div>
              <div className="pl-4 space-y-1 text-[#5A5751]">
                {periodExpenses
                  .filter((e) => !e.isStockPurchase && e.category !== 'Pembelian stok parfum')
                  .map((e) => (
                    <div key={e.id} className="flex justify-between">
                      <span>{e.category} — {e.description}</span>
                      <span>{formatRupiah(e.amount)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 5. Laba Bersih */}
            <div className="bg-[#1A1A1A] text-white p-4 rounded-xl flex justify-between items-center text-sm font-bold shadow-md">
              <div>
                <span className="tracking-wide">LABA / (RUGI) BERSIH</span>
                <span className="block text-[11px] font-normal text-[#A6A094]">
                  Margin Bersih: {incomeStatement.netMarginPct.toFixed(1)}%
                </span>
              </div>
              <span
                className={`font-serif text-xl ${
                  incomeStatement.netProfit >= 0 ? 'text-[#EBE7DF]' : 'text-rose-400'
                }`}
              >
                {formatRupiah(incomeStatement.netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. CASHFLOW STATEMENT */}
      {activeReportTab === 'cashflow' && (
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-[#E5E1D8] pb-4">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Laporan Arus Kas Terealisasi (Cash Flow)
            </h3>
            <p className="text-xs text-[#7C776D]">
              Menghitung pergerakan uang tunai dan transfer masuk-keluar secara riil.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Kas Masuk */}
            <div className="space-y-2">
              <div className="flex justify-between font-semibold text-sm text-[#1A1A1A]">
                <span>ARUS KAS MASUK (INFLOW)</span>
                <span className="text-emerald-800">+{formatRupiah(cashflowStatement.totalCashIn)}</span>
              </div>
              <div className="pl-4 space-y-1 text-[#5A5751]">
                <div className="flex justify-between">
                  <span>Penerimaan Kas dari Penjualan</span>
                  <span>{formatRupiah(cashflowStatement.salesCashIn)}</span>
                </div>
                {cashflowStatement.capitalIn > 0 && (
                  <div className="flex justify-between">
                    <span>Setoran Modal (Pemilik / Investor)</span>
                    <span>{formatRupiah(cashflowStatement.capitalIn)}</span>
                  </div>
                )}
                {cashflowStatement.otherIn > 0 && (
                  <div className="flex justify-between">
                    <span>Pemasukan Lainnya / Cashback</span>
                    <span>{formatRupiah(cashflowStatement.otherIn)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Kas Keluar */}
            <div className="space-y-2 pt-2 border-t border-[#E5E1D8]">
              <div className="flex justify-between font-semibold text-sm text-[#1A1A1A]">
                <span>ARUS KAS KELUAR (OUTFLOW)</span>
                <span className="text-rose-800">-{formatRupiah(cashflowStatement.totalCashOut)}</span>
              </div>
              <div className="pl-4 space-y-1 text-[#5A5751]">
                <div className="flex justify-between">
                  <span>Total Pengeluaran Kas Periode Ini</span>
                  <span>{formatRupiah(cashflowStatement.totalCashOut)}</span>
                </div>
              </div>
            </div>

            {/* Arus Kas Bersih */}
            <div className="bg-[#F3F0E8] p-3 rounded-lg flex justify-between items-center text-sm font-bold text-[#1A1A1A] border border-[#E5E1D8]">
              <span>ARUS KAS BERSIH PERIODE INI</span>
              <span
                className={`font-serif text-base ${
                  cashflowStatement.netCashflow >= 0 ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {formatRupiah(cashflowStatement.netCashflow)}
              </span>
            </div>

            {/* Saldo Akhir Kas */}
            <div className="bg-[#1A1A1A] text-white p-4 rounded-xl flex justify-between items-center text-sm font-bold shadow-md">
              <div>
                <span>SALDO KAS SAAT INI (AKUMULATIF)</span>
                <span className="block text-[11px] font-normal text-[#A6A094]">
                  Kas siap pakai di rekening / dompet usaha
                </span>
              </div>
              <span className="font-serif text-xl text-white">
                {formatRupiah(summary.realCashBalance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCT PERFORMANCE */}
      {activeReportTab === 'products' && (
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-[#E5E1D8]">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              Peringkat Penjualan & Laba per Varian Parfum
            </h3>
            <p className="text-xs text-[#7C776D]">
              Mengetahui parfum best-seller dan kontribusi margin terhadap bisnis.
            </p>
          </div>

          {productPerformance.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#8C887E]">
              <Package className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p>Belum ada transaksi penjualan pada periode ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3F0E8] border-b border-[#E5E1D8] text-[#5A5751]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nama Varian Parfum</th>
                    <th className="py-3 px-4 font-semibold text-center">Unit Terjual</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Penjualan</th>
                    <th className="py-3 px-4 font-semibold text-right">Kontribusi Laba Kotor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  {productPerformance.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-[#F7F5EF] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">
                        {prod.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#1A1A1A]">
                        {prod.qtySold} botol
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#1A1A1A]">
                        {formatRupiah(prod.totalSales)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-sm text-emerald-800">
                        {formatRupiah(prod.totalProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
