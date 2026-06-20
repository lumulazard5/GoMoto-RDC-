import React, { useState, useEffect } from "react";
import { 
  Tag, 
  Ticket, 
  Percent, 
  Award, 
  Gift, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  Settings, 
  Check, 
  Copy, 
  RotateCcw, 
  Info, 
  MapPin, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  Gem, 
  Crown, 
  Coins, 
  DollarSign, 
  X, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { T } from "./Translate";
import { AppLanguage } from "../lib/translations";
import {
  DiscountCode,
  LimitedTimeOffer,
  LoyaltyReward,
  UserLoyaltyState,
  getDiscountCodesStore,
  saveDiscountCodesStore,
  getLimitedOffersStore,
  saveLimitedOffersStore,
  getLoyaltyRewardsStore,
  saveLoyaltyRewardsStore,
  getUserLoyaltyState,
  saveUserLoyaltyState,
  applyPromoToAmount
} from "../lib/promo_store";

// ==========================================
// 1. CLIENT PROMOTION HUB
// ==========================================

interface ClientPromotionHubProps {
  userId: string;
  completedRidesCount: number;
  lang: AppLanguage;
  onApplyPromo: (code: DiscountCode | null) => void;
  appliedPromo: DiscountCode | null;
  activePickupCommune?: string;
  activeDropoffCommune?: string;
  currentEstimatedFareCDF?: number;
}

export function ClientPromotionHub({
  userId,
  completedRidesCount,
  lang,
  onApplyPromo,
  appliedPromo,
  activePickupCommune = "",
  activeDropoffCommune = "",
  currentEstimatedFareCDF = 0
}: ClientPromotionHubProps) {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [limitedOffers, setLimitedOffers] = useState<LimitedTimeOffer[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);
  const [loyaltyState, setLoyaltyState] = useState<UserLoyaltyState | null>(null);

  // Input states
  const [inputCode, setInputCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  
  // Tab within the hub
  const [activeTab, setActiveTab] = useState<"offers" | "loyalty" | "coupons">("offers");

  // Load store states on mount and user sync
  useEffect(() => {
    setDiscountCodes(getDiscountCodesStore());
    setLimitedOffers(getLimitedOffersStore().filter(o => o.active));
    setLoyaltyRewards(getLoyaltyRewardsStore());
    setLoyaltyState(getUserLoyaltyState(userId, completedRidesCount));
  }, [userId, completedRidesCount]);

  // Sync state back helper
  const syncStore = (updatedCodes: DiscountCode[]) => {
    setDiscountCodes(updatedCodes);
    saveDiscountCodesStore(updatedCodes);
  };

  const handleApplyCouponCode = (codeString: string) => {
    setCouponError(null);
    setCouponSuccess(null);
    const cleaned = codeString.trim().toUpperCase();
    if (!cleaned) return;

    const matched = getDiscountCodesStore().find(c => c.code === cleaned);

    if (!matched) {
      setCouponError("Code promotionnel inconnu ou expiré.");
      return;
    }

    if (!matched.active) {
      setCouponError("Ce code de réduction est actuellement désactivé.");
      return;
    }

    // Check expiry
    const expiry = new Date(matched.validTo);
    if (expiry < new Date()) {
      setCouponError(`Ce code a expiré le ${expiry.toLocaleDateString("fr-CD")}.`);
      return;
    }

    // Check limits
    if (matched.timesUsed >= matched.usageLimit) {
      setCouponError("Ce code a atteint sa limite maximale d'utilisations.");
      return;
    }

    // Check minimum fare
    if (currentEstimatedFareCDF > 0 && currentEstimatedFareCDF < matched.minRideAmountCDF) {
      setCouponError(`Ce code s'applique uniquement aux trajets d'au moins ${matched.minRideAmountCDF.toLocaleString()} CDF.`);
      return;
    }

    // Success!
    onApplyPromo(matched);
    setCouponSuccess(`Code ${matched.code} appliqué avec succès !`);
    setInputCode("");
    
    // Auto-update times used in storage
    const updated = getDiscountCodesStore().map(c => {
      if (c.id === matched.id) {
        return { ...c, timesUsed: c.timesUsed + 1 };
      }
      return c;
    });
    syncStore(updated);
  };

  // Convert loyalty points to voucher
  const handleRedeemReward = (reward: LoyaltyReward) => {
    if (!loyaltyState) return;
    if (loyaltyState.points < reward.pointsCost) {
      alert("Solde de points de fidélité insuffisant pour débloquer cette récompense.");
      return;
    }

    const confirmSwap = window.confirm(
      `Échanger ${reward.pointsCost} points de fidélité contre un coupon "${reward.title}" ?`
    );
    if (!confirmSwap) return;

    // Generate unique code, e.g., LOYAL-H7G29
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const generatedCode = `LOYAL-${randPart}`;

    // Create a new DiscountCode element
    const newCode: DiscountCode = {
      id: `claimed-${Date.now()}-${randPart}`,
      code: generatedCode,
      discountType: reward.rewardType === "discount_percent" ? "percent" : "fixed",
      discountValue: reward.rewardValue,
      minRideAmountCDF: 1000,
      maxDiscountCDF: reward.rewardType === "discount_percent" ? 5000 : reward.rewardValue,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0], // 30 days valid
      usageLimit: 1,
      timesUsed: 0,
      active: true,
      description: `Coupon fidélité d'une valeur de ${reward.rewardValue}${reward.rewardType === "discount_percent" ? "%" : " CDF"}.`,
      createdFromLoyalty: true
    };

    // Save discount code to store
    const updatedCodes = [newCode, ...getDiscountCodesStore()];
    syncStore(updatedCodes);

    // Save updated loyalty state
    const updatedLoyalty: UserLoyaltyState = {
      ...loyaltyState,
      points: loyaltyState.points - reward.pointsCost,
      claimedCodes: [generatedCode, ...loyaltyState.claimedCodes]
    };
    setLoyaltyState(updatedLoyalty);
    saveUserLoyaltyState(userId, updatedLoyalty);

    // Auto-apply this newly redeemed code!
    onApplyPromo(newCode);
    alert(`Félicitations ! Votre code unique ${generatedCode} a été créé et appliqué automatiquement à votre trajet actuel.`);
    setActiveTab("coupons");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  // Check which limited offers match active route
  const getMatchingOffers = () => {
    return limitedOffers.filter(offer => {
      if (!offer.communeTarget) return true;
      const target = offer.communeTarget.toLowerCase();
      const match = (activePickupCommune.toLowerCase().includes(target) ||
                     activeDropoffCommune.toLowerCase().includes(target));
      return match;
    });
  };

  const matchingOffers = getMatchingOffers();

  // Tier design values
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Argent": return <Crown className="w-5 h-5 text-slate-300" />;
      case "Or": return <Crown className="w-5 h-5 text-amber-500" />;
      case "Diamant 💎": return <Gem className="w-5 h-5 text-[#38bdf8] animate-pulse" />;
      default: return <Award className="w-5 h-5 text-amber-700" />;
    }
  };

  const getTierColors = (tier: string) => {
    switch (tier) {
      case "Argent": return { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-350" };
      case "Or": return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" };
      case "Diamant 💎": return { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400" };
      default: return { bg: "bg-amber-700/10", border: "border-amber-700/30", text: "text-amber-700" };
    }
  };

  const tStyles = loyaltyState ? getTierColors(loyaltyState.tier) : { bg: "", border: "", text: "" };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg select-none relative overflow-hidden font-sans text-white">
      {/* GLOW DECORATOR */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/5 blur-[50px] pointer-events-none rounded-full" />
      
      {/* HEADER BAR ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600/10 border border-blue-500/20 p-2 rounded-2xl text-blue-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#f3f4f6] text-sm">Promotions, Réductions & Fidélité</h4>
            <p className="text-[10px] text-slate-400 tracking-wide font-mono">
              Coordonné par le Service Fidélité GoMoto RDC
            </p>
          </div>
        </div>
        
        {/* TAB BUTTONS */}
        <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("offers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "offers" 
                ? "bg-slate-800 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Saisonniers ({limitedOffers.length})
          </button>
          <button
            onClick={() => setActiveTab("loyalty")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "loyalty" 
                ? "bg-slate-800 text-amber-400 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Fidélité {loyaltyState && `(${loyaltyState.points} pts)`}
          </button>
          <button
            onClick={() => setActiveTab("coupons")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "coupons" 
                ? "bg-slate-800 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Mes Coupons
          </button>
        </div>
      </div>

      {/* CORE FORM & TAB BODY CONTROLLER */}
      <div className="py-4.5 space-y-4">
        
        {/* 1. OFFERS TAB */}
        {activeTab === "offers" && (
          <div className="space-y-4">
            
            {/* MATCHING COMMUNE ALERT WIDGET */}
            {(activePickupCommune || activeDropoffCommune) && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 rounded-2xl flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Détection Commune Active : {activePickupCommune || activeDropoffCommune}
                  </span>
                  <span className="text-slate-400 text-[11px] leading-normal mt-0.5 block">
                    {matchingOffers.length > 0 
                      ? `Félicitations ! Nous avons détecté ${matchingOffers.length} offre(s) applicable(s) pour ce trajet.` 
                      : "Aucun rabais géographique spécifique trouvé, mais profitez de nos codes génériques ci-dessous !"}
                  </span>
                </div>
              </div>
            )}

            {/* OFFERS SCROLL/GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {limitedOffers.map((offer) => {
                const isMatching = offer.communeTarget 
                  ? (activePickupCommune.toLowerCase().includes(offer.communeTarget.toLowerCase()) || 
                     activeDropoffCommune.toLowerCase().includes(offer.communeTarget.toLowerCase()))
                  : true;

                return (
                  <div 
                    key={offer.id} 
                    className={`relative rounded-2.5xl p-4.5 border overflow-hidden flex flex-col justify-between transition-all ${
                      isMatching 
                        ? "bg-slate-900 border-slate-755/90 shadow-lg shadow-emerald-950/10 scale-[1.01]" 
                        : "bg-slate-900/60 border-slate-850 opacity-80"
                    }`}
                  >
                    {/* ACCENT LINE PROGRESSIVE */}
                    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${offer.bannerColor}`} />
                    
                    <div className="pl-3.5 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>Expire : {offer.validTo}</span>
                        </span>
                        
                        {offer.communeTarget && (
                          <span className="bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8.5px] font-bold font-mono">
                            📍 {offer.communeTarget}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                          {offer.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          {offer.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-[#10b981]/15 text-[#34d399] px-2.5 py-1 rounded-xl text-[10.5px] font-black w-max">
                        <Percent className="w-3.5 h-3.5" />
                        <span>-{offer.discountPercent}% APPLIQUÉ DIRECTEMENT</span>
                      </div>
                    </div>

                    {isMatching && offer.communeTarget ? (
                      <div className="mt-3.5 pl-3.5 border-t border-slate-800 pt-2.5 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                          <CheckCircle className="w-3.5 h-3.5 fill-emerald-500/10" />
                          <span>Eligibilité Validée</span>
                        </span>
                        <span className="text-slate-500">Trajet {offer.communeTarget} actif</span>
                      </div>
                    ) : offer.communeTarget ? (
                      <div className="mt-3.5 pl-3.5 border-t border-slate-800/50 pt-2.5 flex items-center justify-between text-[9px] text-slate-500">
                        <span>Indisponible pour ce trajet</span>
                        <span>Requis : {offer.communeTarget}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* DIRECT COUPON APPLY WORKFLOW */}
            <div className="bg-slate-900 border border-slate-800 rounded-2.5xl p-4.5 space-y-3.5">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-slate-350" />
                <h5 className="text-[12px] font-extrabold text-slate-200">
                  Appliquer un Code Promotionnel Saisonnier
                </h5>
              </div>

              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Saisir le code (Ex : KNS20)"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono tracking-widest uppercase"
                  />
                  {appliedPromo && (
                    <button
                      type="button"
                      onClick={() => onApplyPromo(null)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      title="Retirer le code"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleApplyCouponCode(inputCode)}
                  className="bg-blue-600 hover:bg-blue-500 active:scale-95 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Appliquer
                </button>
              </div>

              {/* MESSAGE FEEDBACK */}
              <AnimatePresence mode="wait">
                {couponError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl text-[11px] text-red-400 font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{couponError}</span>
                  </motion.div>
                )}
                {couponSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl text-[11px] text-emerald-400 font-medium flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{couponSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* APPLIED PROMO STATUS */}
              {appliedPromo && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-[#34d399] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Code actif : {appliedPromo.code}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {appliedPromo.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onApplyPromo(null);
                      setCouponSuccess(null);
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase"
                  >
                    Retirer
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 2. LOYALTY TAB */}
        {activeTab === "loyalty" && loyaltyState && (
          <div className="space-y-4">
            
            {/* LOYALTY CARD OVERVIEW */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden flex flex-col md:flex-row gap-5 items-center justify-between">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 blur-[40px] pointer-events-none rounded-full" />
              
              <div className="space-y-3.5 text-center md:text-left w-full">
                <div className="flex items-center gap-2 p-1.5 pr-3 w-max rounded-full border bg-slate-950 border-slate-850 mx-auto md:mx-0">
                  <div className={`p-1 rounded-full ${tStyles.bg} ${tStyles.text}`}>
                    {getTierIcon(loyaltyState.tier)}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${tStyles.text}`}>
                    Rang GoMoto : {loyaltyState.tier}
                  </span>
                </div>

                <div>
                  <h5 className="font-extrabold text-white text-base">
                    Chauffeur & Rider Fidèle en RDC
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Vous accumulez **25 points** de fidélité pour chaque course terminée. Échangez ces points contre des voyages bruts gratuits !
                  </p>
                </div>

                {/* Progress bar to next Level */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Progrès de courses ({loyaltyState.ridesCompletedCount} trajets)</span>
                    <span>Prochain grade à 10</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-850 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all" 
                      style={{ width: `${Math.min(100, (loyaltyState.ridesCompletedCount / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* POINTS CHANGER */}
              <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-2.5xl text-center flex flex-col items-center justify-center min-w-[150px] shrink-0 w-full sm:w-auto">
                <Coins className="w-8 h-8 text-amber-500 animate-pulse mb-1.5" />
                <span className="text-2xl font-black text-amber-400 font-mono">{loyaltyState.points}</span>
                <span className="text-[9px] text-slate-400 tracking-wider uppercase font-mono mt-0.5">
                  Points Disponibles
                </span>
              </div>
            </div>

            {/* REWARDS STORE GRID */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">Échanger vos Points de Fidélité :</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {loyaltyRewards.map((reward) => {
                  const canRedeem = loyaltyState.points >= reward.pointsCost;
                  return (
                    <div 
                      key={reward.id}
                      className={`bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all ${
                        canRedeem ? "hover:border-slate-700 hover:bg-slate-850" : "opacity-60"
                      }`}
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono w-max block">
                          💎 {reward.pointsCost} PTS
                        </span>
                        <h6 className="font-extrabold text-xs text-white leading-normal">
                          {reward.title}
                        </h6>
                        <p className="text-[10px] text-slate-450 leading-snug">
                          {reward.description}
                        </p>
                      </div>

                      <button
                        disabled={!canRedeem}
                        onClick={() => handleRedeemReward(reward)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          canRedeem 
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950" 
                            : "bg-slate-950 border border-slate-850 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        Échanger
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 3. CLAIMED COUPONS TAB */}
        {activeTab === "coupons" && (
          <div className="space-y-3.5">
            <span className="text-[11px] text-slate-400 font-bold block">
              Vos codes promotionnels & cartes cadeaux actifs :
            </span>

            {discountCodes.length === 0 ? (
              <div className="text-center py-6">
                <Ticket className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
                <p className="text-xs text-slate-400 mt-2">Aucun coupon disponible actuellement.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {discountCodes.map((code) => {
                  const isCurrentApplied = appliedPromo?.id === code.id;
                  const isClaimedFromLoyalty = code.createdFromLoyalty;

                  return (
                    <div 
                      key={code.id}
                      className={`border rounded-2xl p-3.5 flex items-center justify-between gap-3 relative overflow-hidden transition-all ${
                        isCurrentApplied 
                          ? "bg-slate-900 border-emerald-500/50" 
                          : "bg-slate-900/60 border-slate-850"
                      }`}
                    >
                      {/* Ticket pattern circle dots in side margins */}
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 rounded-full border border-slate-850" />
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 rounded-full border border-slate-850" />

                      <div className="pl-3.5 space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <code className="text-sm font-black font-mono text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                            {code.code}
                          </code>
                          {isClaimedFromLoyalty && (
                            <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[8px] font-bold">
                              Fidélité 💎
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal truncate">
                          {code.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
                        {/* Copy Code */}
                        <button
                          onClick={() => copyToClipboard(code.code, code.id)}
                          className="bg-slate-950 hover:bg-slate-900 p-2 rounded-lg text-slate-400 hover:text-white"
                          title="Copier le code"
                        >
                          {copiedCodeId === code.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Apply directly */}
                        <button
                          onClick={() => {
                            if (isCurrentApplied) {
                              onApplyPromo(null);
                            } else {
                              onApplyPromo(code);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                            isCurrentApplied 
                              ? "bg-red-500/15 text-red-400 border border-red-500/20" 
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25"
                          }`}
                        >
                          {isCurrentApplied ? "Retirer" : "Appliquer"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ==========================================
// 2. ADMIN PROMOTION PANEL
// ==========================================

interface AdminPromotionPanelProps {
  lang: AppLanguage;
  adminName: string;
}

export function AdminPromotionPanel({ lang, adminName }: AdminPromotionPanelProps) {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [limitedOffers, setLimitedOffers] = useState<LimitedTimeOffer[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);

  // Toggles and views
  const [activeSegment, setActiveSegment] = useState<"codes" | "offers" | "rewards">("codes");
  const [showCreator, setShowCreator] = useState(false);

  // Form states - Codes
  const [newCodeName, setNewCodeName] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("15");
  const [minAmCDF, setMinAmCDF] = useState("2000");
  const [maxDCDF, setMaxDCDF] = useState("3000");
  const [validTo, setValidTo] = useState("");
  const [usageLimit, setUsageLimit] = useState("100");
  const [description, setDescription] = useState("");

  // Form states - Offers
  const [offerTitle, setOfferTitle] = useState("");
  const [offerSubtitle, setOfferSubtitle] = useState("");
  const [offerPercent, setOfferPercent] = useState("15");
  const [offerCommune, setOfferCommune] = useState("");
  const [offerValidTo, setOfferValidTo] = useState("");
  const [offerColor, setOfferColor] = useState("from-purple-600 to-indigo-600");
  const [offerIcon, setOfferIcon] = useState<LimitedTimeOffer["iconName"]>("zap");

  useEffect(() => {
    setDiscountCodes(getDiscountCodesStore());
    setLimitedOffers(getLimitedOffersStore());
    setLoyaltyRewards(getLoyaltyRewardsStore());
  }, []);

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) return;

    const newCode: DiscountCode = {
      id: `promo-${Date.now()}`,
      code: newCodeName.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minRideAmountCDF: Number(minAmCDF),
      maxDiscountCDF: Number(maxDCDF),
      validFrom: new Date().toISOString().split("T")[0],
      validTo: validTo || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
      usageLimit: Number(usageLimit),
      timesUsed: 0,
      active: true,
      description: description || `${discountValue}${discountType === "percent" ? "%" : " CDF"} de rabais.`
    };

    const updated = [newCode, ...discountCodes];
    setDiscountCodes(updated);
    saveDiscountCodesStore(updated);
    
    // reset
    setNewCodeName("");
    setDescription("");
    setShowCreator(false);
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) return;

    const newOffer: LimitedTimeOffer = {
      id: `offer-${Date.now()}`,
      title: offerTitle.trim(),
      subtitle: offerSubtitle.trim() || `${offerPercent}% de réduction !`,
      description,
      discountPercent: Number(offerPercent),
      communeTarget: offerCommune.trim() || undefined,
      validTo: offerValidTo || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0],
      active: true,
      bannerColor: offerColor,
      iconName: offerIcon
    };

    const updated = [newOffer, ...limitedOffers];
    setLimitedOffers(updated);
    saveLimitedOffersStore(updated);

    // reset
    setOfferTitle("");
    setOfferSubtitle("");
    setDescription("");
    setOfferCommune("");
    setShowCreator(false);
  };

  const handleToggleCodeActive = (id: string) => {
    const updated = discountCodes.map(c => {
      if (c.id === id) return { ...c, active: !c.active };
      return c;
    });
    setDiscountCodes(updated);
    saveDiscountCodesStore(updated);
  };

  const handleToggleOfferActive = (id: string) => {
    const updated = limitedOffers.map(o => {
      if (o.id === id) return { ...o, active: !o.active };
      return o;
    });
    setLimitedOffers(updated);
    saveLimitedOffersStore(updated);
  };

  const handleDeleteCode = (id: string, text: string) => {
    const conf = window.confirm(`Supprimer définitivement le code "${text}" ?`);
    if (!conf) return;

    const updated = discountCodes.filter(c => c.id !== id);
    setDiscountCodes(updated);
    saveDiscountCodesStore(updated);
  };

  const handleDeleteOffer = (id: string, text: string) => {
    const conf = window.confirm(`Supprimer l'offre "${text}" ?`);
    if (!conf) return;

    const updated = limitedOffers.filter(o => o.id !== id);
    setLimitedOffers(updated);
    saveLimitedOffersStore(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 font-sans text-white select-none relative">
      
      {/* GLOW OVERVIEW */}
      <div className="absolute top-0 left-12 w-64 h-36 bg-blue-500/5 blur-[60px] pointer-events-none rounded-full" />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-3 rounded-2xl">
            <Percent className="w-6 h-6 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase font-mono">CONTRÔLE MARKETING</span>
              <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-bold text-amber-400 tracking-wider font-mono">
                ADMIN CONSOLE
              </span>
            </div>
            <h3 className="font-extrabold text-base text-white">Gestionnaire des Promotions & Offres RDC</h3>
          </div>
        </div>

        <button
          onClick={() => setShowCreator(prev => !prev)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-600/15"
        >
          {showCreator ? (
            <>
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 font-black" />
              <span>Créer une Campagne</span>
            </>
          )}
        </button>
      </div>

      {/* SUBSEGMENT SWITCH Tabs */}
      <div className="flex border-b border-slate-800 py-3 mb-4 gap-4 overflow-x-auto">
        <button
          onClick={() => { setActiveSegment("codes"); setShowCreator(false); }}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeSegment === "codes" ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Codes de Réductions ({discountCodes.length})</span>
          {activeSegment === "codes" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
          )}
        </button>

        <button
          onClick={() => { setActiveSegment("offers"); setShowCreator(false); }}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeSegment === "offers" ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Offres Saisonnières ({limitedOffers.length})</span>
          {activeSegment === "offers" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
          )}
        </button>
      </div>

      {/* CREATION FORMS */}
      {showCreator && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 mb-6 animate-in fade-in zoom-in-95 duration-200">
          <h4 className="text-xs font-black tracking-widest text-slate-300 uppercase font-mono mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Formulaire de Lancement Campagne</span>
          </h4>

          {activeSegment === "codes" ? (
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Code Promotionnel (Unique)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : MEGA40"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-mono uppercase tracking-widest"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Type de Rabais</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white cursor-pointer"
                  >
                    <option value="percent">Pourcentage (%)</option>
                    <option value="fixed">Montant Fixe Brut (CDF)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Valeur de réduction</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex : 20 pour 20%"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Filtre Prix Min Course (CDF)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex : 3000"
                    value={minAmCDF}
                    onChange={(e) => setMinAmCDF(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Plafond Réduction Max-Pourcentage (CDF)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex : 5000"
                    value={maxDCDF}
                    onChange={(e) => setMaxDCDF(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date Limite de Validité</label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Limite d'intégrations / Utilisateurs max</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex : 500"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description & Conditions d'application</label>
                <textarea
                  required
                  placeholder="Ex : Offre de 25% destinée aux résidents de Gombe..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white resize-none placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Inscrire le Code au Registre National RDC
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Titre de l'Offre Visuelle</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Gombe Business Hour"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sous-titre accrocheur</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Évitez les bouchons !"
                    value={offerSubtitle}
                    onChange={(e) => setOfferSubtitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">% Réduction automatique</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex : 15"
                    value={offerPercent}
                    onChange={(e) => setOfferPercent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Commune Ciblée (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex : Kalamu (sinon générique)"
                    value={offerCommune}
                    onChange={(e) => setOfferCommune(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Offre valide jusqu'au</label>
                  <input
                    type="date"
                    value={offerValidTo}
                    onChange={(e) => setOfferValidTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Style de Dégradé Visuel</label>
                  <select
                    value={offerColor}
                    onChange={(e) => setOfferColor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white cursor-pointer"
                  >
                    <option value="from-amber-500 to-orange-600">Ambre Cuivre 🎃 (Fêtes / Alarmes)</option>
                    <option value="from-blue-600 to-indigo-700">Bleu Turquoise 💧 (Professionnel / Corporate)</option>
                    <option value="from-[#10b981] to-emerald-850">Vert Émeraude 🌲 (Naturel / Budget)</option>
                    <option value="from-rose-500 to-red-700">Rouge Intense 🍎 (Flash / Limité-temps)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Icone Décorative</label>
                  <select
                    value={offerIcon}
                    onChange={(e) => setOfferIcon(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white cursor-pointer"
                  >
                    <option value="zap">⚡ Flash / Vitesse</option>
                    <option value="clock">⏱️ Chronomètre / Heures rush</option>
                    <option value="star">⭐ Étoile / Premium</option>
                    <option value="coins">🪙 Monnaie / Cashback</option>
                    <option value="gift">🎁 Paquet Cadeau</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description détaillée pour l'application mobile</label>
                <textarea
                  required
                  placeholder="Cette offre s'appliquera automatiquement dès qu'un chauffeur récupérera un voyageur..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-white resize-none placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Publier le bento-widget Saisonnier
              </button>
            </form>
          )}

        </div>
      )}

      {/* RENDER ACTIVE CAMPAIGNS REGISTER TABLE */}
      <div className="space-y-4">
        
        {/* TAB 1 : CODES VIEW */}
        {activeSegment === "codes" && (
          <div className="bg-slate-950 border border-slate-800 rounded-2.5xl overflow-hidden">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                    <th className="p-3.5 pl-5">Code</th>
                    <th className="p-3.5">Condition / Type de coupon</th>
                    <th className="p-3.5">Durée & Plafonds</th>
                    <th className="p-3.5 text-center">Audience / Utilisés</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {discountCodes.map((code) => (
                    <tr 
                      key={code.id}
                      className="hover:bg-slate-900/30 transition-all"
                    >
                      <td className="p-3.5 pl-5 font-mono font-black text-white">
                        <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                          {code.code}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-100 block">{code.description}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Type: {code.discountType === "percent" ? `% Rabais (${code.discountValue}%)` : `Montant fixe (${code.discountValue} CDF)`}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-350">
                        <div className="space-y-0.5 text-[10px] font-mono">
                          <span>Achat Min: {code.minRideAmountCDF.toLocaleString()} CDF</span>
                          <span className="block text-slate-500">Plafond Max: {code.maxDiscountCDF.toLocaleString()} CDF</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono text-[10px] text-slate-400">
                        <span>{code.timesUsed} / {code.usageLimit}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleCodeActive(code.id)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-all cursor-pointer ${
                            code.active 
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                              : "bg-red-500/10 border border-red-500/20 text-red-400"
                          }`}
                        >
                          {code.active ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        <button
                          onClick={() => handleDeleteCode(code.id, code.code)}
                          className="text-slate-550 hover:text-red-400 p-2 hover:bg-slate-900 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {discountCodes.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-500">Aucun code inséré au registre.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2 : OFFERS VIEW */}
        {activeSegment === "offers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {limitedOffers.map((offer) => (
              <div 
                key={offer.id}
                className="bg-slate-950 border border-slate-800 rounded-2.5xl p-4.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      Expire à minuit : {offer.validTo}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleOfferActive(offer.id)}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          offer.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {offer.active ? "En Ligne" : "Hors Ligne"}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteOffer(offer.id, offer.title)}
                        className="text-slate-600 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${offer.bannerColor} text-white`}>
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                        {offer.title}
                        {offer.communeTarget && (
                          <span className="text-[9px] font-mono bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded">
                            📍 {offer.communeTarget}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        {offer.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 mt-4.5 pt-3 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">Commission globale inchangée (15%)</span>
                  <span className="text-emerald-400 font-extrabold">-{offer.discountPercent}% Client</span>
                </div>
              </div>
            ))}
            {limitedOffers.length === 0 && (
              <div className="col-span-full text-center py-10 bg-slate-950 border border-slate-800 rounded-2.5xl">
                <p className="text-slate-500 text-xs">Aucune offre saisonnière paramétrée.</p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
