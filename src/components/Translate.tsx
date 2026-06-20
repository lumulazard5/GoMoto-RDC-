import React, { useState, useEffect, useRef } from "react";
import { AppLanguage } from "../lib/translations";

interface TProps {
  children: React.ReactNode;
  lang: AppLanguage;
}

// Map of common hardcoded RDC terms for instant translation to prevent any initial lag
export const localDictionary: Record<AppLanguage, Record<string, string>> = {
  fr: {},
  en: {
    "Centre Légal & CGU": "Legal Center & Terms",
    "Masquer CGU": "Hide Terms",
    "Fermer la session": "Log Out",
    "Connecté en tant que:": "Logged in as:",
    "Changer de rôle (Debug)": "Switch Role (Debug)",
    "Se Déconnecter": "Go Offline",
    "Se Connecter": "Go Online",
    "EN LIGNE": "ONLINE",
    "HORS LIGNE": "OFFLINE",
    "Activer le mode conduite": "Activate Driving Mode",
    "Dossier": "Official File",
    "Portefeuille": "Wallet",
    "Courses": "Rides",
    "Évaluations": "Ratings",
    "Litiges": "Disputes",
    "Annuler": "Cancel",
    "Fermer": "Close",
    "Civisme & Clé Secrète de Sécurité d'État GOMOTO": "Civism & GOMOTO State Secret Security Key",
    "Mise à jour d'identité réussie et approuvée de manière souveraine.": "Identity update successful and sovereignly approved.",
    "Bons d'essence": "Fuel Vouchers",
    "Assurance d'État RDC": "DRC State Insurance",
    "S'Inscrire": "Sign Up",
    "Nom": "Name",
    "Prénom": "First Name",
    "Postnom": "Last Name",
    "Numéro d'Électeur (RDC)": "Voter ID Number (DRC)",
    "Numéro Permis de Conduire": "Driving License Number",
    "N° Plaque d'Immatriculation": "Registration Plate No.",
    "Adresse": "Address",
    "N° Gilet Réfléchissant": "Reflective Vest No.",
    "Enregistrer mon Dossier Civique": "Register My Civic Profile",
    "Veuillez remplir tous les champs obligatoires d'État.": "Please fill in all mandatory state fields.",
    "Dossiers de Recours": "Appeal Dossiers",
    "Contrôle des Documents": "Document Control",
    "Registre Universel": "Universal Registry",
    "Retraits Mobile": "Mobile Withdrawals",
    "Volume Provinces": "Provinces Volume",
    "SOS": "SOS Alerts",
    "Partenariats & Contrats Pro": "Partnerships & Pro Contracts",
    "Co-Délégation Admin": "Admin Co-Delegation",
    "Rôles & Permissions": "Roles & Permissions",
    "Manuel & Chartes Staff": "Staff Manual & Charters",
    "Sécurité & WAF Sandbox": "Security & WAF Sandbox",
    "Registre d'Audit (Inaltérable)": "Audit Log (Immutable)",
    "GoMoto CONGO • Cabinet d'Arbitrage et d'Audit": "GoMoto CONGO • Arbitration and Audit Office",
    "Direction Général": "General Directorate",
    "Validation d'identité de conduite et recours d'état civil en RDC (26 provinces)": "Driving identity validation and civil registry appeal in DRC (26 provinces)",
    "Retourner au Portail Utilisateur": "Return to User Portal",
    "Recours civils en attente": "Pending civil appeals",
    "Partenaires Enrôlés Certifiés": "Certified Registered Partners",
    "Provinces sous surveillance": "Provinces under surveillance",
    "Dossiers": "Dossiers",
    "Comptes": "Accounts",
    "Provinces": "Provinces",
  },
  sw: {
    "Centre Légal & CGU": "Kituo cha Kisheria na CGU",
    "Masquer CGU": "Ficha Sheria",
    "Fermer la session": "Toka kwenye mfumo",
    "Connecté en tant que:": "Umeingia kama:",
    "Changer de rôle (Debug)": "Badilisha kazi",
    "Se Déconnecter": "Zima uwepo kazini",
    "Se Connecter": "Washa uwepo kazini",
    "EN LIGNE": "UKO KAZINI",
    "HORS LIGNE": "KAZI ZIMEZIMWA",
    "Activer le mode conduite": "Anza kuendesha pikipiki",
    "Dossier": "Faili langu",
    "Portefeuille": "Pochi",
    "Courses": "Safari",
    "Évaluations": "Ukadiriaji",
    "Litiges": "Migogoro",
    "Annuler": "Ghairi",
    "Fermer": "Funga",
    "Civisme & Clé Secrète de Sécurité d'État GOMOTO": "Uzalendo na Ufunguo wa Usalama wa GOMOTO",
    "Mise à jour d'identité réussie et approuvée de manière souveraine.": "Sasisho la wasifu limefaulu na kuidhinishwa.",
    "Bons d'essence": "Tiketi za Petroli",
    "Assurance d'État RDC": "Bima ya Serikali ya Kongo",
    "S'Inscrire": "Jisajili sasa",
    "Nom": "Jina la ukoo",
    "Prénom": "Jina la kwanza",
    "Postnom": "Jina jingine",
    "Numéro d'Électeur (RDC)": "Nambari ya Kadi ya Mpiga Kura",
    "Numéro Permis de Conduire": "Nambari ya Leseni ya Udereva",
    "N° Plaque d'Immatriculation": "Nambari ya Sahani ya Pikipiki",
    "Adresse": "Anwani",
    "N° Gilet Réfléchissant": "Nambari ya Koti ya Akisi",
    "Enregistrer mon Dossier Civique": "Hifadhi Wasifu Wangu",
    "Veuillez remplir tous les champs obligatoires d'État.": "Tafadhali jaza nafasi zote zinazohitajika.",
    "Dossiers de Recours": "Faili za Rufaa",
    "Contrôle des Documents": "Udhibiti wa Nyaraka",
    "Registre Universel": "Daftari la Jumla",
    "Retraits Mobile": "Kutoa Pesa kwa Simu",
    "Volume Provinces": "Kiasi cha Mikoa",
    "SOS": "SOS",
    "Partenariats & Contrats Pro": "Ushirikiano na Mikataba Pro",
    "Co-Délégation Admin": "Ujumbe wa Pamoja wa Admin",
    "Rôles & Permissions": "Majukumu na Ruhusa",
    "Manuel & Chartes Staff": "Mwongozo na Mikataba ya Wafanyakazi",
    "Sécurité & WAF Sandbox": "Usalama na WAF Sandbox",
    "Registre d'Audit (Inaltérable)": "Kumbukumbu ya Ukaguzi",
    "GoMoto CONGO • Cabinet d'Arbitrage et d'Audit": "GoMoto CONGO • Ofisi ya Usuluhishi na Ukaguzi",
    "Direction Général": "Usimamizi Mkuu",
    "Validation d'identité de conduite et recours d'état civil en RDC (26 provinces)": "Uthibitisho wa utambulisho wa dereva na rufaa ya usajili wa raia nchini DRC (mikoa 26)",
    "Retourner au Portail Utilisateur": "Rudi kwenye Tovuti ya Mtumiaji",
    "Recours civils en attente": "Rufaa za raia zinazosubiriwa",
    "Partenaires Enrôlés Certifiés": "Washirika Waliosajiliwa Waliothibitishwa",
    "Provinces sous surveillance": "Mikoa inayofuatiliwa",
    "Dossiers": "Faili",
    "Comptes": "Akaunti",
    "Provinces": "Mikoa",
  },
  ln: {
    "Centre Légal & CGU": "Esika ya Mibeko ya Leta",
    "Masquer CGU": "Bomba CGU",
    "Fermer la session": "Kanga session",
    "Connecté en tant que:": "Ozali na molongo ya:",
    "Changer de rôle (Debug)": "Senzola mosala (Debug)",
    "Se Déconnecter": "Bima na kati",
    "Se Connecter": "Koma na kati",
    "EN LIGNE": "NA KATI",
    "HORS LIGNE": "NA LIBANDA",
    "Activer le mode conduite": "Bandisa kotambola",
    "Dossier": "Dossier na ngai",
    "Portefeuille": "Portefeuille",
    "Courses": "Mitamboli",
    "Évaluations": "Ba evaluations",
    "Litiges": "Litiges ya matata",
    "Annuler": "Tika",
    "Fermer": "Kanga",
    "Civisme & Clé Secrète de Sécurité d'État GOMOTO": "Bosembo mpe Fungola ya Kimya GOMOTO",
    "Mise à jour d'identité réussie et approuvée de manière souveraine.": "Mikanda ya sika ya nzoto eponami malamu.",
    "Bons d'essence": "Bons ya Essence",
    "Assurance d'État RDC": "Assurance ya Leta RDC",
    "S'Inscrire": "Komisa Kombo",
    "Nom": "Kombo ya Mabota",
    "Prénom": "Kombo ya liboso",
    "Postnom": "Postnom",
    "Numéro d'Électeur (RDC)": "Nimelo ya Carte d'Electeur",
    "Numéro Permis de Conduire": "Nimelo ya Permis",
    "N° Plaque d'Immatriculation": "Nimelo ya Plaque mpona moto",
    "Adresse": "Adresi",
    "N° Gilet Réfléchissant": "Nimelo ya Gilet",
    "Enregistrer mon Dossier Civique": "Bomba Dossier ya motuya",
    "Veuillez remplir tous les champs obligatoires d'État.": "S'il vous plaît silisa kokoma makambo nyonso.",
    "Dossiers de Recours": "Dossier ya Bolimbisi",
    "Contrôle des Documents": "Kotala Mikanda",
    "Registre Universel": "Buku ya Bato nyonso",
    "Retraits Mobile": "Kobimisa mbongo na Simu",
    "Volume Provinces": "Talo ya Ba Provinces",
    "SOS": "SOS",
    "Partenariats & Contrats Pro": "Boyokani mpe Mikanda ya Mosala",
    "Co-Délégation Admin": "Kabola Mosala na Admin",
    "Rôles & Permissions": "Ba Mikano mpe Ndingisa",
    "Manuel & Chartes Staff": "Buku ya Mosala ya Basali",
    "Sécurité & WAF Sandbox": "Libateli mpe WAF Sandbox",
    "Registre d'Audit (Inaltérable)": "Buku ya botali mosala",
    "GoMoto CONGO • Cabinet d'Arbitrage et d'Audit": "GoMoto CONGO • Kisika ya boyokani",
    "Direction Général": "Mokonzi ya Minene",
    "Validation d'identité de conduite et recours d'état civil en RDC (26 provinces)": "Kondimisa mikanda ya motamboli mpe kosala recours na RDC (ba provinces 26)",
    "Retourner au Portail Utilisateur": "Zonga na Esika ya Basali",
    "Recours civils en attente": "Recours ya mboka ezali kozela",
    "Partenaires Enrôlés Certifiés": "Basungi ba komisi mpe ba ndimisi",
    "Provinces sous surveillance": "Ba Provinces bazali kokengela",
    "Dossiers": "Dossiers",
    "Comptes": "Ba comptes",
    "Provinces": "Ba provinces",
  },
  ts: {
    "Centre Légal & CGU": "Kikuku kia mibeko",
    "Masquer CGU": "Sokoka CGU",
    "Fermer la session": "Kujika muaba",
    "Connecté en tant que:": "Mumanyi bu:",
    "Changer de rôle (Debug)": "Fidika mulongo",
    "Se Déconnecter": "Patuka ku lupepela",
    "Se Connecter": "Kwela ku lupepela",
    "EN LIGNE": "MUMANYI",
    "HORS LIGNE": "MUTUPU",
    "Activer le mode conduite": "Kwela mu motobo",
    "Dossier": "Mikanda",
    "Portefeuille": "Mfranga",
    "Courses": "Mitamboli",
    "Évaluations": "Lutumbulo",
    "Litiges": "Bilumbu",
    "Annuler": "Lapa",
    "Fermer": "Jika",
    "Civisme & Clé Secrète de Sécurité d'État GOMOTO": "Buzitu na Leta GOMOTO",
    "Mise à jour d'identité réussie et approuvée de manière souveraine.": "Mikanda mishintshulule bimpe kudi leta.",
    "Bons d'essence": "Mabeji a Essence",
    "Assurance d'État RDC": "Assurance ya Leta RDC",
    "S'Inscrire": "Disoneka",
    "Nom": "Dina dia tshisumbu",
    "Prénom": "Dina dia kumpala",
    "Postnom": "Postnom",
    "Numéro d'Électeur (RDC)": "Nomba wa Carte d'Electeur",
    "Numéro Permis de Conduire": "Nomba wa Permis",
    "N° Plaque d'Immatriculation": "Nomba wa Plaque wa mutobo",
    "Adresse": "Adresi",
    "N° Gilet Réfléchissant": "Nomba wa Gilet",
    "Enregistrer mon Dossier Civique": "Lamika mukanda wanyi",
    "Veuillez remplir tous les champs obligatoires d'État.": "Tafadhali ulongolole mabeji onso a mibeko ya leta.",
    "Dossiers de Recours": "Mikanda ya Lupanji",
    "Contrôle des Documents": "Lutandulu lua Mikanda",
    "Registre Universel": "Mukanda wa Bansompe",
    "Retraits Mobile": "Dipatula mfranga ku Simu",
    "Volume Provinces": "Bungi bua Matinga",
    "SOS": "SOS",
    "Partenariats & Contrats Pro": "Bupatshila & Mikanda ya mudimu",
    "Co-Délégation Admin": "Kundi dia balomboli",
    "Rôles & Permissions": "Midimu & Makanda",
    "Manuel & Chartes Staff": "Mukanda wa mudimu wa Bena mudimu",
    "Sécurité & WAF Sandbox": "Bukubami & WAF Sandbox",
    "Registre d'Audit (Inaltérable)": "Mikanda ya Ditandula dia mfranga",
    "GoMoto CONGO • Cabinet d'Arbitrage et d'Audit": "GoMoto CONGO • Mudimu wa Diolola",
    "Direction Général": "Mulombodi munene",
    "Validation d'identité de conduite et recours d'état civil en RDC (26 provinces)": "Ditaba dia lupepela lua motobo mu RDC (26 provinces)",
    "Retourner au Portail Utilisateur": "Kupingana ku muaba wa muena mudimu",
    "Recours civils en attente": "Lupanji lua bena mboka ludi luindila",
    "Partenaires Enrôlés Certifiés": "Bena mudimu basoneka bimpe",
    "Provinces sous surveillance": "Matinga mashala lungenyi",
    "Dossiers": "Dossiers",
    "Comptes": "Comptes",
    "Provinces": "Provinces",
  },
  kk: {
    "Centre Légal & CGU": "Ndonga ya Minsiku",
    "Masquer CGU": "Sudisa CGU",
    "Fermer la session": "Fula lufungula",
    "Connecté en tant que:": "Kota kuna:",
    "Changer de rôle (Debug)": "Sensola kizina",
    "Se Déconnecter": "Vaika mbanda",
    "Se Connecter": "Ndota mbanza",
    "EN LIGNE": "KATI",
    "HORS LIGNE": "MBANDA",
    "Activer le mode conduite": "Kota kuna nzila ya mwendesi",
    "Dossier": "Dossier yina",
    "Portefeuille": "Kidiba kia mbongo",
    "Courses": "Safari nyonso",
    "Évaluations": "Tumbula mpe bidiba",
    "Litiges": "Ntembe",
    "Annuler": "Mondeka",
    "Fermer": "Kanga",
    "Civisme & Clé Secrète de Sécurité d'État GOMOTO": "Civisme na Fungula Leta GOMOTO",
    "Mise à jour d'identité réussie et approuvée de manière souveraine.": "Mikanda ya sika yina me tombama bimpe.",
    "Bons d'essence": "Bons mpo na Essence",
    "Assurance d'État RDC": "Assurance ya Leta RDC",
    "S'Inscrire": "Sonika Luvila",
    "Nom": "Nza ya Mabota",
    "Prénom": "Jina ya ntete",
    "Postnom": "Postnom",
    "Numéro d'Électeur (RDC)": "Nimelo ya Mpiga kura",
    "Numéro Permis de Conduire": "Nimelo ya Permis de mwendesi",
    "N° Plaque d'Immatriculation": "Nimelo ya Plaque ya mutobo",
    "Adresse": "Adresse mbela",
    "N° Gilet Réfléchissant": "Nimelo ya Gilet",
    "Enregistrer mon Dossier Civique": "Lamika dossier nionso",
    "Veuillez remplir tous les champs obligatoires d'État.": "Sadisa kusonika nimelo nionso ya mfunu ya leta.",
    "Dossiers de Recours": "Mikanda ya Kulomba",
    "Contrôle des Documents": "Kutala Mikanda",
    "Registre Universel": "Mukanda ya Bato nyonso",
    "Retraits Mobile": "Kukula mbongo na Simu",
    "Volume Provinces": "Kiasi kisika na Ba Provinces",
    "SOS": "SOS",
    "Partenariats & Contrats Pro": "Kiuku na Mikanda ya kisalu",
    "Co-Délégation Admin": "Bukabula kisalu na Admin",
    "Rôles & Permissions": "Kisalu na Nswa",
    "Manuel & Chartes Staff": "Mukanda ya kisalu ya Basadi",
    "Sécurité & WAF Sandbox": "Lutaninu na WAF Sandbox",
    "Registre d'Audit (Inaltérable)": "Mukanda ya kotala biloko",
    "GoMoto CONGO • Cabinet d'Arbitrage et d'Audit": "GoMoto CONGO • Kisalu ya dezo",
    "Direction Général": "Mfumu ya nene",
    "Validation d'identité de conduite et recours d'état civil en RDC (26 provinces)": "Kiuvu ya mikanda ya mwendesi mpe kulomba na RDC (provinces 26)",
    "Retourner au Portail Utilisateur": "Kuvutuka na kisika ya muntu",
    "Recours civils en attente": "Kulomba ya bana-mbanza kevingila",
    "Partenaires Enrôlés Certifiés": "Bansadi yina sonama",
    "Provinces sous surveillance": "Provinces yina ke talama malamu",
    "Dossiers": "Dossiers",
    "Comptes": "Comptes",
    "Provinces": "Provinces",
  },
};

const getSafeCacheKey = (lang: string, text: string): string => {
  try {
    return `gomoto_tr_v3_${lang}_${encodeURIComponent(text).replace(/%/g, "_").slice(0, 150)}`;
  } catch (e) {
    return `gomoto_tr_v3_${lang}_err_${text.length}`;
  }
};

// --- CLIENT-SIDE BATCHING QUEUE ENGINE ---
interface PendingTranslation {
  text: string;
  resolve: (translated: string) => void;
}

const translationQueues: Record<string, PendingTranslation[]> = {};
const queueTimers: Record<string, any> = {};

function enqueueTranslation(text: string, lang: string): Promise<string> {
  return new Promise((resolve) => {
    // 1. Fast-path: Check local dictionary
    if (localDictionary[lang]?.[text]) {
      resolve(localDictionary[lang][text]);
      return;
    }

    // 2. Fast-path: Check localStorage Cache
    const cacheKey = getSafeCacheKey(lang, text);
    const cachedVal = localStorage.getItem(cacheKey);
    if (cachedVal) {
      resolve(cachedVal);
      return;
    }

    if (!translationQueues[lang]) {
      translationQueues[lang] = [];
    }
    translationQueues[lang].push({ text, resolve });

    if (!queueTimers[lang]) {
      queueTimers[lang] = setTimeout(() => {
        processQueue(lang);
      }, 250); // Accumulates all rendered elements in the current rendering pass
    }
  });
}

async function processQueue(lang: string) {
  queueTimers[lang] = null;
  const queue = translationQueues[lang] || [];
  translationQueues[lang] = [];

  if (queue.length === 0) return;

  // Deduplicate translation list
  const uniqueTexts = Array.from(new Set(queue.map(q => q.text)));

  try {
    const response = await fetch("/api/translate/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: uniqueTexts, targetLang: lang }),
    });

    if (!response.ok) {
       throw new Error(`HTTP status ${response.status}`);
    }

    const data = await response.json();
    const results: Record<string, string> = data.translations || {};

    // Cache the results
    Object.entries(results).forEach(([original, translated]) => {
      const cacheKey = getSafeCacheKey(lang, original);
      localStorage.setItem(cacheKey, translated);
    });

    // Notify any active synchronous useT hooks about newly loaded translations
    window.dispatchEvent(new CustomEvent("gomoto_translation_batch_loaded"));

    queue.forEach(item => {
      const trans = results[item.text] || item.text;
      item.resolve(trans);
    });
  } catch (err) {
    console.warn("Batch translation request error - resolving to native text:", err);
    // Safe recovery: fallback gracefully and resolve to native French
    queue.forEach(item => {
      item.resolve(item.text);
    });
  }
}
// --- END CLIENT-SIDE BATCHING ENGINE ---

export function T({ children, lang }: TProps) {
  const text = typeof children === "string" ? children : "";

  if (!text.trim() || lang === "fr") {
    return <>{children}</>;
  }

  // Fast-path render-phase check
  if (localDictionary[lang]?.[text]) {
    return <>{localDictionary[lang][text]}</>;
  }

  const cacheKey = getSafeCacheKey(lang, text);
  const cachedVal = localStorage.getItem(cacheKey);

  const [translated, setTranslated] = useState<string>(cachedVal || text);

  useEffect(() => {
    let isMounted = true;

    // Load from cache if it appeared during rendering
    const currentCached = localStorage.getItem(cacheKey);
    if (currentCached) {
      setTranslated(currentCached);
      return;
    }

    setTranslated(text);

    // Enqueue for batch translation
    enqueueTranslation(text, lang).then((transText) => {
      if (isMounted) {
        setTranslated(transText);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, lang]);

  return <>{translated}</>;
}

export function useT(lang: AppLanguage) {
  const [, setTrigger] = useState(0);

  useEffect(() => {
    if (lang === "fr") return;
    const handleUpdate = () => setTrigger(prev => prev + 1);
    window.addEventListener("gomoto_translation_loaded", handleUpdate);
    window.addEventListener("gomoto_translation_batch_loaded", handleUpdate);
    return () => {
      window.removeEventListener("gomoto_translation_loaded", handleUpdate);
      window.removeEventListener("gomoto_translation_batch_loaded", handleUpdate);
    };
  }, [lang]);

  return function t(text: string): string {
    if (lang === "fr" || !text || !text.trim()) return text;

    // 1. Check local dictionary
    if (localDictionary[lang]?.[text]) {
      return localDictionary[lang][text];
    }

    // 2. Check localStorage Cache
    const cacheKey = getSafeCacheKey(lang, text);
    const cachedVal = localStorage.getItem(cacheKey);
    if (cachedVal) return cachedVal;

    // 3. Queue up translation asynchronously
    enqueueTranslation(text, lang);

    return text;
  };
}

/**
 * AutoTranslateContainer
 * Safely traverses the React Virtual DOM tree to dynamically wrap all raw text nodes in standard <T /> components.
 * Bypasses direct DOM manipulation, preventing the "Expected static flag was missing" React rendering crash completely.
 */
export function AutoTranslateContainer({ children, lang }: { children: React.ReactNode; lang: AppLanguage }) {
  if (lang === "fr") {
    return <>{children}</>;
  }

  const translateNode = (node: React.ReactNode): React.ReactNode => {
    if (node === null || node === undefined) return node;

    // 1. Translate raw strings
    if (typeof node === "string") {
      const trimmed = node.trim();
      // Skip empty string or expressions that shouldn't be parsed or translated
      if (!trimmed || trimmed.length < 2 || !/[a-zA-ZÀ-ÿ]/.test(trimmed)) {
        return node;
      }
      if (trimmed.startsWith("http") || trimmed.includes("@") || /^\d+(\.\d+)?(CDF|USD|\s*%)?$/.test(trimmed)) {
        return node;
      }
      // Wrap safely inside dynamic <T> element managed by React
      return <T lang={lang}>{node}</T>;
    }

    // 2. Numbers and booleans
    if (typeof node === "number" || typeof node === "boolean") {
      return node;
    }

    // 3. React element arrays
    if (Array.isArray(node)) {
      return node.map((child, idx) => (
        <React.Fragment key={idx}>{translateNode(child)}</React.Fragment>
      ));
    }

    // 4. Valid React Elements
    if (React.isValidElement(node)) {
      // Do not process already wrapped or dedicated T instances
      if (node.type === T) {
        return node;
      }

      // Safeguard: Skip static markup nodes, SVG graphical structures, and codeblocks
      if (typeof node.type === "string") {
        if (["code", "script", "style", "textarea", "input", "svg", "path", "circle", "rect", "polyline", "line", "g", "defs", "linearGradient", "stop"].includes(node.type)) {
          return node;
        }
      }

      const props = node.props as any;
      if (props && props.children !== undefined && props.children !== null) {
        // Protect components loaded via design pattern structures
        if (typeof props.children === "function") {
          return node;
        }

        const translatedChildren = translateNode(props.children);
        // Optimize: skip cloning if there were no changes
        if (translatedChildren !== props.children) {
          return React.cloneElement(node, { ...props } as any, translatedChildren);
        }
      }
    }

    return node;
  };

  return <>{translateNode(children)}</>;
}
