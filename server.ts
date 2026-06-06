import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
