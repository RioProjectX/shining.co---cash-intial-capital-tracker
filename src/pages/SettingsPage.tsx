import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { testConnection } from '../lib/firebase';
import {
  Settings,
  Store,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Mail,
  User,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { businessSettings, updateSettings, syncStatus } = useBusiness();
  const { currentUser, userProfile, logout } = useAuth();

  const [name, setName] = useState(businessSettings?.name || 'shining.co');
  const [tagline, setTagline] = useState(businessSettings?.tagline || 'shine with just one spray');
  const [currency, setCurrency] = useState(businessSettings?.currency || 'IDR');
  const [timezone, setTimezone] = useState(businessSettings?.timezone || 'Asia/Jakarta');
  const [defaultMinStock, setDefaultMinStock] = useState(businessSettings?.defaultMinStock || 5);
  const [phone, setPhone] = useState(businessSettings?.phone || '');
  const [address, setAddress] = useState(businessSettings?.address || '');

  const [saving, setSaving] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateSettings({
        name,
        tagline,
        currency,
        timezone,
        defaultMinStock,
        phone,
        address,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    try {
      const ok = await testConnection();
      if (ok) {
        setTestResult('Koneksi Cloud Firestore berhasil dan online.');
      } else {
        setTestResult('Firestore terhubung namun dalam status offline cache.');
      }
    } catch (err: any) {
      setTestResult(`Gagal terhubung: ${err.message}`);
    } finally {
      setTestingConn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-[#E5E1D8] pb-5">
        <span className="text-[11px] uppercase tracking-widest text-[#7C776D] font-semibold">
          Konfigurasi Sistem
        </span>
        <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight mt-0.5">
          Pengaturan Bisnis shining.co
        </h2>
        <p className="text-xs text-[#7C776D] mt-1">
          Atur informasi merek wewangian, preferensi mata uang, dan periksa status cloud database.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Pengaturan bisnis berhasil diperbarui dan tersimpan ke Cloud Firestore.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-6 sm:p-7 space-y-5 text-xs shadow-xs">
        <div className="border-b border-[#E5E1D8] pb-3">
          <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
            Identitas Merek Parfum
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Nama Bisnis</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-black focus:outline-hidden"
              required
            />
          </div>
          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Tagline Merek</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs italic focus:ring-1 focus:ring-black focus:outline-hidden"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Mata Uang</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            >
              <option value="IDR">IDR (Rupiah Indonesia)</option>
            </select>
          </div>
          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Zona Waktu</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            >
              <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
              <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
              <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
            </select>
          </div>
          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Batas Minimum Stok Default</label>
            <input
              type="number"
              min={1}
              value={defaultMinStock}
              onChange={(e) => setDefaultMinStock(parseInt(e.target.value) || 5)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Nomor Kontak WhatsApp Bisnis</label>
            <input
              type="text"
              placeholder="Contoh: 081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Alamat Studio / Workshop</label>
            <input
              type="text"
              placeholder="Contoh: Jl. Kemang Raya No. 12, Jakarta Selatan"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>

      {/* Cloud Sync Diagnostic Card */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-6 sm:p-7 space-y-4 text-xs shadow-xs">
        <div className="border-b border-[#E5E1D8] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              Koneksi & Sinkronisasi Cloud Firestore
            </h3>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-semibold uppercase tracking-wider">
            Enterprise Security
          </span>
        </div>

        <div className="space-y-2 text-[#5A5751]">
          <p>
            Status Sinkronisasi Saat Ini:{' '}
            <strong className="text-[#1A1A1A] capitalize">{syncStatus}</strong>
          </p>
          <p className="text-[11px] text-[#7C776D] leading-relaxed">
            Data Anda tersimpan secara multi-device dan real-time di Cloud Firestore. Jika koneksi terputus, aplikasi beralih ke cache lokal dan akan menyinkronkan kembali saat online.
          </p>
        </div>

        {testResult && (
          <div className="p-3 bg-[#F3F0E8] border border-[#E5E1D8] rounded-lg text-xs font-medium text-[#1A1A1A]">
            {testResult}
          </div>
        )}

        <div className="pt-1 flex gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConn}
            className="flex items-center gap-2 px-4 py-2 border border-[#D5D0C5] text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConn ? 'animate-spin' : ''}`} />
            <span>Uji Koneksi Server</span>
          </button>
        </div>
      </div>

      {/* User Account Card */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-6 sm:p-7 space-y-4 text-xs shadow-xs">
        <div className="border-b border-[#E5E1D8] pb-3">
          <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
            Informasi Akun Pemilik
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-[#F3F0E8] rounded-lg">
            <User className="w-4 h-4 text-[#7C776D]" />
            <div>
              <span className="text-[10px] text-[#7C776D] block">Nama Pemilik</span>
              <span className="font-medium text-[#1A1A1A]">{userProfile?.displayName || currentUser?.displayName || '-'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#F3F0E8] rounded-lg">
            <Mail className="w-4 h-4 text-[#7C776D]" />
            <div>
              <span className="text-[10px] text-[#7C776D] block">Email Terdaftar</span>
              <span className="font-medium text-[#1A1A1A]">{currentUser?.email}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-start">
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
