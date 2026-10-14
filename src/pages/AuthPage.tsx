import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();

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

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#EBE7DF]">
      {/* Brand Header */}
      <div className="text-center mb-8 max-w-sm">
        <div className="inline-flex items-center gap-2 mb-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
            shining.co
          </h1>
          <span className="w-2 h-2 rounded-full bg-[#9E7D52]"></span>
        </div>
        <p className="font-serif italic text-xs tracking-widest uppercase text-[#7C776D]">
          shine with just one spray
        </p>
        <p className="text-xs text-[#8C887E] mt-3">
          Smart Business & Cashflow Tracker untuk Bisnis Parfum Profesional
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="mb-6">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A]">
            {isForgot
              ? 'Atur Ulang Kata Sandi'
              : isRegister
              ? 'Daftar Akun Pemilik Usaha'
              : 'Masuk ke Dashboard'}
          </h2>
          <p className="text-xs text-[#7C776D] mt-1">
            {isForgot
              ? 'Masukkan email akun shining.co Anda'
              : isRegister
              ? 'Kelola stok, arus kas, dan keuangan parfum secara aman'
              : 'Akses seluruh data transaksi bisnis Anda'}
          </p>
        </div>

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
                  placeholder="Nama Pemilik"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#5A5751] font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="nama@shining.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                required
              />
            </div>
          </div>

          {!isForgot && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[#5A5751] font-medium">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => setIsForgot(true)}
                  className="text-[11px] text-[#7C776D] hover:text-[#1A1A1A] underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C887E] absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#D5D0C5] rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-hidden"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : isForgot ? (
              <span>Kirim Tautan Pemulihan</span>
            ) : isRegister ? (
              <>
                <span>Daftar Akun</span>
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

        {/* Google OAuth Option */}
        {!isForgot && (
          <div className="mt-5 pt-5 border-t border-[#E5E1D8]">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 border border-[#D5D0C5] hover:bg-[#F3F0E8] text-xs font-medium text-[#1A1A1A] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Akun Google</span>
            </button>
          </div>
        )}

        {/* Footer toggles */}
        <div className="mt-5 text-center text-xs text-[#7C776D]">
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
              Belum memiliki akun?{' '}
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-[#1A1A1A] font-medium hover:underline"
              >
                Daftar sekarang
              </button>
            </p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#8C887E] mt-8 text-center">
        Data bisnis Anda disimpan secara terenkripsi di Google Cloud Firestore.
      </p>
    </div>
  );
};
