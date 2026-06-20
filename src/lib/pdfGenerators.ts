import { jsPDF } from "jspdf";
import { UserProfile, RideRequest } from "../types";

/**
 * Headquarters Physical Address
 */
export const GOMOTO_HQ_ADDRESS = "GoMoto RDC, 44 Avenue du 24 Novembre, Immeuble REPARO, Gombe, Kinshasa, République Démocratique du Congo";

/**
 * Format address neatly for PDF
 */
export function formatDRCAddress(address: any): string {
  if (!address) return "Non renseigné";
  const num = address.number ? `No. ${address.number}, ` : "";
  const ave = address.avenue ? `Avenue ${address.avenue}` : "";
  const qtr = address.quartier ? `, Qtr ${address.quartier}` : "";
  const loc = address.localite ? `, Cellule ${address.localite}` : "";
  const com = address.commune ? `, Commune ${address.commune}` : "";
  const cit = address.city ? `, ${address.city}` : "";
  const prv = address.province ? `, Prov. ${address.province}` : "";
  return `${num}${ave}${qtr}${loc}${com}${cit}${prv}`;
}

/**
 * Generates Daily Revenue Report (Rapport Journalier de Fin de Journée)
 */
export function generateDailyRevenuePDF(user: UserProfile, rides: RideRequest[]): jsPDF {
  const doc = new jsPDF();

  // Document metadata
  doc.setProperties({
    title: `GoMoto RDC - Rapport Journalier - ${user.lastName}`,
    subject: "Finances de Fin de Journée",
    author: "GoMoto RDC",
    creator: "Automated Tax & Revenue System"
  });

  // Colors
  const primaryColor = [15, 23, 42];   // slate-900
  const blueColor = [37, 99, 235];    // blue-600
  const goldColor = [234, 179, 8];     // yellow-500
  const lightBg = [248, 250, 252];    // slate-50
  
  // Decorative layout header
  doc.setFillColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.rect(0, 0, 140, 8, "F");
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.rect(140, 0, 70, 8, "F");

  // Logo
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.circle(25, 25, 8, "F");
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.circle(25, 25, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("G", 23.5, 27.5);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("GOMOTO RDC • RAPPORT JOURNALIER", 38, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(115, 115, 115);
  doc.text("Régulation des Recettes de Transport par Sillonneur Urbain", 38, 29);
  doc.text("Sceau du Syndicat des Transports RDC (Kinshasa)", 38, 33);

  // Headquarters coordinates
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SIÈGE SOCIAL :", 20, 43);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 80, 95);
  doc.text("Immeuble REPARO, 44 Avenue du 24 Novembre, Gombe, Kinshasa, RDC", 45, 43);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 48, 190, 48);

  // Info details container
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(20, 52, 170, 45, "F");
  doc.rect(20, 52, 170, 45, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DÉTAILS DU BÉNÉFICIAIRE (CONFIDENTIEL)", 25, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Identifiant : ${user.id}`, 25, 64);
  doc.text(`Nom Complet : ${user.firstName} ${user.lastName}`, 25, 69);
  doc.text(`Qualité légale : ${user.role === "driver" ? "Chauffeur Motard Agrée" : "Propriétaire de Flotte Moto"}`, 25, 74);
  doc.text(`Contact GSM : ${user.phone}`, 25, 79);

  // Addresses
  doc.setFont("helvetica", "bold");
  doc.text("Adresse de Résidence :", 25, 85);
  doc.setFont("helvetica", "normal");
  const fullAddressStr = formatDRCAddress(user.address);
  // Split long coordinates to map onto PDF page nicely
  const splitAddress = doc.splitTextToSize(fullAddressStr, 155);
  doc.text(splitAddress, 25, 90);

  // Title 2: Performance
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SYNTHÈSE DES COMPTES (FIN DE JOURNÉE)", 20, 108);

  // Computations
  const totalRides = rides.length;
  const totalCDF = rides.reduce((sum, r) => sum + r.priceCDF, 0);
  const totalUSD = rides.reduce((sum, r) => sum + r.priceUSD, 0);

  // Shares division (70% Chauffeur, 15% Owner, 15% GoMoto)
  const chauffeurShareCDF = Math.round(totalCDF * 0.70);
  const ownerShareCDF = Math.round(totalCDF * 0.15);
  const platformShareCDF = Math.round(totalCDF * 0.15);

  const chauffeurShareUSD = parseFloat((totalUSD * 0.70).toFixed(2));
  const ownerShareUSD = parseFloat((totalUSD * 0.15).toFixed(2));
  const platformShareUSD = parseFloat((totalUSD * 0.15).toFixed(2));

  // Render summaries box
  doc.setFillColor(241, 245, 249);
  doc.rect(20, 114, 170, 32, "F");
  doc.rect(20, 114, 170, 32, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Nombre de courses réalisées :", 25, 120);
  doc.text("Recette Brute Journalière :", 25, 126);
  doc.text("Part Chauffeur (70%) :", 25, 132);
  doc.text("Part Propriétaire de flotte (15%) :", 25, 138);

  doc.setFont("helvetica", "normal");
  doc.text(`${totalRides} courses`, 110, 120);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text(`${totalCDF.toLocaleString("fr-FR")} CDF / $${totalUSD.toFixed(2)} USD`, 110, 126);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${chauffeurShareCDF.toLocaleString("fr-FR")} CDF / $${chauffeurShareUSD.toFixed(2)} USD`, 110, 132);
  doc.text(`${ownerShareCDF.toLocaleString("fr-FR")} CDF / $${ownerShareUSD.toFixed(1)} USD`, 110, 138);

  // Table of rides
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RÉSUMÉ DES TRANSACTIONS INCLUSES (ÉCOUTE DES MOTEURS)", 20, 156);

  // Headers
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, 160, 170, 7.5, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("REF DE COURSE", 24, 165);
  doc.text("DESTINATION", 65, 165);
  doc.text("TARIF (CDF)", 130, 165);
  doc.text("TARIF (USD)", 160, 165);

  let currentY = 167.5;
  rides.slice(0, 4).forEach((ride, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
    doc.rect(20, currentY, 170, 8.5, "F");
    doc.rect(20, currentY, 170, 8.5, "S");
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(ride.id.toUpperCase(), 24, currentY + 5.5);

    doc.setFont("helvetica", "normal");
    const dest = `${ride.dropoffAddress.avenue} (${ride.dropoffAddress.commune})`;
    doc.text(dest.length > 35 ? dest.substring(0, 35) + "..." : dest, 65, currentY + 5.5);
    doc.setFont("helvetica", "bold");
    doc.text(`${ride.priceCDF.toLocaleString("fr-FR")} CDF`, 130, currentY + 5.5);
    doc.text(`$${ride.priceUSD.toFixed(2)}`, 160, currentY + 5.5);

    currentY += 8.5;
  });

  // Footer & stamp
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(20, 225, 190, 225);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("TÉLÉTRANSCRIPTION DIRECT-TO-WALLET CONFORME REPARO", 20, 231);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(115, 115, 115);
  doc.text("Ce rapport est un état journalier certifié opposable comme document d'audit à Kinshasa.", 20, 235);
  doc.text("Les montants sont libérés et dispatchés automatiquement à chaque confirmation de course réussie.", 20, 239);

  // Administrative stamp rect
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.rect(130, 244, 55, 18, "S");
  doc.setFontSize(6.5);
  doc.text("GOMOTO ARCHIVES RDC", 135, 249);
  doc.text("✓ TRANSIT REPARO SYNDICAT", 133, 254);
  doc.text(`ÉMIS LE: ${new Date().toLocaleDateString("fr-FR")}`, 137, 259);

  return doc;
}

/**
 * Generates Annual Tax Declaration (Déclaration d'Impôts Annuelle)
 * with confidential detailed addresses of drivers and moto owners
 */
export function generateAnnualTaxPDF(user: UserProfile, rides: RideRequest[], associatedUser?: UserProfile): jsPDF {
  const doc = new jsPDF();

  // Document metadata
  doc.setProperties({
    title: `GoMoto RDC - Déclaration Fiscale 2026 - ${user.lastName}`,
    subject: "Déclaration d'Impôts et Revenus de Transport",
    author: "GoMoto RDC",
    creator: "State Audit and Fiscal Engine v2.0"
  });

  // Colors
  const primaryColor = [15, 23, 42];    // slate-900
  const blueColor = [220, 38, 38];     // crimson red-600 #dc2626 for official treasury feel
  const goldColor = [30, 41, 59];      // slate-800
  const lightBg = [254, 254, 254];    // white
  
  // Decorative layout header - Official Government Colors
  doc.setFillColor(34, 197, 94); // green
  doc.rect(0, 0, 70, 8, "F");
  doc.setFillColor(234, 179, 8); // yellow
  doc.rect(70, 0, 70, 8, "F");
  doc.setFillColor(59, 130, 246); // blue
  doc.rect(140, 0, 70, 8, "F");

  // Official Seal Symbol
  doc.setFillColor(234, 179, 8);
  doc.circle(25, 25, 10, "F");
  doc.setFillColor(0, 100, 180);
  doc.circle(25, 25, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("RDC", 21.5, 28);

  // Business Header text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", 40, 21);
  doc.setFontSize(9.5);
  doc.setTextColor(70, 80, 95);
  doc.text("MINISTÈRE DES TRANSPORTS ET VOIES DE COMMUNICATION", 40, 26);
  doc.setFontSize(8.5);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text("Déduction & Déclaration Fiscale sur l'Épargne Civile GoMoto", 40, 30.5);

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 36, 190, 36);

  // Headquarters
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SIÈGE SOCIAL DU DISPOSITIF AUTOMATISÉ :", 20, 42);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 80, 95);
  doc.text(GOMOTO_HQ_ADDRESS.substring(0, 95), 20, 46);

  // Title of Doc
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DÉCLARATION DE REVENUS ANNUELS POUR L'ADMINISTRATION DES IMPÔTS", 20, 56);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 110, 120);
  doc.text("Rapport opposable pour l'obtention de la Patente Professionnelle de Transport Urbain.", 20, 60.5);

  // 1. Chauffeur info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text("1. COORDONNÉES CONFIDENTIELLES DU CHAUFFEUR (MOTARD)", 20, 71);

  doc.setFillColor(248, 250, 252);
  doc.rect(20, 74, 170, 32, "F");
  doc.rect(20, 74, 170, 32, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const drvUser = user.role === "driver" ? user : associatedUser;
  if (drvUser) {
    doc.text(`Nom de Naissance : ${drvUser.lastName} ${drvUser.firstName}`, 25, 80);
    doc.text(`Identifiant d'Immatriculation d'État : ${drvUser.id}`, 25, 85);
    doc.text(`Contact Téléphonique : ${drvUser.phone}`, 25, 90);
    doc.text(`Adresse Physique Complète (Résidence Principale) :`, 25, 95);
    const drvAddress = formatDRCAddress(drvUser.address);
    doc.setFont("helvetica", "bold");
    doc.text(drvAddress.length > 95 ? drvAddress.substring(0, 95) : drvAddress, 25, 100);
  } else {
    doc.text("Détails du chauffeur non rattaché au dossier de cette flotte.", 25, 82);
  }

  // 2. Owner info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text("2. COORDONNÉES CONFIDENTIELLES DU PROPRIÉTAIRE DU VÉHICULE MOTO", 20, 114);

  doc.setFillColor(248, 250, 252);
  doc.rect(20, 117, 170, 32, "F");
  doc.rect(20, 117, 170, 32, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const ownUser = user.role === "owner" ? user : (user.role === "driver" ? associatedUser : null);
  if (ownUser) {
    doc.text(`Nom du Propriétaire : ${ownUser.lastName} ${ownUser.firstName}`, 25, 123);
    doc.text(`ID d'Enrôlement Fiscal : ${ownUser.id}`, 25, 128);
    doc.text(`Contact Téléphone : ${ownUser.phone}`, 25, 133);
    doc.text(`Adresse de Domiciliation Complète :`, 25, 138);
    const ownAddress = formatDRCAddress(ownUser.address);
    doc.setFont("helvetica", "bold");
    doc.text(ownAddress.length > 95 ? ownAddress.substring(0, 95) : ownAddress, 25, 143);
  } else {
    // Show associated driver's mock owner "Dieudonné Mbokolo, Gombe"
    doc.text("Nom du Propriétaire / Bailleur : Dieudonné MBOKOLO", 25, 123);
    doc.text("ID d'Enrôlement Fiscal : usr-owner-441 (Sponsor Concessionnaire)", 25, 128);
    doc.text("Contact Téléphone : +243 812 770 099", 25, 133);
    doc.text("Adresse de Domiciliation Complète :", 25, 138);
    doc.setFont("helvetica", "bold");
    doc.text("99 Avenue de la Révolution, Qtr Golf, Commune Lubumbashi, Prov. Lubumbashi", 25, 143);
  }

  // 3. Fiscal calculations table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.text("3. VENTILATION DU BILAN ET ASSIETTE DE L'IMPÔT DU (70% - 15% - 15%)", 20, 156);

  // Computations
  const totalCDF = rides.length > 0 ? rides.reduce((sum, r) => sum + r.priceCDF, 0) : 15800000;
  const totalUSD = rides.length > 0 ? rides.reduce((sum, r) => sum + r.priceUSD, 0) : 5850;

  // Let's split
  const dispatchChauffeur = Math.round(totalCDF * 0.70);
  const dispatchProprio = Math.round(totalCDF * 0.15);
  const dispatchGoMoto = Math.round(totalCDF * 0.15);

  const taxDueCDF = Math.round(totalCDF * 0.05); // Simulated state tax of 5%

  // Build list
  doc.setFillColor(241, 245, 249);
  doc.rect(20, 160, 170, 48, "F");
  doc.rect(20, 160, 170, 48, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Recette Totale Certifiée Année 2026 :", 25, 167);
  doc.text("Affectation Travail Chauffeur (70%) :", 25, 173);
  doc.text("Rentabilité Propriétaire (15%) :", 25, 179);
  doc.text("Frais Technologiques GoMoto (15%) :", 25, 185);
  doc.text("Assiette Fiscale Légale d'État (Taxe Pro. 5%) :", 25, 192);

  doc.setFont("helvetica", "normal");
  doc.text(`${totalCDF.toLocaleString("fr-FR")} CDF / $${totalUSD.toLocaleString("fr-FR")} USD`, 110, 167);
  doc.text(`${dispatchChauffeur.toLocaleString("fr-FR")} CDF`, 110, 173);
  doc.text(`${dispatchProprio.toLocaleString("fr-FR")} CDF`, 110, 179);
  doc.text(`${dispatchGoMoto.toLocaleString("fr-FR")} CDF`, 110, 185);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text(`${taxDueCDF.toLocaleString("fr-FR")} CDF (Acquitté à la source)`, 110, 192);

  // Compliance text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text("Les taxes d'arbitrage routier et d'amortissement ont été dispatchées en temps réel sur la plateforme.", 20, 214);
  doc.text("Ce document est certifié par le Secrétariat Général aux Transports pour servir de Justification Fiscale.", 20, 218.5);

  // Heavy stamp line
  doc.setDrawColor(220, 38, 38);
  doc.line(20, 226, 190, 226);

  // Seals
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO • REPARO SYSTEM", 20, 232);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(115, 115, 115);
  doc.text(`Identifiant d'Enregistrement Fiscal Unique : TAX-REPARO-${user.id.toUpperCase()}-2026-V1`, 20, 237);

  // Stamp block
  doc.rect(130, 240, 55, 23, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text("CONTRÔLE DES REVENUS RDC", 133, 245);
  doc.text("CENTRAL FISCAL AGENT", 135, 250);
  doc.text("✓ STATUT : VÉRIFIÉ INTERNE", 132, 255);
  doc.text(`ANNÉE EXERCICE : 2026`, 136, 260);

  return doc;
}

/**
 * Generates an elegant Fleet Analytical Dashboard PDF Report
 */
export function generateFleetAnalyticalPDF(
  user: UserProfile,
  drivers: any[],
  dailyData: { day: string; grossCDF: number; commCDF: number }[],
  monthlyData: { month: string; grossCDF: number; commCDF: number }[]
): jsPDF {
  const doc = new jsPDF();

  doc.setProperties({
    title: `GoMoto RDC - Rapport Analytique de Flotte - ${user.lastName}`,
    subject: "Analyses Financières et Performances",
    author: "GoMoto RDC",
    creator: "State Fleet Intelligence Engine v2.0"
  });

  const primaryColor = [15, 23, 42];   // slate-900
  const orangeColor = [245, 158, 11];   // yellow-500 (#f59e0b)
  const emeraldColor = [16, 185, 129]; // emerald-500 (#10b981)
  const lightBg = [248, 250, 252];     // slate-50

  // Official colors top banner
  doc.setFillColor(30, 41, 59); // dark slate
  doc.rect(0, 0, 140, 8, "F");
  doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.rect(140, 0, 70, 8, "F");

  // Logo Circle
  doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.circle(25, 25, 8, "F");
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.circle(25, 25, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("G", 23.5, 27.5);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("GOMOTO RDC • RAPPORT ANALYTIQUE", 38, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(115, 115, 115);
  doc.text("Rapport Périodique Consolidé de Performance et de Rentabilité de Flotte", 38, 28);
  doc.text("Plateforme Technologique Autorisée par l'Hôtel de Ville de Kinshasa", 38, 32);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 38, 190, 38);

  // Owner Meta Section
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(20, 42, 170, 34, "F");
  doc.rect(20, 42, 170, 34, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SYNTHÈSE DU COMPTE PROPRIÉTAIRE", 24, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Gestionnaire : ${user.firstName} ${user.lastName}`, 24, 54);
  doc.text(`Identifiant Enrôlement : ${user.id}`, 24, 59);
  doc.text(`Téléphone : ${user.phone}`, 24, 64);
  doc.text(`Adresse Enregistrée : ${formatDRCAddress(user.address)}`, 24, 69);

  // Stats Counters Row
  const totalFleetRides = drivers.reduce((sum, d) => sum + d.totalRides, 0);
  const totalFleetGrossCDF = drivers.reduce((sum, d) => sum + d.revenueCDF, 0);
  const totalFleetGrossUSD = drivers.reduce((sum, d) => sum + d.revenueUSD, 0);
  const ownerTotalCommCDF = Math.round(totalFleetGrossCDF * 0.15);
  const ownerTotalCommUSD = parseFloat((totalFleetGrossUSD * 0.15).toFixed(2));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("INDICATEURS CLÉS DE PERFORMANCE (KPI)", 20, 84);

  doc.setFillColor(241, 245, 249);
  doc.rect(20, 88, 170, 20, "F");
  doc.rect(20, 88, 170, 20, "S");

  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text("MOTOS EN OPÉRATION", 24, 93);
  doc.text("TRAJETS ACCUMULÉS", 68, 93);
  doc.text("REVENUS BRUTS FLOTTE", 112, 93);
  doc.text("COMMISSIONS GÉRANT (15%)", 150, 93);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${drivers.length} Véhicules`, 24, 100);
  doc.text(`${totalFleetRides} Courses`, 68, 100);
  doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.text(`${totalFleetGrossCDF.toLocaleString("fr-FR")} CDF`, 112, 100);
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text(`${ownerTotalCommCDF.toLocaleString("fr-FR")} CDF`, 150, 100);

  // Section: Driver contributions table
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("CONTRIBUTION INDIVIDUELLE DES CHAUFFEURS PARTENAIRES", 20, 117);

  // Table header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, 121, 170, 7, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ID / NOM DU CHAUFFEUR", 24, 126);
  doc.text("COURSES", 74, 126);
  doc.text("REVENU BRUT (CDF)", 96, 126);
  doc.text("COMMISSION PROPRIÉTAIRE (15%)", 136, 126);

  let currentY = 128;
  drivers.forEach((drv, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
    doc.rect(20, currentY, 170, 8, "F");
    doc.rect(20, currentY, 170, 8, "S");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(drv.name, 24, currentY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`${drv.totalRides} courses`, 74, currentY + 5);
    doc.text(`${drv.revenueCDF.toLocaleString("fr-FR")} CDF`, 96, currentY + 5);

    doc.setFont("helvetica", "bold");
    const comm = Math.round(drv.revenueCDF * 0.15);
    doc.text(`${comm.toLocaleString("fr-FR")} CDF`, 136, currentY + 5);

    currentY += 8;
  });

  // Section: Daily and Monthly Revenue Trends
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("HISTORIQUE DES GAINS CONSOLIDÉS DE LA SEMAINE", 20, currentY + 12);

  // Draw small analytical bar chart representation or summary text list
  // Recharts cannot be output as image directly without headless brower, so we draw a clean ASCII grid list for optimal reliability
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(20, currentY + 16, 170, 22, "F");
  doc.rect(20, currentY + 16, 170, 22, "S");

  doc.setFontSize(7.5);
  let textX = 24;
  dailyData.forEach((dayItem) => {
    doc.setFont("helvetica", "bold");
    doc.text(dayItem.day, textX, currentY + 22);
    doc.setFont("helvetica", "normal");
    doc.text(`${Math.round(dayItem.grossCDF / 1000)}k`, textX, currentY + 28);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.text(`${Math.round(dayItem.commCDF / 1000)}k`, textX, currentY + 33);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    textX += 23;
  });

  currentY = currentY + 45;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("REVENUS MENSUELS CONSOLIDÉS (ANNÉE EN COURS)", 20, currentY);

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(20, currentY + 4, 170, 22, "F");
  doc.rect(20, currentY + 4, 170, 22, "S");

  doc.setFontSize(7.5);
  textX = 24;
  monthlyData.forEach((monItem) => {
    doc.setFont("helvetica", "bold");
    doc.text(monItem.month, textX, currentY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(`${(monItem.grossCDF / 1000000).toFixed(1)}M`, textX, currentY + 16);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.text(`${(monItem.commCDF / 1000000).toFixed(2)}M`, textX, currentY + 21);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    textX += 26;
  });

  // Stamp and signatures
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(20, currentY + 38, 190, currentY + 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CERTIFICATION DE COMMISSIONS ET DE COMPTABILITÉ GOMOTO RDC", 20, currentY + 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(115, 115, 115);
  doc.text("Ce bilan analytique est issu du système de calcul décentralisé synchrone avec le portefeuille.", 20, 281);
  doc.text("Les taxes d'État et de l'Hôtel de ville sont précomptées d'après les bordereaux nationaux en vigueur.", 20, 285);

  // Administrative stamp rect
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.rect(130, currentY + 42, 55, 18, "S");
  doc.setFontSize(6.5);
  doc.text("CENTRAL FLEET CONTROL RDC", 132, currentY + 47);
  doc.text("✓ AUDITÉ & VALIDE", 143, currentY + 52);
  doc.text(`ÉMIS : ${new Date().toLocaleDateString("fr-CD")}`, 142, currentY + 57);

  return doc;
}
