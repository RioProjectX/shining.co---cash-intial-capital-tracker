import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { formatIndonesianDate, formatRupiah, getTodayDateString } from '../lib/formatters';
import { Product, InventoryMovement } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  History,
  TrendingUp,
  Tag,
  Sparkles,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const {
    products,
    inventoryMovements,
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    adjustStock,
    summary,
  } = useBusiness();

  const [activeTab, setActiveTab] = useState<'catalog' | 'movements'>('catalog');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states - Product
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('Woody / Spicy');
  const [prodBottleSize, setProdBottleSize] = useState(50);
  const [prodCostPrice, setProdCostPrice] = useState(65000);
  const [prodSellingPrice, setProdSellingPrice] = useState(185000);
  const [prodInitialStock, setProdInitialStock] = useState(20);
  const [prodMinStockAlert, setProdMinStockAlert] = useState(5);
  const [prodNotes, setProdNotes] = useState('');

  // Form states - Restock
  const [restockQty, setRestockQty] = useState(10);
  const [restockCostPerUnit, setRestockCostPerUnit] = useState(65000);
  const [restockExtraCost, setRestockExtraCost] = useState(0);
  const [restockDate, setRestockDate] = useState(getTodayDateString());
  const [restockNotes, setRestockNotes] = useState('');
  const [restockRecordExpense, setRestockRecordExpense] = useState(true);

  // Form states - Adjustment
  const [adjustNewStock, setAdjustNewStock] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product CRUD
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSku(`SHN-${Date.now().toString().slice(-4)}`);
    setProdCategory('Woody / Spicy');
    setProdBottleSize(50);
    setProdCostPrice(65000);
    setProdSellingPrice(185000);
    setProdInitialStock(20);
    setProdMinStockAlert(5);
    setProdNotes('');
    setError(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCategory(p.category || 'Woody / Spicy');
    setProdBottleSize(p.bottleSizeMl || 50);
    setProdCostPrice(p.costPrice);
    setProdSellingPrice(p.sellingPrice);
    setProdInitialStock(p.initialStock);
    setProdMinStockAlert(p.minStockAlert || 5);
    setProdNotes(p.notes || '');
    setError(null);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setError('Nama parfum wajib diisi');
      return;
    }
    if (prodCostPrice < 0 || prodSellingPrice < 0) {
      setError('Harga tidak boleh bernilai negatif');
      return;
    }

    try {
      setLoading(true);
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: prodName,
          sku: prodSku,
          category: prodCategory,
          bottleSizeMl: prodBottleSize,
          costPrice: prodCostPrice,
          sellingPrice: prodSellingPrice,
          minStockAlert: prodMinStockAlert,
          notes: prodNotes,
        });
      } else {
        await addProduct({
          name: prodName,
          sku: prodSku,
          category: prodCategory,
          bottleSizeMl: prodBottleSize,
          costPrice: prodCostPrice,
          sellingPrice: prodSellingPrice,
          initialStock: prodInitialStock,
          currentStock: prodInitialStock,
          minStockAlert: prodMinStockAlert,
          notes: prodNotes,
          active: true,
        });
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  // Restock handler
  const openRestockModal = (p: Product) => {
    setRestockTarget(p);
    setRestockQty(10);
    setRestockCostPerUnit(p.costPrice);
    setRestockExtraCost(0);
    setRestockDate(getTodayDateString());
    setRestockNotes('');
    setRestockRecordExpense(true);
    setError(null);
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget) return;
    if (restockQty <= 0) {
      setError('Jumlah stok masuk harus lebih dari 0');
      return;
    }

    try {
      setLoading(true);
      await restockProduct(
        restockTarget.id,
        restockQty,
        restockCostPerUnit,
        restockExtraCost,
        restockDate,
        restockNotes,
        restockRecordExpense
      );
      setIsRestockModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan stok');
    } finally {
      setLoading(false);
    }
  };

  // Adjust stock handler
  const openAdjustModal = (p: Product) => {
    setAdjustTarget(p);
    setAdjustNewStock(p.currentStock);
    setAdjustReason('');
    setError(null);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    if (!adjustReason.trim()) {
      setError('Alasan penyesuaian/koreksi stok wajib diisi!');
      return;
    }

    try {
      setLoading(true);
      await adjustStock(adjustTarget.id, adjustNewStock, adjustReason);
      setIsAdjustModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal mengoreksi stok');
    } finally {
      setLoading(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'available') return p.currentStock > p.minStockAlert;
    if (statusFilter === 'low') return p.currentStock > 0 && p.currentStock <= p.minStockAlert;
    if (statusFilter === 'out') return p.currentStock <= 0;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Inventaris & Formulasi
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
            Manajemen Stok Parfum
          </h2>
          <p className="text-xs text-[#7C776D] mt-1">
            Katalog parfum shining.co, mutasi stok masuk-keluar, dan histori audit pergerakan botol.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#F3F0E8] p-1 rounded-lg border border-[#E5E1D8] flex text-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-[#1A1A1A] text-white font-medium'
                  : 'text-[#5A5751] hover:text-[#1A1A1A]'
              }`}
            >
              Katalog Produk ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'movements'
                  ? 'bg-[#1A1A1A] text-white font-medium'
                  : 'text-[#5A5751] hover:text-[#1A1A1A]'
              }`}
            >
              Audit Pergerakan ({inventoryMovements.length})
            </button>
          </div>

          <button
            onClick={openAddProductModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Parfum</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Total Botol Tersedia
          </span>
          <p className="font-serif text-xl font-bold text-[#1A1A1A] mt-1.5">
            {products.reduce((acc, p) => acc + (p.currentStock || 0), 0)} botol
          </p>
          <span className="text-[11px] text-[#7C776D]">{products.length} varian parfum aktif</span>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Nilai Persediaan
          </span>
          <p className="font-serif text-xl font-bold text-[#1A1A1A] mt-1.5">
            {formatRupiah(summary.inventoryValuation)}
          </p>
          <span className="text-[11px] text-[#7C776D]">Dihitung dari modal pokok</span>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Stok Menipis
          </span>
          <p className="font-serif text-xl font-bold text-amber-800 mt-1.5">
            {products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStockAlert).length} varian
          </p>
          <span className="text-[11px] text-amber-900">Perlu restock segera</span>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-[#7C776D] font-semibold">
            Stok Habis (0 Botol)
          </span>
          <p className="font-serif text-xl font-bold text-rose-800 mt-1.5">
            {products.filter((p) => p.currentStock <= 0).length} varian
          </p>
          <span className="text-[11px] text-rose-900">Produksi tertahan</span>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        /* CATALOG VIEW */
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs">
          {/* Filters & Search */}
          <div className="p-4 sm:p-5 border-b border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-[#7C776D]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#F3F0E8] border border-[#D5D0C5] rounded-lg px-2.5 py-1 text-xs focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="available">Tersedia</option>
                <option value="low">Stok Menipis</option>
                <option value="out">Habis</option>
              </select>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari varian, aroma, atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#8C887E] space-y-3">
              <Package className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-medium text-[#1A1A1A]">Belum Ada Produk Parfum</p>
              <p className="max-w-md mx-auto text-[#7C776D]">
                Tambahkan koleksi parfum signature shining.co Anda untuk mulai melacak persediaan dan penjualan.
              </p>
              <button
                onClick={openAddProductModal}
                className="mt-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
              >
                + Tambah Parfum Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3F0E8] border-b border-[#E5E1D8] text-[#5A5751]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Parfum & SKU</th>
                    <th className="py-3 px-4 font-semibold">Kategori / Aroma</th>
                    <th className="py-3 px-4 font-semibold">Ukuran</th>
                    <th className="py-3 px-4 font-semibold text-right">Modal / Unit</th>
                    <th className="py-3 px-4 font-semibold text-right">Harga Jual</th>
                    <th className="py-3 px-4 font-semibold text-center">Stok</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  {filteredProducts.map((p) => {
                    const isLow = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
                    const isOut = p.currentStock <= 0;
                    const margin = p.sellingPrice - p.costPrice;
                    const marginPct = p.sellingPrice > 0 ? Math.round((margin / p.sellingPrice) * 100) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#F7F5EF] transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-serif font-bold text-sm text-[#1A1A1A]">{p.name}</p>
                          <span className="font-mono text-[10px] text-[#7C776D]">{p.sku}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#5A5751]">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="w-3 h-3 text-[#9E7D52]" />
                            {p.category || 'Eau de Parfum'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#5A5751]">
                          {p.bottleSizeMl} ml
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#5A5751]">
                          {formatRupiah(p.costPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-[#1A1A1A]">
                          {formatRupiah(p.sellingPrice)}
                          <span className="block text-[10px] text-emerald-800">
                            +{marginPct}% margin
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-sm text-[#1A1A1A]">
                          {p.currentStock}
                          <span className="block text-[10px] font-normal text-[#7C776D]">
                            min {p.minStockAlert}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isOut ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rose-100 text-rose-800">
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-900">
                              Menipis
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                              Tersedia
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openRestockModal(p)}
                              title="Tambah Stok"
                              className="px-2 py-1 bg-[#1A1A1A] text-white rounded text-[11px] font-medium hover:bg-[#333] transition-colors"
                            >
                              + Restock
                            </button>
                            <button
                              onClick={() => openAdjustModal(p)}
                              title="Koreksi Stok"
                              className="p-1.5 text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-md transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditProductModal(p)}
                              title="Edit Detail"
                              className="p-1.5 text-[#5A5751] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(p.id)}
                              title="Hapus"
                              className="p-1.5 text-[#7C776D] hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      ) : (
        /* AUDIT MOVEMENTS VIEW */
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-[#E5E1D8]">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              Audit Trail Pergerakan Stok
            </h3>
            <p className="text-xs text-[#7C776D]">
              Seluruh histori penambahan, penjualan, retur, dan penyesuaian dicatat permanen dan tidak dapat dimanipulasi.
            </p>
          </div>

          {inventoryMovements.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#8C887E]">
              <History className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p>Belum ada histori pergerakan stok tercatat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3F0E8] border-b border-[#E5E1D8] text-[#5A5751]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Tanggal</th>
                    <th className="py-3 px-4 font-semibold">Produk</th>
                    <th className="py-3 px-4 font-semibold">Tipe Pergerakan</th>
                    <th className="py-3 px-4 font-semibold text-center">Perubahan (Delta)</th>
                    <th className="py-3 px-4 font-semibold text-center">Stok Awal → Akhir</th>
                    <th className="py-3 px-4 font-semibold">Alasan / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  {inventoryMovements.map((m) => {
                    const isPositive = m.quantityDelta > 0;
                    return (
                      <tr key={m.id} className="hover:bg-[#F7F5EF] transition-colors">
                        <td className="py-3 px-4 text-[#5A5751]">
                          {formatIndonesianDate(m.date)}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1A1A1A]">
                          {m.productName || 'Parfum'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              m.type === 'in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.type === 'out'
                                ? 'bg-slate-100 text-slate-800'
                                : m.type === 'return'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {m.type === 'in'
                              ? 'Stok Masuk'
                              : m.type === 'out'
                              ? 'Penjualan'
                              : m.type === 'return'
                              ? 'Retur / Batal'
                              : 'Koreksi Stok'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span
                            className={isPositive ? 'text-emerald-800' : 'text-rose-800'}
                          >
                            {isPositive ? `+${m.quantityDelta}` : m.quantityDelta} botol
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-[#7C776D]">
                          {m.previousStock} → <span className="font-semibold text-[#1A1A1A]">{m.newStock}</span>
                        </td>
                        <td className="py-3 px-4 text-[#5A5751] max-w-sm">
                          {m.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] pb-3 border-b border-[#E5E1D8]">
              {editingProduct ? 'Edit Master Parfum' : 'Tambah Varian Parfum Baru'}
            </h3>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Nama Parfum *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Velvet Bergamot"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Kode SKU *</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Kategori / Karakter Aroma</label>
                  <input
                    type="text"
                    placeholder="Contoh: Woody, Amber, Floral"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Ukuran Botol (ml)</label>
                  <input
                    type="number"
                    value={prodBottleSize}
                    onChange={(e) => setProdBottleSize(parseInt(e.target.value) || 50)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Harga Modal / Pokok (Rp) *</label>
                  <input
                    type="number"
                    value={prodCostPrice}
                    onChange={(e) => setProdCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-[#7C776D] mt-0.5 block">
                    {formatRupiah(prodCostPrice)}
                  </span>
                </div>
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Harga Jual Satuan (Rp) *</label>
                  <input
                    type="number"
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-[#7C776D] mt-0.5 block">
                    {formatRupiah(prodSellingPrice)}
                  </span>
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Stok Awal (Botol)</label>
                    <input
                      type="number"
                      value={prodInitialStock}
                      onChange={(e) => setProdInitialStock(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[#5A5751] font-medium mb-1">Batas Minimum Peringatan</label>
                    <input
                      type="number"
                      value={prodMinStockAlert}
                      onChange={(e) => setProdMinStockAlert(parseInt(e.target.value) || 5)}
                      className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {editingProduct && (
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Batas Minimum Peringatan (Botol)</label>
                  <input
                    type="number"
                    value={prodMinStockAlert}
                    onChange={(e) => setProdMinStockAlert(parseInt(e.target.value) || 5)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Catatan Formula / Deskripsi Aroma</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Top notes: bergamot, lemon; Heart notes: pepper, cedarwood; Base notes: amber."
                  value={prodNotes}
                  onChange={(e) => setProdNotes(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] pb-2 border-b border-[#E5E1D8]">
              Restock: {restockTarget.name}
            </h3>
            <p className="text-[11px] text-[#7C776D] mt-1">
              Stok saat ini: <strong className="text-[#1A1A1A]">{restockTarget.currentStock} botol</strong>
            </p>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Jumlah Tambahan Botol *</label>
                  <input
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Biaya Pokok per Botol (Rp) *</label>
                  <input
                    type="number"
                    value={restockCostPerUnit}
                    onChange={(e) => setRestockCostPerUnit(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Biaya Tambahan / Ongkir</label>
                  <input
                    type="number"
                    value={restockExtraCost}
                    onChange={(e) => setRestockExtraCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[#5A5751] font-medium mb-1">Tanggal Restock *</label>
                  <input
                    type="date"
                    value={restockDate}
                    onChange={(e) => setRestockDate(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Catatan / Keterangan Supplier</label>
                <input
                  type="text"
                  placeholder="Contoh: Restock batch parfum mawar perancis"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                />
              </div>

              <div className="bg-[#F3F0E8] border border-[#E5E1D8] p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7C776D]">Total Pembelian:</span>
                  <span className="font-semibold text-sm text-[#1A1A1A]">
                    {formatRupiah((restockQty * restockCostPerUnit) + restockExtraCost)}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#E5E1D8]">
                  <input
                    type="checkbox"
                    checked={restockRecordExpense}
                    onChange={(e) => setRestockRecordExpense(e.target.checked)}
                    className="w-3.5 h-3.5 text-black rounded-sm border-gray-300"
                  />
                  <span className="text-[11px] text-[#5A5751]">
                    Catat otomatis ke pengeluaran (kategori "Pembelian stok parfum")
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Konfirmasi Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] pb-2 border-b border-[#E5E1D8]">
              Koreksi Stok: {adjustTarget.name}
            </h3>
            <p className="text-[11px] text-[#7C776D] mt-1">
              Stok tercatat sistem: <strong className="text-[#1A1A1A]">{adjustTarget.currentStock} botol</strong>
            </p>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[#5A5751] font-medium mb-1">Stok Nyata / Fisik Baru (Botol) *</label>
                <input
                  type="number"
                  min={0}
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
                <span className="text-[10px] text-[#7C776D] mt-0.5 block">
                  Perubahan (Delta):{' '}
                  <strong className={adjustNewStock >= adjustTarget.currentStock ? 'text-emerald-800' : 'text-rose-800'}>
                    {adjustNewStock - adjustTarget.currentStock >= 0
                      ? `+${adjustNewStock - adjustTarget.currentStock}`
                      : adjustNewStock - adjustTarget.currentStock}{' '}
                    botol
                  </strong>
                </span>
              </div>

              <div>
                <label className="block text-[#5A5751] font-medium mb-1">
                  Alasan Penyesuaian (Wajib Dicatat) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Botol pecah saat packing, tester untuk bazar, atau salah hitung fisik."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 uppercase font-medium text-xs tracking-wider text-[#7C776D] hover:bg-[#EBE7DF] rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 uppercase font-semibold text-xs tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Koreksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Hapus Produk Parfum"
        message="Apakah Anda yakin ingin menghapus varian parfum ini? Seluruh riwayat transaksi penjualan yang sudah terjadi tetap aman dan terlindungi."
        confirmLabel="Hapus Produk"
        danger
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteProduct(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
