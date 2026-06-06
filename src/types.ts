/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "client" | "driver" | "owner" | "admin";

export type DocumentType = 
  | "passeport" 
  | "carte_identite_nationale" 
  | "permis_de_conduire" 
  | "document_etranger";

export interface DRCAddress {
  province: string;
  city: string;
  commune: string;
  quartier: string;
  localite: string;
  avenue: string;
  number: string; // Plot or house number in DRC
}

export interface UserProfile {
  id: string;
  role: UserRole;
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  address: DRCAddress;
  walletBalanceCDF: number;
  walletBalanceUSD: number;
  isRegistered: boolean;
  registrationDate?: string;
  documentStatus?: "pending" | "approved" | "rejected"; // Approvals by State Audit admin
  
  // Specific to Drivers & Owners
  documentType?: DocumentType;
  documentNumber?: string;
  documentPhotoFront?: string; // Data URL or placeholder
  documentPhotoBack?: string;  // Data URL or placeholder
  profilePicture?: string;      // Data URL or placeholder
  
  // Specific to Drivers
  isOnline: boolean;
  onlineSelfieUrl?: string;     // Photo taken to activate online status
  vehiclePlate?: string;
  vehicleModel?: string;
  rating: number;
  ridesCompleted: number;
  assignedOwnerId?: string;     // Link to owner

  // Mandatory Owner fields for GoMoto RDC designation
  ownerCompleteAddress?: string;
  designatedDriverName?: string;
  designatedDriverAddress?: string;
  designatedDriverIdCard?: string;
  designatedDriverLicense?: string;

  // Referral System (Système de Parrainage)
  myReferralCode?: string;
  referredByCode?: string;
  referralCount?: number;

  // Preferences de course
  ridePreferences?: {
    helmetRequired: boolean;
    safeDrivingOnly: boolean;
    silentRide: boolean;
    baggageCargo: boolean;
    customDriverNote?: string;
  };

  // Partenariats Télécoms RDC (Vodacom, Orange, Airtel Money / Pro)
  telecomOperator?: "vodacom" | "orange" | "airtel";
  telecomPhoneSim?: string;
  telecomSubscriptionStatus?: "active" | "inactive";
  telecomExpiryDate?: string;
  telecomAutoRenew?: boolean;
  telecomSecuredAPN?: boolean;
  telecomPlanPaidByGoMoto?: boolean; // Payer par moi (GoMoto) ou retenu sur gains
}

export interface MotorCycle {
  id: string;
  ownerId: string;
  brand: string;
  plateNumber: string;
  assignedDriverId?: string;
  status: "available" | "active" | "maintenance";
}

export interface RideRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: DRCAddress;
  dropoffAddress: DRCAddress;
  status: "searching" | "accepted" | "picked_up" | "completed" | "cancelled";
  priceCDF: number;
  priceUSD: number;
  distanceKm: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverSelfie?: string;
  timestamp: string;
  disputeStatus?: "refunded" | "none";
  preferences?: {
    helmetRequired: boolean;
    safeDrivingOnly: boolean;
    silentRide: boolean;
    baggageCargo: boolean;
    customDriverNote?: string;
  };
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: "CDF" | "USD";
  type: "deposit" | "withdrawal" | "ride_payment" | "commission";
  method: "M-Pesa" | "Orange Money" | "Airtel Money" | "Wallet_System";
  status: "pending" | "completed" | "failed";
  date: string;
  rideDetails?: {
    pickup: string;
    dropoff: string;
    driverName: string;
    distanceKm: number;
  };
}

export interface AdminModificationRequest {
  id: string;
  userId: string;
  userRole: UserRole;
  currentLastName: string;
  currentFirstName: string;
  requestedLastName: string;
  requestedFirstName: string;
  requestedDocType?: DocumentType;
  requestedDocNumber?: string;
  requestedDocPhotoFront?: string;
  requestedDocPhotoBack?: string;
  requestedProfilePicture?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  adminNotes?: string;
}

export interface RideMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "driver";
  text: string;
  timestamp: string;
}

export interface RideReview {
  id: string;
  rideId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: "client" | "driver";
  toUserId: string;
  toUserName: string;
  rating: number; // 1-5
  comment?: string;
  timestamp: string;
}

export interface SubmittedTaxDocument {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  docType: "daily_revenue" | "annual_tax";
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  period?: string;
  totalCDF?: number;
  totalUSD?: number;
  confidentialUserAddress?: string;
  headquartersAddress?: string;
  details?: {
    period: string;
    totalCDF: number;
    totalUSD: number;
    confidentialDriverAddress?: string;
    confidentialOwnerAddress?: string;
    headquartersAddress: string;
  };
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: "client" | "driver";
  latitude: number;
  longitude: number;
  timestamp: string;
  reason: string;
  status: "active" | "resolved";
  resolutionNotes?: string;
}


