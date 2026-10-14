import React from 'react';
import { Sale } from '../types';
import { formatIndonesianDate, formatRupiah } from '../lib/formatters';
import { Printer, X } from 'lucide-react';

interface Props {
  sale: Sale | null;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<Props> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="print:hidden absolute top-4 right-4 p-2 text-[#8C887E] hover:text-[#1A1A1A] hover:bg-[#EBE7DF] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Area */}
        <div id="receipt-print-area" className="space-y-6 text-[#1A1A1A]">
          {/* Header */}
          <div className="text-center border-b border-[#E5E1D8] pb-5">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A]">shining.co</h2>
            <p className="text-xs uppercase tracking-widest text-[#7C776D] italic mt-0.5">
              shine with just one spray
            </p>
            <p className="text-xs text-[#8C887E] mt-2">
              Bukti Transaksi & Nota Penjualan Resmi
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#7C776D] block">No. Faktur:</span>
              <span className="font-mono font-medium text-[#1A1A1A]">{sale.invoiceNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[#7C776D] block">Tanggal:</span>
              <span className="font-medium text-[#1A1A1A]">{formatIndonesianDate(sale.date)}</span>
            </div>
            <div>
              <span className="text-[#7C776D] block">Pelanggan:</span>
              <span className="font-medium text-[#1A1A1A]">{sale.customerName || 'Pelanggan Umum'}</span>
            </div>
            <div className="text-right">
              <span className="text-[#7C776D] block">Metode Pembayaran:</span>
              <span className="uppercase font-medium text-[#1A1A1A]">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Item details */}
          <div className="border border-[#E5E1D8] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F0E8] border-b border-[#E5E1D8] text-[#5A5751]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Produk Parfum</th>
                  <th className="py-2.5 px-3 font-medium text-center">Qty</th>
                  <th className="py-2.5 px-3 font-medium text-right">Harga</th>
                  <th className="py-2.5 px-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-medium text-[#1A1A1A]">{sale.productName}</p>
                    <p className="text-[10px] text-[#7C776D]">Eau de Parfum</p>
                  </td>
                  <td className="py-3 px-3 text-center">{sale.quantity}</td>
                  <td className="py-3 px-3 text-right">{formatRupiah(sale.unitPrice)}</td>
                  <td className="py-3 px-3 text-right font-medium">{formatRupiah(sale.quantity * sale.unitPrice)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs border-t border-[#E5E1D8] pt-4">
            <div className="flex justify-between text-[#5A5751]">
              <span>Subtotal</span>
              <span>{formatRupiah(sale.quantity * sale.unitPrice)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Diskon</span>
                <span>-{formatRupiah(sale.discount)}</span>
              </div>
            )}
            {sale.extraCost > 0 && (
              <div className="flex justify-between text-[#5A5751]">
                <span>Biaya Tambahan / Ongkir</span>
                <span>+{formatRupiah(sale.extraCost)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold text-[#1A1A1A] border-t border-[#E5E1D8] pt-2">
              <span>Total Tagihan</span>
              <span>{formatRupiah(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#5A5751]">
              <span>Jumlah Dibayar</span>
              <span className="font-medium text-[#1A1A1A]">{formatRupiah(sale.amountPaid)}</span>
            </div>
            {sale.remainingBalance > 0 ? (
              <div className="flex justify-between text-xs text-rose-700 font-medium">
                <span>Sisa Piutang</span>
                <span>{formatRupiah(sale.remainingBalance)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-xs text-emerald-700 font-medium">
                <span>Status Pembayaran</span>
                <span>LUNAS</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="text-xs text-[#7C776D] bg-[#F3F0E8] p-3 rounded-lg">
              <span className="font-medium block text-[#5A5751]">Catatan:</span>
              {sale.notes}
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-[#E5E1D8] text-[11px] text-[#8C887E]">
            <p>Terima kasih telah berbelanja wewangian di shining.co</p>
            <p className="italic mt-0.5">Semoga harimu selalu bersinar dan memikat.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="print:hidden flex justify-end gap-3 mt-6 pt-4 border-t border-[#E5E1D8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#5A5751] hover:bg-[#EBE7DF] rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Nota
          </button>
        </div>
      </div>
    </div>
  );
};
