import React from 'react';
import { SyncStatus } from '../context/BusinessContext';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface Props {
  status: SyncStatus;
  lastSyncTime: Date | null;
}

export const SyncStatusBadge: React.FC<Props> = ({ status, lastSyncTime }) => {
  return (
    <div className="flex items-center gap-2 text-xs text-[#5A5751] px-2.5 py-1 rounded-full bg-[#F3F0E8] border border-[#E5E1D8]">
      {status === 'synced' && (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="font-medium text-[#2D2B2A]">Cloud Sync</span>
          {lastSyncTime && (
            <span className="hidden sm:inline text-[#8C887E]">
              {lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </>
      )}

      {status === 'saving' && (
        <>
          <RefreshCw className="w-3 h-3 text-[#9E7D52] animate-spin" />
          <span className="text-[#9E7D52] font-medium">Menyimpan...</span>
        </>
      )}

      {status === 'offline' && (
        <>
          <CloudOff className="w-3 h-3 text-amber-700" />
          <span className="text-amber-800 font-medium">Mode Offline</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span className="text-rose-700 font-medium">Gagal Sync</span>
        </>
      )}
    </div>
  );
};
