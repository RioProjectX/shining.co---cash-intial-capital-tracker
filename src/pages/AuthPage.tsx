import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { loginWithEmail, registerWithEmail, resetPassword } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isForgot) {
        await resetPassword(email);
        setSuccessMsg('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
        setLoading(false);
        return;
      }

      if (isRegister) {
        await registerWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-10 selection:bg-[#EBE7DF]">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-sm">
        <div className="inline-flex items-center gap-2 mb-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
            shining.co
          </h1>
          <span className="w-2 h-2 rounded-full bg-[#9E7D52]"></span>
        </div>
        <p className="font-serif italic text-xs tracking-widest uppercase text-[#7C776D]">
          shine with just one spray
        </p>
        <p className="text-xs text-[#8C887E] mt-2">
          Smart Business & Cashflow Tracker untuk Bisnis Parfum Profesional
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-md">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && !isForgot && (
            <div>
              <label className="block text-[#5A5751] font-medium mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Nama Pemilik / Staf"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Email / ID Pengguna</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="nama@shining.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-medium"
                required
              />
            </div>
          </div>

          {!isForgot && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[#5A5751] font-medium">Kata Sandi (Password)</label>
                <button
                  type="button"
                  onClick={() => setIsForgot(true)}
                  className="text-[11px] text-[#7C776D] hover:text-[#1A1A1A] underline cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden font-medium"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : isForgot ? (
              <span>Kirim Tautan Pemulihan</span>
            ) : isRegister ? (
              <>
                <span>Daftar Akun Baru</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer toggles */}
        <div className="mt-5 text-center text-xs text-[#7C776D] border-t border-[#E5E1D8] pt-4">
          {isForgot ? (
            <button
              onClick={() => {
                setIsForgot(false);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-[#1A1A1A] font-medium hover:underline"
            >
              Kembali ke Halaman Masuk
            </button>
          ) : isRegister ? (
            <p>
              Sudah memiliki akun?{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-[#1A1A1A] font-medium hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          ) : (
            <p>
              Ingin membuat akun kasir / staf baru?{' '}
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-[#1A1A1A] font-medium hover:underline"
              >
                Daftar akun
              </button>
            </p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#8C887E] mt-6 text-center">
        Data bisnis shining.co tersimpan terenkripsi di Google Cloud Firestore.
      </p>
    </div>
  );
};
