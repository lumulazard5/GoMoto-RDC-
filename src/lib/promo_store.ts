/**
 * Promotion & Offer Management System Store for GoMoto RDC
 * This maintains persistent storage of discount codes, active limited-time offers,
 * and the client loyalty program.
 */

export interface DiscountCode {
  id: string;
  code: string; // uppercase code
  discountType: "percent" | "fixed";
  discountValue: number; // e.g., 20 for 20%, 3000 for 3000 CDF
  minRideAmountCDF: number; // min ride cost
  maxDiscountCDF: number; // max offset (active if percent)
  validFrom: string; // ISO date or simple string
  validTo: string; // ISO date
  usageLimit: number;
  timesUsed: number;
  active: boolean;
  description: string;
  createdFromLoyalty?: boolean; // True if redeemed using loyalty points
}

export interface LimitedTimeOffer {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discountPercent: number;
  communeTarget?: string; // Optional target commune, e.g., "Gombe" or "Kalamu"
  validTo: string; // ISO or human date
  active: boolean;
  bannerColor: string; // Tailwind gradient classes
  iconName: "gift" | "clock" | "star" | "coins" | "zap";
}

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsCost: number;
  rewardType: "discount_fixed" | "discount_percent";
  rewardValue: number;
  description: string;
}

export interface UserLoyaltyState {
  userId: string;
  points: number;
  totalSpentCDF: number;
  ridesCompletedCount: number;
  tier: "Bronze" | "Argent" | "Or" | "Diamant 💎";
  claimedCodes: string[]; // List of specific codes generated
}

// Default Discount Codes seeded for the GoMoto RDC application
const DEFAULT_DISCOUNT_CODES: DiscountCode[] = [
  {
    id: "promo-kns20",
    code: "KNS20",
    discountType: "percent",
    discountValue: 20,
    minRideAmountCDF: 3000,
    maxDiscountCDF: 4000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    usageLimit: 500,
    timesUsed: 42,
    active: true,
    description: "20% de réduction sur vos trajets de plus de 3.000 CDF (Max 4.000 CDF)."
  },
  {
    id: "promo-gomoto5",
    code: "GOMOTO5",
    discountType: "fixed",
    discountValue: 1500,
    minRideAmountCDF: 2000,
    maxDiscountCDF: 1500,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    usageLimit: 1000,
    timesUsed: 189,
    active: true,
    description: "Réduction fixe immédiate de 1.500 CDF sur n'importe quel trajet !"
  },
  {
    id: "promo-airtelx",
    code: "AIRTELX",
    discountType: "percent",
    discountValue: 15,
    minRideAmountCDF: 1500,
    maxDiscountCDF: 3000,
    validFrom: "2026-05-01",
    validTo: "2026-08-30",
    usageLimit: 300,
    timesUsed: 12,
    active: true,
    description: "15% de rabais exclusif pour les abonnés Airtel Money en RDC."
  }
];

// Default Limited-Time Offers (Visually rich banners displayed prominently)
const DEFAULT_LIMITED_OFFERS: LimitedTimeOffer[] = [
  {
    id: "offer-kalamu-weekend",
    title: "⚡ Kalamu Weekend Special",
    subtitle: "Séjours & Trajets vers Kalamu à prix cassés",
    description: "Bénéficiez d'une réduction automatique de 25% sur toutes les courses ayant pour départ ou destination la commune de Kalamu ce week-end !",
    discountPercent: 25,
    communeTarget: "Kalamu",
    validTo: "2026-06-21",
    active: true,
    bannerColor: "from-amber-500 to-orange-600",
    iconName: "zap"
  },
  {
    id: "offer-gombe-rush",
    title: " Gombe Business Hour",
    subtitle: "Évitez les embouteillages du matin",
    description: "Une réduction de 12% est automatiquement appliquée pour des dessertes matinales efficaces vers Gombe pour tous les professionnels.",
    discountPercent: 12,
    communeTarget: "Gombe",
    validTo: "2026-07-15",
    active: true,
    bannerColor: "from-blue-600 to-indigo-700",
    iconName: "clock"
  },
  {
    id: "offer-province-launch",
    title: "💎 Expansion Grand Katanga",
    subtitle: "Promotion d'Onboarding Lubumbashi & Kolwezi",
    description: "Prix réduit de 15% sur toutes les courses dans le Haut-Katanga et le Lualaba pour fêter l'arrivée de notre flotte homologuée !",
    discountPercent: 15,
    validTo: "2026-09-01",
    active: true,
    bannerColor: "from-[#10b981] to-emerald-850",
    iconName: "star"
  }
];

// Default Loyalty Rewards items to purchase using accumulated points
const DEFAULT_LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: "reward-cdf-2000",
    title: "Bon d'achat de 2.000 CDF",
    pointsCost: 80,
    rewardType: "discount_fixed",
    rewardValue: 2000,
    description: "Échangez 80 points contre un code promotionnel à usage unique vous offrant 2.050 CDF de réduction."
  },
  {
    id: "reward-cdf-5000",
    title: "Bon d'achat de 5.000 CDF",
    pointsCost: 180,
    rewardType: "discount_fixed",
    rewardValue: 5000,
    description: "Bénéficiez de 5.000 CDF de réduction brute sur votre prochain trajet. Idéal pour les longs déplacements provinciaux."
  },
  {
    id: "reward-pct-30",
    title: "Bon -30% (Max 6.000 CDF)",
    pointsCost: 120,
    rewardType: "discount_percent",
    rewardValue: 30,
    description: "Échangez 120 points pour un coupon de 30% de réduction pour traverser Kinshasa sans encombre."
  },
  {
    id: "reward-free",
    title: "Course Offerte (Max 12.000 CDF)",
    pointsCost: 400,
    rewardType: "discount_fixed",
    rewardValue: 12000,
    description: "Prenez une course totalement offerte (hauteur maximale de 12.000 CDF). L'ultime récompense des clients fidèles !"
  }
];

// Helper functions for persistent state access
export function getDiscountCodesStore(): DiscountCode[] {
  const saved = localStorage.getItem("gomoto_discount_codes_v1");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Initialize with defaults if empty
  localStorage.setItem("gomoto_discount_codes_v1", JSON.stringify(DEFAULT_DISCOUNT_CODES));
  return DEFAULT_DISCOUNT_CODES;
}

export function saveDiscountCodesStore(codes: DiscountCode[]) {
  localStorage.setItem("gomoto_discount_codes_v1", JSON.stringify(codes));
}

export function getLimitedOffersStore(): LimitedTimeOffer[] {
  const saved = localStorage.getItem("gomoto_limited_offers_v1");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem("gomoto_limited_offers_v1", JSON.stringify(DEFAULT_LIMITED_OFFERS));
  return DEFAULT_LIMITED_OFFERS;
}

export function saveLimitedOffersStore(offers: LimitedTimeOffer[]) {
  localStorage.setItem("gomoto_limited_offers_v1", JSON.stringify(offers));
}

export function getLoyaltyRewardsStore(): LoyaltyReward[] {
  const saved = localStorage.getItem("gomoto_loyalty_rewards_v1");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem("gomoto_loyalty_rewards_v1", JSON.stringify(DEFAULT_LOYALTY_REWARDS));
  return DEFAULT_LOYALTY_REWARDS;
}

export function saveLoyaltyRewardsStore(rewards: LoyaltyReward[]) {
  localStorage.setItem("gomoto_loyalty_rewards_v1", JSON.stringify(rewards));
}

export function getUserLoyaltyState(userId: string, completedRidesCount: number = 0): UserLoyaltyState {
  const storeKey = `gomoto_user_loyalty_${userId}`;
  const saved = localStorage.getItem(storeKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Synchronize rides if completed counts mismatch
      if (parsed.ridesCompletedCount !== completedRidesCount) {
        const addedRides = Math.max(0, completedRidesCount - parsed.ridesCompletedCount);
        parsed.ridesCompletedCount = completedRidesCount;
        parsed.points += addedRides * 25; // Reward with 25 points per new completed ride
        parsed.tier = getTierByCount(completedRidesCount);
        localStorage.setItem(storeKey, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error(e);
    }
  }

  // Create initial loyalty state
  const startingRides = completedRidesCount || 0;
  // Starting bonus: 150 points for simple enrolement testing!
  const startingPoints = 150 + (startingRides * 25);
  const initialState: UserLoyaltyState = {
    userId,
    points: startingPoints,
    totalSpentCDF: startingRides * 8000, // approximate spent
    ridesCompletedCount: startingRides,
    tier: getTierByCount(startingRides),
    claimedCodes: []
  };

  localStorage.setItem(storeKey, JSON.stringify(initialState));
  return initialState;
}

export function saveUserLoyaltyState(userId: string, state: UserLoyaltyState) {
  localStorage.setItem(`gomoto_user_loyalty_${userId}`, JSON.stringify(state));
}

function getTierByCount(count: number): UserLoyaltyState["tier"] {
  if (count < 3) return "Bronze";
  if (count < 10) return "Argent";
  if (count < 25) return "Or";
  return "Diamant 💎";
}

// Compute discount details
export function applyPromoToAmount(
  amount: number,
  currency: "CDF" | "USD",
  code: DiscountCode,
  usdToCdfRate: number = 2800
): { discountAmount: number; finalAmount: number } {
  const isCdf = currency === "CDF";
  
  // Convert standard values
  const multiplier = isCdf ? 1 : 1 / usdToCdfRate;
  
  if (code.discountType === "fixed") {
    // Discount value is in CDF in our database schema structure
    const discountInCurrency = isCdf ? code.discountValue : code.discountValue / usdToCdfRate;
    const computedAmt = Math.min(amount, discountInCurrency);
    return {
      discountAmount: parseFloat(computedAmt.toFixed(2)),
      finalAmount: parseFloat(Math.max(0, amount - computedAmt).toFixed(2))
    };
  } else {
    // Percent discount
    const computedPctAmt = amount * (code.discountValue / 100);
    const maxDiscountInCurr = isCdf ? code.maxDiscountCDF : code.maxDiscountCDF / usdToCdfRate;
    const discountInCurrency = Math.min(computedPctAmt, maxDiscountInCurr);
    return {
      discountAmount: parseFloat(discountInCurrency.toFixed(2)),
      finalAmount: parseFloat(Math.max(0, amount - discountInCurrency).toFixed(2))
    };
  }
}
