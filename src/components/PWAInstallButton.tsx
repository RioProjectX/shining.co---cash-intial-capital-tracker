import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share } from 'lucide-react';

interface Props {
  variant?: 'navbar' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already installed as an app, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <>
        <div className="px-3 py-2 bg-[#1A1A1A] text-white rounded-xl mx-3 my-2 border border-[#333] shadow-md">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-[#2B2925] flex items-center justify-center text-[#C5A880]">
              <Download className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-white">Aplikasi shining.co</p>
              <p className="text-[9px] text-[#A39D93]">Pasang di HP / Laptop</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full py-1.5 px-2 bg-[#FAF9F5] text-[#1A1A1A] hover:bg-[#EBE7DF] text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3 text-[#9E7D52]" />
            <span>Download Aplikasi</span>
          </button>
        </div>

        {/* Modal for iOS / Browser Guides */}
        {renderModals()}
      </>
    );
  }

  // Banner variant (for Dashboard or Auth)
  if (variant === 'banner') {
    return (
      <>
        <div className="p-3.5 bg-[#FAF9F5] border border-[#D5D0C5] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <img src="/pwa-192x192.png" alt="shining.co" className="w-10 h-10 rounded-xl shadow-xs" />
            <div>
              <p className="text-xs font-semibold text-[#1A1A1A]">Download Aplikasi shining.co</p>
              <p className="text-[11px] text-[#7C776D]">
                Akses cepat langsung dari layar utama tanpa membuka browser.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="shrink-0 py-2 px-3.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Download Sekarang</span>
          </button>
        </div>

        {renderModals()}
      </>
    );
  }

  // Default Navbar button variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Download Aplikasi shining.co ke HP / Komputer"
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-medium rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-[#C5A880]" />
        <span className="hidden sm:inline">Download Aplikasi</span>
      </button>

      {renderModals()}
    </>
  );

  function renderModals() {
    return (
      <>
        {/* iOS Safari Installation Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#FAF9F5] p-6 shadow-2xl border border-[#E5E1D8] relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute right-4 top-4 text-[#7C776D] hover:text-[#1A1A1A] p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img src="/pwa-192x192.png" alt="shining.co" className="w-12 h-12 rounded-xl shadow-xs" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">shining.co</h3>
                  <p className="text-xs text-[#7C776D]">Pasang di iPhone / iPad</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#4A4741] bg-white p-3.5 rounded-xl border border-[#E5E1D8]">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Buka halaman ini di browser <strong>Safari</strong>, lalu ketuk tombol <strong>Bagikan (Share <Share className="w-3.5 h-3.5 inline mx-0.5" />)</strong> di bilah bawah browser.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Ketuk <strong>Tambah</strong> di pojok kanan atas. Ikon aplikasi shining.co akan langsung muncul di layar HP Anda!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#1A1A1A] py-2.5 text-xs font-semibold text-white hover:bg-[#333] transition-colors"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        )}

        {/* Desktop / Android Fallback Modal */}
        {showDesktopGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#FAF9F5] p-6 shadow-2xl border border-[#E5E1D8] relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="absolute right-4 top-4 text-[#7C776D] hover:text-[#1A1A1A] p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img src="/pwa-192x192.png" alt="shining.co" className="w-12 h-12 rounded-xl shadow-xs" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">shining.co</h3>
                  <p className="text-xs text-[#7C776D]">Download Aplikasi Web (PWA)</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#4A4741] bg-white p-3.5 rounded-xl border border-[#E5E1D8]">
                <p className="leading-relaxed">
                  Untuk menginstal aplikasi ini ke komputer atau ponsel Android Anda:
                </p>
                <div className="flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#9E7D52] shrink-0 mt-0.5" />
                  <p>
                    <strong>Di Chrome / Edge:</strong> Klik ikon <strong>Install Aplikasi</strong> (<Download className="w-3.5 h-3.5 inline mx-0.5" />) di pojok kanan bilah alamat (URL bar) atau menu titik tiga (⋮) &gt; <em>"Pasang Aplikasi"</em>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    Setelah dipasang, aplikasi dapat dibuka langsung dari Desktop / Home Screen dengan logo resmi dan bekerja secara offline!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDesktopGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#1A1A1A] py-2.5 text-xs font-semibold text-white hover:bg-[#333] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
};
