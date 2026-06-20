import React from 'react';

interface WalletCardProps {
  balanceCDF: number;
  balanceUSD: number;
  textColorCDF?: string;
  textColorUSD?: string;
}

export function WalletCard({ 
  balanceCDF, 
  balanceUSD, 
  textColorCDF = "text-emerald-400", 
  textColorUSD = "text-yellow-500" 
}: WalletCardProps) {
  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
        <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Solde Principal (CDF)</span>
        <span className={`text-2xl font-mono font-black ${textColorCDF} block`}>{balanceCDF.toLocaleString("fr-FR")} CDF</span>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
        <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Solde Secondaire (USD)</span>
        <span className={`text-2xl font-mono font-black ${textColorUSD} block`}>${balanceUSD.toFixed(2)} USD</span>
      </div>
    </>
  );
}

export function WalletMini({
  balanceCDF,
  balanceUSD,
  textColorCDF = "text-emerald-400",
  textColorUSD = "text-yellow-500"
}: WalletCardProps) {
  return (
    <div className="text-right">
      <span className={`text-xs font-black ${textColorCDF} block mt-0.5`}>
        {balanceCDF.toLocaleString("fr-FR")} CDF
      </span>
      <span className={`text-xs font-black ${textColorUSD} block mt-0.5`}>
        ${balanceUSD.toFixed(2)} USD
      </span>
    </div>
  );
}
