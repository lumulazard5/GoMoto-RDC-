import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { db } from "./src/db/index.ts";
import { legalizationReviews, users } from "./src/db/schema.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { requireAuth, AuthRequest } from "./src/lib/auth-middleware.ts";
import { eq, desc } from "drizzle-orm";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GenAI Client to prevent crash on startup if GEMINI_API_KEY is missing
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    genAIClient = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

// Simulated fallback AI assistant logic if key is missing or invalid
function getLocalAIResponse(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes("reparo") || msg.includes("escrow") || msg.includes("bloqu") || msg.includes("paye")) {
    return "💡 **Paiement Sécurisé REPARO (Escrow RDC) :**\nSur GoMoto RDC, pour protéger les motards contre les faux départs et garantir la course au passager, le montant estimé de la course est débité de votre portefeuille dès la commande et conservé au greffe d'arbitrage **REPARO**.\n\n- **À la fin de la course :** La somme est automatiquement libérée et répartie : **70% au Motard (Chauffeur)**, **15% au Propriétaire de la moto**, et **15% pour la commission d'administration GoMoto**.\n- **En cas d'absence de motard ou autre motif valable :** Vous cliquez sur 'Annuler la course' et vous êtes intégralement re-crédité en quelques secondes ! Le montant est retiré de REPARO et reversé sur votre portefeuille.";
  }
  if (msg.includes("annul") || msg.includes("rembours")) {
    return "❌ **Remboursement & Annulation :**\nSi aucun motard n'accepte votre course, si le motard accuse un retard excessif ou s'il y a un motif de force majeure, vous pouvez à tout moment cliquer sur **Annuler la course**.\nLe greffe REPARO renvoie instantanément vos CDF ou USD vers votre Portefeuille GoMoto. Aucune pénalité ne s'applique.";
  }
  if (msg.includes("gombe") || msg.includes("limit") || msg.includes("interdit")) {
    return "⛔ **Réglementation de la Commune de la Gombe :**\nL'Hôtel de Ville de Kinshasa interdit la circulation des taxis-motos au cœur de la commune de la Gombe pour des raisons de sécurité publique. GoMoto RDC applique un **géorepérage (Geofencing)** strict. Vous êtes automatiquement averti par signal sonore si vous franchissez les limites de la zone autorisée.";
  }
  if (msg.includes("document") || msg.includes("permis") || msg.includes("identit") || msg.includes("verif") || msg.includes("papiers")) {
    return "📋 **Vérification Civique des Pièces d'État :**\nChaque motard et propriétaire de flotte doit soumettre son permis de conduire congolais, passeport, ou carte d'électeur/identité nationale.\n\n- Vos pièces sont examinées par l'Auditeur de la Direction de GoMoto.\n- S'ils sont jugés conformes, l'admin certifie votre dossier et déverrouille instantanément votre profil (Approved).\n- S'il y a un problème (photo floue, signature suspecte), l'admin rejette la pièce, ce qui vous permet d'effectuer une modification.";
  }
  if (msg.includes("parrain") || msg.includes("referral") || msg.includes("code") || msg.includes("bonus")) {
    return "🎁 **Programme National de Parrainage GoMoto :**\nPartagez votre code de parrainage civique disponible sur votre profil. Lorsqu'un citoyen s'enregistre avec votre code, vous recevez instantanément **15 000 CDF + $5.00 USD** de prime civique après validation administrative de son dossier. C'est notre façon de stimuler l'économie locale !";
  }
  if (msg.includes("casque") || msg.includes("gilet") || msg.includes("pantalon") || msg.includes("securite")) {
    return "🛡️ **Sécurité Routière Obligatoire (Code de la Route) :**\n - **Le double casque :** Le motard et le passager doivent obligatoirement porter un casque homologué.\n - Le gilet rétro-réfléchissant réglementaire est obligatoire pour la visibilité.\n - Le transport de plus d'un passager adulte est strictement verbalisé (amende de police de 15 000 CDF).";
  }
  
  return "👋 **Bonjour ! Je suis l'Assistant Intelligent GoMoto RDC (Arbitrage & Recours).**\n\nJe peux vous assister concernant :\n1. **Paiements REPARO** (Escrow en RDC)\n2. **Remboursements & Annulations en cas d'absence de motard**\n3. **Sécurité Routière (Double Casque & Gilet)**\n4. **Réglementation de la Gombe (Geofencing)**\n5. **Vérification administrative des pièces** (Permis, ID Nationale, etc.).\n\nPosez-moi votre question en Français, Lingala ou Swahili !";
}

// Full-stack chat endpoint
app.post("/api/ai/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Aucun message fourni." });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    // Graceful offline simulated fallback
    console.log("No valid GEMINI_API_KEY in environment. Falling back to GoMoto local rules-based engine.");
    const reply = getLocalAIResponse(message);
    return res.json({ reply, source: "simulation" });
  }

  try {
    const ai = getGenAI();
    // Use gemini-3.5-flash for general Q&A as per guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: "You are the official GoMoto RDC Intelligent Compliance Assistant (Cabinet d'Audit & Arbitrage Routier). Help Congolese motorbike riders, passengers, and fleet owners. Answer concisely in French. Support standard Congolese terms (M-Pesa, Airtel Money, Gombe boundaries, Code de la Route, Double Helmets, Escrow REPARO, 15% owner payout). Mention that payments are placed in REPARO escrow first and released (70% driver, 15% owner, 15% platform) at the end, or refunded 100% on rider absence or cancel.",
        temperature: 0.7
      }
    });

    return res.json({ reply: response.text || "Désolé, je n'ai pas pu générer de réponse.", source: "gemini" });
  } catch (error: any) {
    console.error("Gemini API Error, falling back to local database resolver:", error);
    const reply = getLocalAIResponse(message);
    return res.json({ reply, source: "simulation_fallback", error: error.message });
  }
});

// Persistent in-memory cache for dynamic translations to prevent Gemini 429 quota exhaustion
const serverTranslationCache: Record<string, Record<string, string>> = {
  en: {},
  sw: {},
  ln: {},
  ts: {},
  kk: {}
};

// Translation Endpoint using Gemini 3.5-flash with server-side caching
app.post("/api/translate", async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: "Missing text or targetLang" });
  }

  const langNames: Record<string, string> = {
    fr: "French",
    en: "English",
    sw: "Swahili",
    ln: "Lingala",
    ts: "Tshiluba",
    kk: "Kikongo",
  };

  if (targetLang === "fr" || !langNames[targetLang]) {
    return res.json({ translated: text });
  }

  // Check server-side cache
  const langCache = serverTranslationCache[targetLang];
  if (langCache && langCache[text]) {
    return res.json({ translated: langCache[text], source: "server-cache" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return res.json({ translated: text, source: "offline-fallback" });
  }

  try {
    const ai = getGenAI();
    const systemInstruction = `You are a professional Congolese / multilingual translator for the GoMoto RDC application.
Translate the text from French into standard ${langNames[targetLang]}.
Follow these strict rules:
1. Preserve any technical and brand names unchanged (e.g., 'GoMoto', 'REPARO', 'CDF', 'USD', 'M-Pesa', 'Airtel Money', 'Escrow', 'PNC', 'Commune de la Gombe', 'Geofencing').
2. Maintain identical formatting, punctuation, emojis, and styling markers (like markdown '**' or '*' or '\\n' line breaks).
3. Translate with local, professional, and natural vocabulary appropriate for the Democratic Republic of Congo context.
4. Output ONLY the translated text, with no extra commentary, preambles, or explanations.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: text,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });

    const translated = response.text?.trim() || text;
    // Save to cache
    if (langCache) {
      langCache[text] = translated;
    }
    return res.json({ translated, source: "gemini" });
  } catch (error: any) {
    console.error("Translation API error:", error);
    return res.json({ translated: text, source: "error-fallback", error: error.message });
  }
});

// Batch Translation Endpoint using Gemini with server-side caching to drastically cut down 429 exceptions
app.post("/api/translate/batch", async (req, res) => {
  const { texts, targetLang } = req.body;
  if (!Array.isArray(texts) || !targetLang) {
    return res.status(400).json({ error: "Missing texts or targetLang" });
  }

  const langNames: Record<string, string> = {
    fr: "French",
    en: "English",
    sw: "Swahili",
    ln: "Lingala",
    ts: "Tshiluba",
    kk: "Kikongo",
  };

  if (targetLang === "fr" || !langNames[targetLang] || texts.length === 0) {
    const defaultRes = texts.reduce((acc, t) => {
      acc[t] = t;
      return acc;
    }, {} as Record<string, string>);
    return res.json({ translations: defaultRes });
  }

  const langCache = serverTranslationCache[targetLang] || {};
  if (!serverTranslationCache[targetLang]) {
    serverTranslationCache[targetLang] = langCache;
  }

  // Divide into cached and uncached texts
  const translations: Record<string, string> = {};
  const unCachedTexts: string[] = [];

  texts.forEach((text: string) => {
    if (langCache[text]) {
      translations[text] = langCache[text];
    } else {
      unCachedTexts.push(text);
    }
  });

  // If everything's in the cache, return immediately
  if (unCachedTexts.length === 0) {
    return res.json({ translations, source: "server_cache_batch" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    // Fill the uncached values with original text
    unCachedTexts.forEach((t) => {
      translations[t] = t;
    });
    return res.json({ translations, source: "offline-fallback" });
  }

  try {
    const ai = getGenAI();
    const systemInstruction = `You are a professional Congolese / multilingual translator for the GoMoto RDC application.
You receive a JSON array of French strings to translate into standard ${langNames[targetLang]}.
Translate all items in the array, and output your answer as a JSON object where the keys are the exact source French text strings, and the values are their translations.

Follow these strict rules:
1. Preserve any technical and brand names unchanged (e.g., 'GoMoto', 'REPARO', 'CDF', 'USD', 'M-Pesa', 'Airtel Money', 'Escrow', 'PNC', 'Commune de la Gombe', 'Geofencing').
2. Maintain identical formatting, punctuation, emojis, and styling markers (like markdown '**' or '*' or '\\n' line breaks).
3. Translate with local, professional, and natural vocabulary appropriate for the Democratic Republic of Congo context.
4. Output ONLY valid JSON representing the object. Do NOT wrap your answer in markdown code blocks (do not use \`\`\`json). No preambles, explanations or comments.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: JSON.stringify(unCachedTexts),
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const bodyText = response.text?.trim() || "{}";
    let batchTranslations: Record<string, string> = {};
    try {
      batchTranslations = JSON.parse(bodyText);
    } catch (parseError) {
      console.warn("Failed to parse Gemini batch translation as JSON, trying extraction:", bodyText, parseError);
      const cleaned = bodyText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      try {
        batchTranslations = JSON.parse(cleaned);
      } catch (inner) {
        throw new Error("Unable to parse translated JSON string.");
      }
    }

    // Save newly translated strings to cache and return
    Object.entries(batchTranslations).forEach(([original, translated]) => {
      langCache[original] = translated;
      translations[original] = translated;
    });

    // Backfill any keys missed by the model
    texts.forEach((original: string) => {
      if (!translations[original]) {
        translations[original] = original;
      }
    });

    return res.json({ translations, source: "gemini_batch" });
  } catch (error: any) {
    console.warn("Batch translation request had error, using original texts as fallback:", error.message);
    
    // Graceful fallback for remaining uncached texts
    unCachedTexts.forEach((t) => {
      translations[t] = t;
    });

    return res.json({ translations, source: "error-fallback", error: error.message });
  }
});

// Secure Backend Endpoints for Inalterable Transactions
// NOTE: In production, these endpoints use `firebase-admin` (which bypasses firestore.rules)
// to lock the user's wallet modification tightly to the architecture. For this preview,
// they simulate the authoritative resolution gateway for all roles.

app.post("/api/wallet/recharge", async (req, res) => {
  const { userId, amountCDF, operator, transactionRef } = req.body;
  if (!userId || !amountCDF || !operator) {
    return res.status(400).json({ error: "Paramètres invalides pour la transaction." });
  }

  // Simulate contacting Mobile Money APIs...
  res.json({ 
    success: true, 
    message: `Transaction ${transactionRef || 'TRX-GOMOTO'} reçue du fournisseur ${operator}. Mise à jour du solde en base de données.`,
    status: "COMPLETED",
    amountCDF
  });
});

app.post("/api/escrow/release", async (req, res) => {
  const { rideId, clientPrice, clientId, driverId, ownerId } = req.body;
  
  if (!rideId || !driverId) {
    return res.status(400).json({ error: "Détails de la course invalides pour la libération Escrow." });
  }

  // Calculate strict distribution algorithm
  // 70% Driver, 15% Owner, 15% Admin
  const driverShare = clientPrice * 0.70;
  const ownerShare = clientPrice * 0.15;
  const adminShare = clientPrice * 0.15;

  // In production, an atomic batch write via firebase-admin is executed here to update ALL wallets precisely.
  
  res.json({
    success: true,
    message: "Fonds libérés et répartis intégralement à tous les acteurs avec succès depuis le backend.",
    distribution: {
      clientDebited: clientPrice,
      driverCredited: driverShare,
      ownerCredited: ownerShare,
      adminCommission: adminShare
    }
  });
});

// APIs for Legalization points feedback (Database persistence with Cloud SQL)
app.get("/api/legalization/reviews", async (req, res) => {
  const { centerId } = req.query;
  if (!centerId) {
    return res.status(400).json({ error: "Le paramètre centerId est requis." });
  }

  try {
    const results = await db
      .select({
        id: legalizationReviews.id,
        centerId: legalizationReviews.centerId,
        rating: legalizationReviews.rating,
        comment: legalizationReviews.comment,
        createdAt: legalizationReviews.createdAt,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(legalizationReviews)
      .innerJoin(users, eq(legalizationReviews.userId, users.id))
      .where(eq(legalizationReviews.centerId, centerId as string))
      .orderBy(desc(legalizationReviews.createdAt));

    res.json(results);
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des avis." });
  }
});

app.post("/api/legalization/reviews", requireAuth, async (req: AuthRequest, res) => {
  const { centerId, rating, comment } = req.body;
  
  if (!centerId || !rating || !comment) {
    return res.status(400).json({ error: "Toutes les informations (centerId, rating, comment) sont requises." });
  }

  const parsedRating = parseInt(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: "La note doit être comprise entre 1 et 5." });
  }

  try {
    const uid = req.user?.uid;
    const email = req.user?.email || "utilisateur@gomoto.cd";
    
    if (!uid) {
      return res.status(401).json({ error: "Non autorisé: identifiant Firebase manquant." });
    }

    // Sync or fetch user
    const dbUser = await getOrCreateUser(uid, email);

    // Insert new review
    const newReview = await db
      .insert(legalizationReviews)
      .values({
        userId: dbUser.id,
        centerId,
        rating: parsedRating,
        comment,
      })
      .returning();

    res.status(201).json({
      success: true,
      review: {
        ...newReview[0],
        userEmail: email,
        userRole: dbUser.role
      }
    });
  } catch (error: any) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Erreur serveur lors de la soumission de l'avis." });
  }
});

// Setup Vite & Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GoMoto RDC full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
