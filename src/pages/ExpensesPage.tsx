import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatIndonesianDate, formatRupiah, getTodayDateString } from '../lib/formatters';
import { Expense, ExpenseCategory } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  Layers,
  Sparkles,
  PieChart,
} from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = [
  'Botol dan packaging',
  'Label dan stiker',
  'Pembelian stok parfum',
  'Pengiriman',
  'Promosi dan iklan',
  'Operasional',
  'Transportasi',
  'Biaya platform atau administrasi',
  'Pengeluaran lain',
];

export const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, summary } = useBusiness();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('Botol dan packaging');
  const [amount, setAmount] = useState<number>(100000);
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [description, setDescription] = useState('');
  const [receiptRef, setReceiptRef] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingExpense(null);
    setCategory('Botol dan packaging');
    setAmount(100000);
    setDate(getTodayDateString());
    setPaymentMethod('transfer');
    setDescription('');
    setReceiptRef('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e: Expense) => {
    setEditingExpense(e);
    setCategory(e.category as ExpenseCategory);
    setAmount(e.amount);
    setDate(e.date);
    setPaymentMethod(e.paymentMethod || 'transfer');
    setDescription(e.description);
    setReceiptRef(e.receiptRef || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Nominal pengeluaran harus lebih besar dari Rp0');
      return;
    }
    if (!description.trim()) {
      setError('Deskripsi pengeluaran wajib diisi');
      return;
    }

    try {
      setLoading(true);
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          category,
          amount,
          date,
          paymentMethod,
          description,
          receiptRef,
        });
      } else {
        await addExpense({
          category,
          amount,
          date,
          paymentMethod,
          paymentStatus: 'lunas',
          description,
          receiptRef,
          isStockPurchase: category === 'Pembelian stok parfum',
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteExpense(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Category breakdown calculation
  const categoryBreakdown = CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return { category: cat, total };
  }).filter((item) => item.total > 0);

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.receiptRef && e.receiptRef.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Biaya & Beban Usaha
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
            Pencatatan Pengeluaran
          </h2>
          <p className="text-xs text-[#7C776D] mt-1">
            Melacak seluruh pengeluaran operasional, bahan packaging botol, promosi, dan biaya platform.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Catat Pengeluaran</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Total Pengeluaran Kas
          </span>
          <p className="font-serif text-xl font-bold text-rose-800 mt-1.5">
            {formatRupiah(summary.totalExpenses)}
          </p>
          <span className="text-[11px] text-[#7C776D]">{expenses.length} transaksi pengeluaran</span>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Biaya Operasional Rutin
          </span>
          <p className="font-serif text-xl font-bold text-[#1A1A1A] mt-1.5">
            {formatRupiah(summary.operationalExpenses)}
          </p>
          <span className="text-[11px] text-[#7C776D]">Packaging, promosi, admin, logistik</span>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Pembelian Stok Parfum
          </span>
          <p className="font-serif text-xl font-bold text-[#1A1A1A] mt-1.5">
            {formatRupiah(summary.stockPurchaseExpenses)}
          </p>
          <span className="text-[11px] text-[#7C776D]">Dikonversi menjadi nilai persediaan</span>
        </div>
      </div>

      {/* Category Breakdown Chips / Bar */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-[#F6F4EE] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold block mb-2.5">
            Alokasi Biaya per Kategori
          </span>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.map((item) => (
              <div
                key={item.category}
                className="bg-[#FAF9F5] border border-[#D5D0C5] px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"
              >
                <span className="font-medium text-[#1A1A1A]">{item.category}:</span>
                <span className="font-serif font-bold text-rose-800">{formatRupiah(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-[#7C776D]">Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#F3F0E8] border border-[#D5D0C5] rounded-lg px-2.5 py-1 text-xs focus:outline-hidden"
            >
              <option value="all">Semua Kategori</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari deskripsi atau no. nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            />
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8C887E] space-y-3">
            <TrendingDown className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-sm font-medium text-[#1A1A1A]">Belum Ada Pengeluaran Tercatat</p>
            <p className="max-w-md mx-auto text-[#7C776D]">
              Catat pengeluaran seperti botol, stiker label, ongkos kirim, dan biaya promosi untuk menjaga akurasi laporan laba rugi.
            </p>
            <button
              onClick={openAddModal}
              className="mt-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
            >
              + Catat Pengeluaran Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F0E8] border-b border-[#E5E1D8] text-[#5A5751]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">Deskripsi / Keperluan</th>
                  <th className="py-3 px-4 font-semibold">Metode</th>
                  <th className="py-3 px-4 font-semibold text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[#F7F5EF] transition-colors">
                    <td className="py-3.5 px-4 text-[#5A5751]">
                      {formatIndonesianDate(expense.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#EBE7DF] text-[#1A1A1A]">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#1A1A1A] font-medium max-w-xs">
                      {expense.description}
                      {expense.receiptRef && (
                        <span className="block text-[10px] text-[#7C776D]">
                          Ref: {expense.receiptRef}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[#7C776D]">
                      {expense.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right font-serif font-bold text-sm text-rose-800">
                      -{formatRupiah(expense.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(expense)}
                          title="Edit"
                          className="p-1.5 text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(expense.id)}
                          title="Hapus"
                          className="p-1.5 text-[#7C776D] hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] pb-3 border-b border-[#E5E1D8]">
              {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Bisnis'}
            </h3>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Kategori *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-[#7C776D] mt-0.5 block">
                    {formatRupiah(amount)}
                  </span>
                </div>
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Metode Bayar</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="tunai">Kas / Tunai</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="kartu">Kartu Debit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Deskripsi / Rincian *</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Cetak 500 pcs stiker label wewangian botol"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">No. Bukti / Referensi Nota (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: INV-PRNT-8890"
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Hapus Catatan Pengeluaran"
        message="Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Saldo kas akan disesuaikan kembali secara otomatis."
        confirmLabel="Ya, Hapus"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
