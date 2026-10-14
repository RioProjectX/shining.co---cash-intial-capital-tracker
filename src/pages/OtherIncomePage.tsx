import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatIndonesianDate, formatRupiah, getTodayDateString } from '../lib/formatters';
import { OtherIncome } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ArrowDownRight, Plus, Search, Trash2, ShieldCheck, Sparkles } from 'lucide-react';

export const OtherIncomePage: React.FC = () => {
  const { otherIncomes, addOtherIncome, deleteOtherIncome, summary } = useBusiness();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Cashback Supplier');
  const [amount, setAmount] = useState<number>(50000);
  const [date, setDate] = useState(getTodayDateString());
  const [source, setSource] = useState('Cashback Pembelian Botol');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAddModal = () => {
    setCategory('Cashback Supplier');
    setAmount(50000);
    setDate(getTodayDateString());
    setSource('Cashback Pembelian Botol');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Nominal harus lebih dari Rp0');
      return;
    }
    if (!source.trim()) {
      setError('Sumber pemasukan wajib diisi');
      return;
    }

    try {
      setLoading(true);
      await addOtherIncome({
        category,
        amount,
        date,
        source,
        notes,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pemasukan lainnya');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteOtherIncome(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = otherIncomes.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.source.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Pemasukan Non-Penjualan
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
            Pemasukan Lainnya
          </h2>
          <p className="text-xs text-[#7C776D] mt-1">
            Mencatat cashback pembelian bahan baku, pengembalian dana, dan pendapatan di luar transaksi penjualan parfum.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Catat Pemasukan Lain</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5 max-w-sm">
        <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
          Total Pemasukan Lainnya
        </span>
        <p className="font-serif text-2xl font-bold text-emerald-800 mt-2">
          {formatRupiah(summary.totalOtherIncome)}
        </p>
        <p className="text-[11px] text-[#7C776D] mt-1">
          {otherIncomes.length} transaksi penerimaan kas non-penjualan
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
            Riwayat Penerimaan Non-Penjualan
          </h3>
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari sumber atau keterangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8C887E] space-y-3">
            <ArrowDownRight className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-sm font-medium text-[#1A1A1A]">Belum Ada Pemasukan Lainnya</p>
            <p className="max-w-md mx-auto text-[#7C776D]">
              Gunakan fitur ini ketika menerima pengembalian dana dari ekspedisi, komisi, atau reward transaksi usaha.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F0E8] border-b border-[#E5E1D8] text-[#5A5751]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">Sumber Pemasukan</th>
                  <th className="py-3 px-4 font-semibold text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4 font-semibold">Catatan</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F7F5EF] transition-colors">
                    <td className="py-3.5 px-4 text-[#5A5751]">
                      {formatIndonesianDate(item.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#E5E1D8] text-[#1A1A1A]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">
                      {item.source}
                    </td>
                    <td className="py-3.5 px-4 text-right font-serif font-bold text-sm text-emerald-800">
                      +{formatRupiah(item.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-[#7C776D] max-w-xs truncate">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDeleteTargetId(item.id)}
                        className="p-1.5 text-[#7C776D] hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] pb-3 border-b border-[#E5E1D8]">
              Catat Pemasukan Non-Penjualan
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
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  >
                    <option value="Cashback Supplier">Cashback Supplier</option>
                    <option value="Pengembalian Dana">Pengembalian Dana / Refund</option>
                    <option value="Pendapatan Non-Penjualan">Pendapatan Non-Penjualan</option>
                    <option value="Lainnya">Lainnya</option>
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
                <label className="block text-[#5A5751] font-medium mb-1">Sumber Pemasukan *</label>
                <input
                  type="text"
                  placeholder="Contoh: Refund ongkir kelebihan berat dari J&T"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
        title="Hapus Catatan Pemasukan"
        message="Apakah Anda yakin ingin menghapus catatan penerimaan ini? Saldo kas akan disesuaikan otomatis."
        confirmLabel="Ya, Hapus"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
