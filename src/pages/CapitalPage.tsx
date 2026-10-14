import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatIndonesianDate, formatRupiah, getTodayDateString } from '../lib/formatters';
import { CapitalTransaction, CapitalType } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Coins, Plus, Edit2, Trash2, ArrowUpRight, Search, ShieldCheck } from 'lucide-react';

export const CapitalPage: React.FC = () => {
  const { capitalTransactions, addCapital, updateCapital, deleteCapital, summary } = useBusiness();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CapitalTransaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<CapitalType>('additional');
  const [amount, setAmount] = useState<number>(1000000);
  const [date, setDate] = useState(getTodayDateString());
  const [source, setSource] = useState('Tabungan Pribadi');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialCapitalExists = capitalTransactions.some((c) => c.type === 'initial');

  const openAddModal = (defaultType: CapitalType = 'additional') => {
    setEditingItem(null);
    setType(defaultType);
    setAmount(1000000);
    setDate(getTodayDateString());
    setSource(defaultType === 'initial' ? 'Modal Pendiri' : 'Tabungan Pribadi');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CapitalTransaction) => {
    setEditingItem(item);
    setType(item.type);
    setAmount(item.amount);
    setDate(item.date);
    setSource(item.source);
    setNotes(item.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Nominal modal harus lebih besar dari Rp0');
      return;
    }
    if (!source.trim()) {
      setError('Sumber modal wajib diisi');
      return;
    }

    try {
      setLoading(true);
      if (editingItem) {
        await updateCapital(editingItem.id, {
          type,
          amount,
          date,
          source,
          notes,
        });
      } else {
        await addCapital({
          type,
          amount,
          date,
          source,
          notes,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi modal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteCapital(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = capitalTransactions.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.source.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q)) ||
      c.amount.toString().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Ekuitas & Permodalan
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
            Modal Usaha shining.co
          </h2>
          <p className="text-xs text-[#7C776D] mt-1">
            Mencatat setoran modal awal dan tambahan modal pemilik tanpa tercampur dengan pendapatan penjualan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!initialCapitalExists && (
            <button
              onClick={() => openAddModal('initial')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FAF9F5] border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#EBE7DF] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>+ Modal Awal</span>
            </button>
          )}
          <button
            onClick={() => openAddModal('additional')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Modal</span>
          </button>
        </div>
      </div>

      {/* Capital Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Total Akumulasi Modal
          </span>
          <p className="font-serif text-2xl font-bold text-[#1A1A1A] mt-2">
            {formatRupiah(summary.totalCapital)}
          </p>
          <p className="text-[11px] text-[#7C776D] mt-1">
            Total seluruh modal yang disetorkan ke bisnis
          </p>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Modal Awal Bisnis
          </span>
          <p className="font-serif text-2xl font-bold text-[#1A1A1A] mt-2">
            {formatRupiah(
              capitalTransactions
                .filter((c) => c.type === 'initial')
                .reduce((acc, c) => acc + c.amount, 0)
            )}
          </p>
          <p className="text-[11px] text-[#7C776D] mt-1">
            Setoran modal awal saat bisnis pertama berdiri
          </p>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-5">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Tambahan Modal Berjalan
          </span>
          <p className="font-serif text-2xl font-bold text-[#1A1A1A] mt-2">
            {formatRupiah(
              capitalTransactions
                .filter((c) => c.type === 'additional')
                .reduce((acc, c) => acc + c.amount, 0)
            )}
          </p>
          <p className="text-[11px] text-[#7C776D] mt-1">
            Suntikan modal ekspansi, pembelian bibit, & stok baru
          </p>
        </div>
      </div>

      {/* Transactions Table & Filter */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-serif text-base font-bold text-[#1A1A1A] self-start sm:self-auto">
            Riwayat Setoran Modal
          </h3>
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari sumber modal atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8C887E] space-y-3">
            <Coins className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-sm font-medium text-[#1A1A1A]">Belum Ada Riwayat Modal</p>
            <p className="max-w-md mx-auto text-[#7C776D]">
              Catat modal pertama Anda untuk mendanai pengadaan botol, formulasi aroma, dan operasional awal.
            </p>
            <button
              onClick={() => openAddModal('initial')}
              className="mt-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
            >
              + Catat Modal Awal
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F0E8] border-b border-[#E5E1D8] text-[#5A5751]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Jenis Modal</th>
                  <th className="py-3 px-4 font-semibold">Sumber Modal</th>
                  <th className="py-3 px-4 font-semibold text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4 font-semibold">Catatan</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F7F5EF] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">
                      {formatIndonesianDate(item.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          item.type === 'initial'
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-[#E5E1D8] text-[#1A1A1A]'
                        }`}
                      >
                        {item.type === 'initial' ? 'Modal Awal' : 'Tambahan Modal'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#1A1A1A] font-medium">
                      {item.source}
                    </td>
                    <td className="py-3.5 px-4 text-right font-serif font-bold text-sm text-[#1A1A1A]">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-[#7C776D] max-w-xs truncate">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit"
                          className="p-1.5 text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(item.id)}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] pb-3 border-b border-[#E5E1D8]">
              {editingItem ? 'Edit Transaksi Modal' : 'Catat Modal Usaha'}
            </h3>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Jenis Modal *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CapitalType)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                >
                  <option value="initial">Modal Awal Bisnis</option>
                  <option value="additional">Tambahan Modal</option>
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

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Nominal Modal (Rp) *</label>
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
                <label className="block text-[#5A5751] font-medium mb-1">Sumber Modal *</label>
                <input
                  type="text"
                  placeholder="Contoh: Tabungan Pribadi, Suntikan Investor, dll."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan alokasi atau sumber"
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
        title="Hapus Transaksi Modal"
        message="Apakah Anda yakin ingin menghapus catatan modal ini? Tindakan ini akan memperbarui saldo kas total secara otomatis."
        confirmLabel="Ya, Hapus"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
