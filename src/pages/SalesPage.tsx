import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatIndonesianDate, formatRupiah, getTodayDateString } from '../lib/formatters';
import { Sale, PaymentMethod, PaymentStatus } from '../types';
import { PrintReceiptModal } from '../components/PrintReceiptModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  ShoppingBag,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Ban,
  ArrowRight,
  Eye,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onOpenNewSaleModal: () => void;
}

export const SalesPage: React.FC<Props> = ({ onOpenNewSaleModal }) => {
  const { sales, cancelSale, recordSalePayment } = useBusiness();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lunas' | 'belum_lunas' | 'sebagian' | 'cancelled'>('all');

  // Selected sale for viewing details or printing receipt
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Cancellation modal state
  const [cancelTargetSale, setCancelTargetSale] = useState<Sale | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Permintaan pelanggan');

  // Follow-up payment modal state
  const [paymentTargetSale, setPaymentTargetSale] = useState<Sale | null>(null);
  const [followupPaymentAmount, setFollowupPaymentAmount] = useState<number>(0);
  const [followupPaymentMethod, setFollowupPaymentMethod] = useState<PaymentMethod>('transfer');
  const [followupPaymentDate, setFollowupPaymentDate] = useState(getTodayDateString());
  const [followupPaymentNotes, setFollowupPaymentNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openFollowupPayment = (sale: Sale) => {
    setPaymentTargetSale(sale);
    setFollowupPaymentAmount(sale.remainingBalance);
    setFollowupPaymentMethod('transfer');
    setFollowupPaymentDate(getTodayDateString());
    setFollowupPaymentNotes('Pelunasan piutang');
    setActionError(null);
  };

  const handleFollowupPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetSale) return;
    if (followupPaymentAmount <= 0) {
      setActionError('Nominal pembayaran harus lebih besar dari Rp0');
      return;
    }
    if (followupPaymentAmount > paymentTargetSale.remainingBalance) {
      setActionError(`Nominal tidak boleh melebihi sisa piutang (${formatRupiah(paymentTargetSale.remainingBalance)})`);
      return;
    }

    try {
      setLoading(true);
      await recordSalePayment(
        paymentTargetSale.id,
        followupPaymentAmount,
        followupPaymentMethod,
        followupPaymentDate,
        followupPaymentNotes
      );
      try {
        confetti({ particleCount: 30, spread: 50 });
      } catch {}
      setPaymentTargetSale(null);
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyimpan pembayaran lanjutan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSaleConfirm = async () => {
    if (!cancelTargetSale) return;
    try {
      setLoading(true);
      await cancelSale(cancelTargetSale.id, cancellationReason);
      setCancelTargetSale(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter sales
  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.productName.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'cancelled') return s.isCancelled;
    if (s.isCancelled) return false;
    return s.paymentStatus === statusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Transaksi Penjualan
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
            Daftar Penjualan Parfum
          </h2>
          <p className="text-xs text-[#7C776D] mt-1">
            Pencatatan faktur penjualan, pelunasan piutang, dan cetak nota resmi shining.co.
          </p>
        </div>

        <button
          onClick={onOpenNewSaleModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Transaksi Baru</span>
        </button>
      </div>

      {/* Sales Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Total Nilai Penjualan
          </span>
          <p className="font-serif text-xl font-bold text-[#1A1A1A] mt-1.5">
            {formatRupiah(
              sales
                .filter((s) => !s.isCancelled)
                .reduce((acc, s) => acc + s.totalAmount, 0)
            )}
          </p>
          <span className="text-[11px] text-[#7C776D]">
            {sales.filter((s) => !s.isCancelled).length} faktur aktif
          </span>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Kas Sudah Diterima
          </span>
          <p className="font-serif text-xl font-bold text-emerald-800 mt-1.5">
            {formatRupiah(
              sales
                .filter((s) => !s.isCancelled)
                .reduce((acc, s) => acc + s.amountPaid, 0)
            )}
          </p>
          <span className="text-[11px] text-emerald-900">Uang tunai / transfer masuk</span>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Total Piutang Belum Lunas
          </span>
          <p className="font-serif text-xl font-bold text-amber-800 mt-1.5">
            {formatRupiah(
              sales
                .filter((s) => !s.isCancelled && s.paymentStatus !== 'lunas')
                .reduce((acc, s) => acc + s.remainingBalance, 0)
            )}
          </p>
          <span className="text-[11px] text-amber-900">Menunggu pelunasan</span>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Estimasi Laba Kotor
          </span>
          <p className="font-serif text-xl font-bold text-emerald-800 mt-1.5">
            {formatRupiah(
              sales
                .filter((s) => !s.isCancelled)
                .reduce((acc, s) => acc + (s.grossProfit || 0), 0)
            )}
          </p>
          <span className="text-[11px] text-[#7C776D]">Penjualan bersih dikurangi HPP</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-[#7C776D]">Status Pembayaran:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#F3F0E8] border border-[#D5D0C5] rounded-lg px-2.5 py-1 text-xs focus:outline-hidden"
            >
              <option value="all">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="sebagian">Sebagian (Ada Piutang)</option>
              <option value="belum_lunas">Belum Lunas</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari no. faktur, nama parfum, pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            />
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8C887E] space-y-3">
            <ShoppingBag className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-sm font-medium text-[#1A1A1A]">Belum Ada Transaksi Penjualan</p>
            <p className="max-w-md mx-auto text-[#7C776D]">
              Setiap kali penjualan dicatat, stok botol akan berkurang otomatis dan laba kotor langsung terhitung.
            </p>
            <button
              onClick={onOpenNewSaleModal}
              className="mt-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
            >
              + Catat Penjualan Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F0E8] border-b border-[#E5E1D8] text-[#5A5751]">
                <tr>
                  <th className="py-3 px-4 font-semibold">No. Faktur</th>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Parfum</th>
                  <th className="py-3 px-4 font-semibold text-center">Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Tagihan</th>
                  <th className="py-3 px-4 font-semibold text-right">Kas Diterima</th>
                  <th className="py-3 px-4 font-semibold">Status Bayar</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {filteredSales.map((sale) => {
                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-[#F7F5EF] transition-colors ${
                        sale.isCancelled ? 'opacity-50 bg-[#F2EFE8]/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-[#1A1A1A]">
                        {sale.invoiceNumber}
                        {sale.isCancelled && (
                          <span className="block text-[10px] text-rose-700 font-sans font-semibold">
                            (DIBATALKAN)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#5A5751]">
                        {formatIndonesianDate(sale.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-[#1A1A1A]">{sale.productName}</p>
                        <span className="text-[11px] text-[#7C776D]">
                          {sale.customerName ? `Pelanggan: ${sale.customerName}` : 'Pelanggan Umum'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#1A1A1A]">
                        {sale.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-sm text-[#1A1A1A]">
                        {formatRupiah(sale.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-800 font-medium">
                        {formatRupiah(sale.amountPaid)}
                        {sale.remainingBalance > 0 && (
                          <span className="block text-[10px] text-rose-700 font-normal">
                            Sisa: {formatRupiah(sale.remainingBalance)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {sale.isCancelled ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-gray-200 text-gray-800">
                            Batal
                          </span>
                        ) : sale.paymentStatus === 'lunas' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            Lunas
                          </span>
                        ) : sale.paymentStatus === 'sebagian' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-900">
                            Sebagian
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rose-100 text-rose-800">
                            Belum Lunas
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Receipt */}
                          <button
                            onClick={() => setSelectedSaleForReceipt(sale)}
                            title="Cetak Nota"
                            className="p-1.5 text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-md transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Record follow-up payment if has balance */}
                          {!sale.isCancelled && sale.remainingBalance > 0 && (
                            <button
                              onClick={() => openFollowupPayment(sale)}
                              title="Catat Pelunasan / Cicilan"
                              className="px-2 py-1 bg-[#1A1A1A] text-white hover:bg-[#333] rounded text-[10px] font-medium transition-colors"
                            >
                              + Bayar
                            </button>
                          )}

                          {/* Detail Modal trigger */}
                          <button
                            onClick={() => setSelectedSaleDetail(sale)}
                            title="Lihat Detail Transaksi"
                            className="p-1.5 text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel Sale trigger */}
                          {!sale.isCancelled && (
                            <button
                              onClick={() => {
                                setCancelTargetSale(sale);
                                setCancellationReason('Permintaan pembeli / salah input');
                              }}
                              title="Batalkan Transaksi (Retur Stok)"
                              className="p-1.5 text-[#7C776D] hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                  Detail Faktur #{selectedSaleDetail.invoiceNumber}
                </h3>
                <p className="text-[11px] text-[#7C776D]">
                  {formatIndonesianDate(selectedSaleDetail.date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-xs text-[#7C776D] hover:text-black uppercase tracking-wider"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#1A1A1A]">
              <div className="flex justify-between">
                <span className="text-[#7C776D]">Produk:</span>
                <span className="font-semibold">{selectedSaleDetail.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C776D]">Jumlah:</span>
                <span>{selectedSaleDetail.quantity} botol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C776D]">Harga Jual Satuan:</span>
                <span>{formatRupiah(selectedSaleDetail.unitPrice)}</span>
              </div>
              {selectedSaleDetail.discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(selectedSaleDetail.discount)}</span>
                </div>
              )}
              {selectedSaleDetail.extraCost > 0 && (
                <div className="flex justify-between text-[#7C776D]">
                  <span>Biaya Tambahan:</span>
                  <span>+{formatRupiah(selectedSaleDetail.extraCost)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-[#E5E1D8] pt-2">
                <span>Total Penjualan:</span>
                <span className="font-serif text-sm">{formatRupiah(selectedSaleDetail.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Kas Masuk:</span>
                <span>{formatRupiah(selectedSaleDetail.amountPaid)}</span>
              </div>
              {selectedSaleDetail.remainingBalance > 0 && (
                <div className="flex justify-between text-rose-700 font-medium">
                  <span>Sisa Piutang:</span>
                  <span>{formatRupiah(selectedSaleDetail.remainingBalance)}</span>
                </div>
              )}
              <div className="bg-[#F3F0E8] p-3 rounded-lg space-y-1.5 mt-2">
                <div className="flex justify-between text-[#7C776D]">
                  <span>Harga Pokok Penjualan (HPP):</span>
                  <span>{formatRupiah(selectedSaleDetail.cogs)}</span>
                </div>
                <div className="flex justify-between text-emerald-900 font-semibold">
                  <span>Estimasi Laba Kotor:</span>
                  <span>{formatRupiah(selectedSaleDetail.grossProfit)}</span>
                </div>
              </div>
              {selectedSaleDetail.isCancelled && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-lg">
                  <span className="font-semibold block">Dibatalkan:</span>
                  {selectedSaleDetail.cancellationReason}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E1D8]">
              <button
                onClick={() => {
                  setSelectedSaleForReceipt(selectedSaleDetail);
                  setSelectedSaleDetail(null);
                }}
                className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
              >
                Cetak Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Payment Modal */}
      {paymentTargetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] pb-2 border-b border-[#E5E1D8]">
              Catat Pelunasan / Cicilan
            </h3>
            <p className="text-[11px] text-[#7C776D] mt-1">
              Faktur #{paymentTargetSale.invoiceNumber} • Sisa Piutang:{' '}
              <strong className="text-rose-700">{formatRupiah(paymentTargetSale.remainingBalance)}</strong>
            </p>

            {actionError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {actionError}
              </div>
            )}

            <form onSubmit={handleFollowupPaymentSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Nominal Pembayaran (Rp) *</label>
                <input
                  type="number"
                  min={1}
                  max={paymentTargetSale.remainingBalance}
                  value={followupPaymentAmount}
                  onChange={(e) => setFollowupPaymentAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
                <span className="text-[10px] text-[#7C776D] mt-0.5 block">
                  {formatRupiah(followupPaymentAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Metode Bayar *</label>
                  <select
                    value={followupPaymentMethod}
                    onChange={(e) => setFollowupPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                    <option value="tunai">Tunai</option>
                    <option value="ewallet">E-Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Tanggal Bayar *</label>
                  <input
                    type="date"
                    value={followupPaymentDate}
                    onChange={(e) => setFollowupPaymentDate(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer Mandiri An. Sarah"
                  value={followupPaymentNotes}
                  onChange={(e) => setFollowupPaymentNotes(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
                <button
                  type="button"
                  onClick={() => setPaymentTargetSale(null)}
                  className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Dialog with Reason */}
      {cancelTargetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="font-serif text-lg font-bold text-rose-800">
              Batalkan Transaksi #{cancelTargetSale.invoiceNumber}
            </h3>
            <p className="text-xs text-[#5A5751] leading-relaxed">
              Pembatalan ini akan secara otomatis mengembalikan{' '}
              <strong>{cancelTargetSale.quantity} botol {cancelTargetSale.productName}</strong> ke stok persediaan
              dan mencatat histori retur di audit trail.
            </p>

            <div>
              <label className="block text-[#5A5751] font-medium mb-1 text-xs">
                Alasan Pembatalan (Wajib):
              </label>
              <textarea
                rows={2}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetSale(null)}
                className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCancelSaleConfirm}
                disabled={loading}
                className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-rose-700 text-white hover:bg-rose-800 rounded-lg"
              >
                {loading ? 'Memproses...' : 'Ya, Batalkan Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      <PrintReceiptModal
        sale={selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
      />
    </div>
  );
};
