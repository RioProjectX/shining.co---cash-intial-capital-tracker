import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatRupiah, getTodayDateString } from '../lib/formatters';
import { PaymentMethod, PaymentStatus, ExpenseCategory, CapitalType } from '../types';
import { X, CheckCircle, AlertCircle, ShoppingBag, Package, TrendingDown, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  action: 'sale' | 'stock' | 'expense' | 'capital' | null;
  onClose: () => void;
}

export const QuickActionModal: React.FC<Props> = ({ action, onClose }) => {
  const {
    products,
    recordSale,
    restockProduct,
    addExpense,
    addCapital,
    summary,
  } = useBusiness();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states - SALE
  const [saleProductId, setSaleProductId] = useState(products[0]?.id || '');
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState(products[0]?.sellingPrice || 150000);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [saleExtraCost, setSaleExtraCost] = useState(0);
  const [salePaymentMethod, setSalePaymentMethod] = useState<PaymentMethod>('transfer');
  const [salePaymentStatus, setSalePaymentStatus] = useState<PaymentStatus>('lunas');
  const [saleAmountPaid, setSaleAmountPaid] = useState(150000);
  const [saleCustomerName, setSaleCustomerName] = useState('');
  const [saleDate, setSaleDate] = useState(getTodayDateString());
  const [saleNotes, setSaleNotes] = useState('');

  // Form states - STOCK (Restock)
  const [stockProductId, setStockProductId] = useState(products[0]?.id || '');
  const [stockQty, setStockQty] = useState(10);
  const [stockCostPerUnit, setStockCostPerUnit] = useState(products[0]?.costPrice || 50000);
  const [stockExtraCost, setStockExtraCost] = useState(0);
  const [stockDate, setStockDate] = useState(getTodayDateString());
  const [stockNotes, setStockNotes] = useState('');
  const [stockRecordExpense, setStockRecordExpense] = useState(true);

  // Form states - EXPENSE
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Botol dan packaging');
  const [expenseAmount, setExpenseAmount] = useState<number>(100000);
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [expenseMethod, setExpenseMethod] = useState('transfer');
  const [expenseDesc, setExpenseDesc] = useState('');

  // Form states - CAPITAL
  const [capitalType, setCapitalType] = useState<CapitalType>('additional');
  const [capitalAmount, setCapitalAmount] = useState<number>(1000000);
  const [capitalDate, setCapitalDate] = useState(getTodayDateString());
  const [capitalSource, setCapitalSource] = useState('Tabungan Pribadi');
  const [capitalNotes, setCapitalNotes] = useState('');

  // Keep sale unit price synced when product changes
  const handleProductSelectChange = (id: string) => {
    setSaleProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setSalePrice(prod.sellingPrice);
      const total = 1 * prod.sellingPrice - saleDiscount + saleExtraCost;
      setSaleAmountPaid(total);
    }
  };

  const handleStockProductSelectChange = (id: string) => {
    setStockProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setStockCostPerUnit(prod.costPrice);
    }
  };

  if (!action) return null;

  // Calculators for sale
  const saleSubtotal = saleQty * salePrice;
  const saleTotalAmount = Math.max(0, saleSubtotal - saleDiscount + saleExtraCost);
  const selectedSaleProduct = products.find((p) => p.id === saleProductId);

  // Submit handlers
  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!saleProductId) {
      setError('Silakan pilih produk parfum.');
      return;
    }
    if (saleQty <= 0) {
      setError('Jumlah botol harus lebih dari 0.');
      return;
    }
    if (selectedSaleProduct && selectedSaleProduct.currentStock < saleQty) {
      setError(`Stok tidak mencukupi! Tersedia hanya ${selectedSaleProduct.currentStock} botol.`);
      return;
    }

    try {
      setLoading(true);
      await recordSale({
        productId: saleProductId,
        quantity: saleQty,
        unitPrice: salePrice,
        discount: saleDiscount,
        extraCost: saleExtraCost,
        paymentMethod: salePaymentMethod,
        paymentStatus: salePaymentStatus,
        amountPaid: salePaymentStatus === 'lunas' ? saleTotalAmount : saleAmountPaid,
        customerName: saleCustomerName,
        notes: saleNotes,
        date: saleDate,
      });

      // Joyful feedback
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      } catch {}

      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi penjualan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!stockProductId) {
      setError('Pilih produk parfum yang ingin ditambah stoknya.');
      return;
    }
    if (stockQty <= 0) {
      setError('Jumlah stok masuk harus lebih dari 0.');
      return;
    }

    try {
      setLoading(true);
      await restockProduct(
        stockProductId,
        stockQty,
        stockCostPerUnit,
        stockExtraCost,
        stockDate,
        stockNotes,
        stockRecordExpense
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan stok');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (expenseAmount <= 0) {
      setError('Nominal pengeluaran harus lebih dari Rp0.');
      return;
    }
    if (!expenseDesc.trim()) {
      setError('Deskripsi pengeluaran wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      await addExpense({
        category: expenseCategory,
        amount: expenseAmount,
        date: expenseDate,
        paymentMethod: expenseMethod,
        paymentStatus: 'lunas',
        description: expenseDesc,
        isStockPurchase: expenseCategory === 'Pembelian stok parfum',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (capitalAmount <= 0) {
      setError('Nominal modal harus lebih dari Rp0.');
      return;
    }
    if (!capitalSource.trim()) {
      setError('Sumber modal wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      await addCapital({
        type: capitalType,
        amount: capitalAmount,
        date: capitalDate,
        source: capitalSource,
        notes: capitalNotes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan modal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E1D8]">
          <div className="flex items-center gap-2.5">
            {action === 'sale' && <ShoppingBag className="w-5 h-5 text-[#1A1A1A]" />}
            {action === 'stock' && <Package className="w-5 h-5 text-[#1A1A1A]" />}
            {action === 'expense' && <TrendingDown className="w-5 h-5 text-[#1A1A1A]" />}
            {action === 'capital' && <Coins className="w-5 h-5 text-[#1A1A1A]" />}
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1A1A1A] tracking-tight">
                {action === 'sale' && 'Tambah Penjualan Baru'}
                {action === 'stock' && 'Tambah Stok / Restock Parfum'}
                {action === 'expense' && 'Catat Pengeluaran Bisnis'}
                {action === 'capital' && 'Tambah Modal Usaha'}
              </h2>
              <p className="text-[11px] text-[#7C776D]">
                Data langsung tersimpan dan tersinkronisasi ke Cloud Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7C776D] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. SALE FORM */}
        {action === 'sale' && (
          <form onSubmit={handleSubmitSale} className="mt-5 space-y-4 text-xs">
            {products.length === 0 ? (
              <div className="p-4 bg-[#F3F0E8] border border-[#E5E1D8] rounded-lg text-center space-y-2">
                <p className="font-medium text-[#1A1A1A]">Belum Ada Produk Parfum</p>
                <p className="text-[#7C776D]">
                  Tambahkan produk parfum terlebih dahulu di menu "Manajemen Stok" sebelum mencatat penjualan.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Pilih Produk *</label>
                    <select
                      value={saleProductId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.bottleSizeMl}ml) — Stok: {p.currentStock}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Tanggal Transaksi *</label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Jumlah (Qty) *</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedSaleProduct?.currentStock || 999}
                      value={saleQty}
                      onChange={(e) => setSaleQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                      required
                    />
                    {selectedSaleProduct && (
                      <span className="text-[10px] text-[#7C776D] mt-0.5 block">
                        Stok: {selectedSaleProduct.currentStock} botol
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Harga Satuan (Rp) *</label>
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Diskon (Rp)</label>
                    <input
                      type="number"
                      value={saleDiscount}
                      onChange={(e) => setSaleDiscount(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Metode Pembayaran</label>
                    <select
                      value={salePaymentMethod}
                      onChange={(e) => setSalePaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    >
                      <option value="transfer">Transfer Bank</option>
                      <option value="qris">QRIS</option>
                      <option value="tunai">Tunai</option>
                      <option value="ewallet">E-Wallet (GoPay/OVO/ShopeePay)</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Status Pembayaran</label>
                    <select
                      value={salePaymentStatus}
                      onChange={(e) => {
                        const status = e.target.value as PaymentStatus;
                        setSalePaymentStatus(status);
                        if (status === 'lunas') setSaleAmountPaid(saleTotalAmount);
                        if (status === 'belum_lunas') setSaleAmountPaid(0);
                      }}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    >
                      <option value="lunas">Lunas</option>
                      <option value="sebagian">Dibayar Sebagian (Cicilan)</option>
                      <option value="belum_lunas">Belum Lunas (Piutang)</option>
                    </select>
                  </div>
                </div>

                {salePaymentStatus === 'sebagian' && (
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Uang Muka / Kas Diterima (Rp)</label>
                    <input
                      type="number"
                      value={saleAmountPaid}
                      onChange={(e) => setSaleAmountPaid(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    />
                    <span className="text-[10px] text-rose-700 mt-0.5 block font-medium">
                      Sisa Piutang: {formatRupiah(Math.max(0, saleTotalAmount - saleAmountPaid))}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Nama Pelanggan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Sarah Aulia"
                      value={saleCustomerName}
                      onChange={(e) => setSaleCustomerName(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Catatan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pesanan via Instagram"
                      value={saleNotes}
                      onChange={(e) => setSaleNotes(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Live calculation banner */}
                <div className="bg-[#F3F0E8] border border-[#E5E1D8] p-3 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[#7C776D] block">Total Transaksi:</span>
                    <span className="font-semibold text-sm text-[#1A1A1A]">{formatRupiah(saleTotalAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#7C776D] block">Estimasi Laba Kotor:</span>
                    <span className="font-semibold text-sm text-emerald-800">
                      {selectedSaleProduct
                        ? formatRupiah(saleTotalAmount - (saleQty * selectedSaleProduct.costPrice))
                        : 'Rp0'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Penjualan'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* 2. STOCK / RESTOCK FORM */}
        {action === 'stock' && (
          <form onSubmit={handleSubmitStock} className="mt-5 space-y-4 text-xs">
            {products.length === 0 ? (
              <div className="p-4 bg-[#F3F0E8] border border-[#E5E1D8] rounded-lg text-center space-y-2">
                <p className="font-medium text-[#1A1A1A]">Belum Ada Produk Parfum</p>
                <p className="text-[#7C776D]">
                  Tambahkan master produk terlebih dahulu di menu "Manajemen Stok".
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Pilih Produk Parfum *</label>
                    <select
                      value={stockProductId}
                      onChange={(e) => handleStockProductSelectChange(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.bottleSizeMl}ml) — Stok sekarang: {p.currentStock}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Tanggal Pembelian/Masuk *</label>
                    <input
                      type="date"
                      value={stockDate}
                      onChange={(e) => setStockDate(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Jumlah Botol Masuk *</label>
                    <input
                      type="number"
                      min={1}
                      value={stockQty}
                      onChange={(e) => setStockQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Biaya Pokok per Botol (Rp) *</label>
                    <input
                      type="number"
                      value={stockCostPerUnit}
                      onChange={(e) => setStockCostPerUnit(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Ongkir / Biaya Tambahan</label>
                    <input
                      type="number"
                      value={stockExtraCost}
                      onChange={(e) => setStockExtraCost(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Catatan / Supplier</label>
                  <input
                    type="text"
                    placeholder="Contoh: Batch #2 dari supplier Surabaya"
                    value={stockNotes}
                    onChange={(e) => setStockNotes(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  />
                </div>

                <div className="bg-[#F3F0E8] border border-[#E5E1D8] p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#7C776D]">Total Nilai Pembelian Stok:</span>
                    <span className="font-semibold text-sm text-[#1A1A1A]">
                      {formatRupiah((stockQty * stockCostPerUnit) + stockExtraCost)}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#E5E1D8]">
                    <input
                      type="checkbox"
                      checked={stockRecordExpense}
                      onChange={(e) => setStockRecordExpense(e.target.checked)}
                      className="w-3.5 h-3.5 text-black rounded-sm border-gray-300"
                    />
                    <span className="text-[11px] text-[#5A5751]">
                      Catat otomatis ke pengeluaran kas (kategori "Pembelian stok parfum")
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Tambah Stok'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* 3. EXPENSE FORM */}
        {action === 'expense' && (
          <form onSubmit={handleSubmitExpense} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Kategori Pengeluaran *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                >
                  <option value="Botol dan packaging">Botol dan packaging</option>
                  <option value="Label dan stiker">Label dan stiker</option>
                  <option value="Pembelian stok parfum">Pembelian stok parfum</option>
                  <option value="Pengiriman">Pengiriman / Ekspedisi</option>
                  <option value="Promosi dan iklan">Promosi dan iklan</option>
                  <option value="Operasional">Operasional Usaha</option>
                  <option value="Transportasi">Transportasi</option>
                  <option value="Biaya platform atau administrasi">Biaya platform atau administrasi</option>
                  <option value="Pengeluaran lain">Pengeluaran lain</option>
                </select>
              </div>
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-medium"
                  required
                />
                <span className="text-[10px] text-[#7C776D] mt-0.5 block">
                  {formatRupiah(expenseAmount)}
                </span>
              </div>
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Metode Pembayaran</label>
                <select
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="tunai">Kas / Tunai</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="kartu">Kartu Debit/Kredit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#5A5751] font-medium mb-1">Deskripsi / Keperluan *</label>
              <textarea
                rows={2}
                placeholder="Contoh: Pembelian 100 pcs box packaging silinder hitam satin"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Catat Pengeluaran'}
              </button>
            </div>
          </form>
        )}

        {/* 4. CAPITAL FORM */}
        {action === 'capital' && (
          <form onSubmit={handleSubmitCapital} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Jenis Modal *</label>
                <select
                  value={capitalType}
                  onChange={(e) => setCapitalType(e.target.value as CapitalType)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                >
                  <option value="initial">Modal Awal Bisnis</option>
                  <option value="additional">Tambahan Modal</option>
                </select>
              </div>
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Tanggal Disetor *</label>
                <input
                  type="date"
                  value={capitalDate}
                  onChange={(e) => setCapitalDate(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#5A5751] font-medium mb-1">Nominal Modal (Rp) *</label>
              <input
                type="number"
                value={capitalAmount}
                onChange={(e) => setCapitalAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-medium"
                required
              />
              <span className="text-[10px] text-[#7C776D] mt-0.5 block">
                {formatRupiah(capitalAmount)}
              </span>
            </div>

            <div>
              <label className="block text-[#5A5751] font-medium mb-1">Sumber Modal *</label>
              <input
                type="text"
                placeholder="Contoh: Tabungan Pemilik, Suntikan Investor, dll."
                value={capitalSource}
                onChange={(e) => setCapitalSource(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-[#5A5751] font-medium mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Alokasi untuk pengadaan botol dan bibit parfum pertama"
                value={capitalNotes}
                onChange={(e) => setCapitalNotes(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
              />
            </div>

            <p className="text-[11px] text-[#8C887E] italic">
              * Modal yang disetorkan dihitung sebagai arus kas masuk dan dipisahkan secara murni dari pendapatan penjualan.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Modal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
