/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: {
    heading: string;
    content: string[];
  }[];
}

export const appVision = {
  title: "Notre Vision",
  description: "Propulser la mobilité en République Démocratique du Congo vers une ère moderne, sécurisée et inclusive. En connectant chauffeurs de taxi-moto, propriétaires et passagers à travers une technologie fiable et 100% congolaise, nous construisons l'infrastructure de transport de demain pour les 26 provinces de la RDC.",
  points: [
    { title: "Sécurité Absolue", text: "Zéro compromis sur la sécurité des passagers et des motards grâce à des vérifications rigoureuses." },
    { title: "Inclusion Financière", text: "Faciliter l'accès aux services financiers et de paiement mobile (Mobile Money) pour tous." },
    { title: "Création d'Emplois", text: "Offrir des revenus décents et stables aux jeunes chauffeurs et entrepreneurs locaux." }
  ]
};

export const appMission = {
  title: "Notre Mission",
  content: "Notre mission est de formaliser le secteur du transport par taxi-moto en RDC en introduisant une plateforme numérique transparente, éthique et sécurisée. Nous offrons aux passagers un moyen de déplacement rapide et abordable, aux chauffeurs des outils de travail optimisés et aux propriétaires de flottes un tableau de bord de gestion de leurs investissements en temps réel.",
};

export const generalTerms: LegalDocument = {
  title: "Conditions Générales d'Utilisation (CGU)",
  lastUpdated: "Mis à jour le 3 Juin 2026",
  sections: [
    {
      heading: "1. Acceptation des Conditions et Souveraineté Nationale",
      content: [
        "En téléchargeant, en installant ou en utilisant l'application GoMoto RDC, chaque utilisateur (Passager, Chauffeur ou Propriétaire) exprime son consentement inconditionnel aux présentes Conditions Générales d'Utilisation.",
        "Nos activités s'inscrivent en stricte conformité avec le Ministère des Transports et Voies de Communication, préservant la souveraineté légale des autorités régulatrices de la République Démocratique du Congo."
      ]
    },
    {
      heading: "2. Lutte contre les Tracasseries et Rôle d'Arbitre de GoMoto",
      content: [
        "GoMoto RDC s'engage activement aux côtés des autorités policières et urbaines pour mettre fin aux tracasseries routières et aux amendes ou attestations arbitraires infligées aux conducteurs de taxi-moto.",
        "La plateforme joue le rôle d'arbitre officiel et transparent entre les forces de l'ordre, les propriétaires, les chauffeurs et les clients. Toutes les transactions de trajet, identités et conformités de documents étant enregistrées de manière infalsifiable, elles servent de preuve de régularité face aux agents de contrôle compétents dans les 26 provinces."
      ]
    },
    {
      heading: "3. Détection Technologique de la Conduite Dangereuse",
      content: [
        "Notre système intègre un algorithme de détection en temps réel des conduites dangereuses (accélérations brusques, excès de vitesse, zigzags, non-respect du code de la route).",
        "En cas de conduite dangereuse persistante ou de signalement de conduite en état d'ivresse, la plateforme génère une alerte immédiate et transmet ces données télématiques aux autorités provinciales compétentes à des fins de régulation de sécurité publique."
      ]
    },
    {
      heading: "4. Intervention des Autorités Compétentes",
      content: [
        "L'intervention des forces gouvernementales et de la Police Nationale Congolaise (PNC) est strictement canalisée à travers nos protocoles d'urgence.",
        "Les autorités interviendront avec la plus grande rigueur juridique uniquement en cas de déclenchement d'alertes majeures : cas de vols avérés, kidnappings, usage de documents administratifs contrefaits, refus flagrant du code de la route congolais, comportements criminels ou conduite sous l'emprise flagrante de l'alcool."
      ]
    },
    {
      heading: "5. Visibilité Obligatoire & Marques Distinctives",
      content: [
        "Pour assurer la traçabilité et barrer la route aux infiltrés ou criminels non reconnus, TOUS les chauffeurs actifs agréés GoMoto RDC sont tenus d'être identifiables de manière visible et obligatoire.",
        "Cette identification s'opère par le port obligatoire de notre gilet/tenue de sécurité rétro-réfléchissante officielle ainsi que par l'apposition visible de notre logo officiel soit sur le gilet, soit directement sur leur casque de protection. Toute personne conduisant sous la bannière numérique sans porter ses attributs d'identification s'expose à une exclusion définitive."
      ]
    },
    {
      heading: "6. Portefeuille Électronique et Fiscalité Civique Congolaise",
      content: [
        "La plateforme propose un système de portefeuille électronique (Wallet) sécurisé fonctionnant de manière autonome en Francs Congolais (CDF) et Dollars Américains (USD).",
        "Dans l'optique de soutenir l'effort national, GoMoto RDC prévoit l'intégration progressive d'un module de prélèvement à la source et de reversement automatisé des impositions et taxes réglementaires dues à l'État (impôt sur le revenu professionnel, taxe foncière routière ou vignette administrative exigée par le gouvernement central ou provincial)."
      ]
    },
    {
      heading: "7. Tolérance Zéro Absolue (Produits Prohibés et Contrebande)",
      content: [
        "GoMoto RDC applique une politique de TOLÉRANCE ZÉRO absolue pour toute infraction de droit commun mettant en péril la nation.",
        "Le transport ou le transit de stupéfiants/drogues, de substances psychotropes prohibées, de boissons frelatées, d'armes à feu, de munitions, d'explosifs ou de tout colis suspect d'origine suspecte est rigoureusement INTERDIT.",
        "Tout contrevenant sera immédiatement banni irréversiblement du réseau GoMoto, ses avoirs gelés à des fins d'enquête, et son identité ainsi que sa localisation GPS seront transmises sur-le-champ aux officiers de police judiciaire (OPJ) et aux services de sécurité pour arrestation."
      ]
    }
  ]
};

export const driverPolicy: LegalDocument = {
  title: "Charte Contractuelle des Chauffeurs",
  lastUpdated: "Mis à jour le 3 Juin 2026",
  sections: [
    {
      heading: "1. Exigences Obligatoires d'Enrôlement en RDC",
      content: [
        "Pour être agréé actif sur la plateforme, le chauffeur (motard) doit obligatoirement fournir une pièce d'identité valide (Passeport, Carte de citoyenneté RDC, Permis de conduire national, ou carte d'électeur en cours de validité).",
        "En plus des pièces physiques, le motard doit accepter l'indexation de ses documents officiels de gérance (carte rose, vignette et contrôle technique de la province correspondante)."
      ]
    },
    {
      heading: "2. Élimination des Versements Frauduleux et Arbitrages financiers",
      content: [
        "Afin d'éliminer définitivement les versements frauduleux et les litiges récurrents de fin de semaine entre chauffeurs et propriétaires de motos, GoMoto RDC gère automatiquement la répartition.",
        "À chaque course achevée et payée, la quote-part convenue est ventilée mathématiquement et instantanément sur le portefeuille électronique respectif des deux parties de manière infalsifiable (ex. 15% commission GoMoto, le reste selon le taux de versement contractuel convenu). Aucun chauffeur ne peut être harcelé ou contraint à des versements arbitraires hors trajet."
      ]
    },
    {
      heading: "3. Identification Visuelle et Code de Route Obligatoire",
      content: [
        "Chaque chauffeur s'engage à porter à chaque seconde en service la tenue réglementaire officielle et le casque officiel arborant fièrement le logo GoMoto visible de loin.",
        "L'obligation de fournir un second casque de protection propre pour le passager est absolue. La plateforme détecte les comportements de conduite inadéquats et suspendra le chauffeur sans préavis s'il est détecté dangereux."
      ]
    }
  ]
};

export const clientPolicy: LegalDocument = {
  title: "Charte et Politique des Clients",
  lastUpdated: "Mis à jour le 3 Juin 2026",
  sections: [
    {
      heading: "1. Comportement du Passager et Respect de l'Arbitre",
      content: [
        "Le passager s'engage à traiter le chauffeur avec respect, civisme et dignité. En tant qu'arbitre impartial du trajet, GoMoto enregistre tout abus commis de part et d'autre.",
        "Le port du casque de protection orné du logo ou fourni par GoMoto RDC est une obligation légale de sécurité pour le passager, sans exception."
      ]
    },
    {
      heading: "2. Tolérance Zéro Bagages et Colis Illicites",
      content: [
        "Le passager est strictement interdit d'utiliser les services de GoMoto pour le transport d'armes à feu, de couteaux ou d'objets tranchants non protégés, de drogues, de produits inflammables, ou de tout matériel d'origine illégale.",
        "Tout soupçon d'infraction flagrante donne le droit au chauffeur de refuser la prise en charge et de signaler instantanément l'utilisateur pour une intervention immédiate de la PNC."
      ]
    }
  ]
};

export const ownerPolicy: LegalDocument = {
  title: "Charte Obligatoire des Propriétaires de Flottes",
  lastUpdated: "Mis à jour le 3 Juin 2026",
  sections: [
    {
      heading: "1. Transparence de Recettes Automatisée (Anti-Fraude)",
      content: [
        "GoMoto RDC garantit l'élimination totale du risque de non-versement et des fuites financières.",
        "La plateforme récolte les fonds des courses en temps réel. La ventilation vers votre portefeuille est automatique et basée sur des enregistrements GPS réels, récompensant équitablement l'effort de votre chauffeur et garantissant le retour sur investissement de votre capital."
      ]
    },
    {
      heading: "2. Fiscalité et Conformité Routière Obligatoire",
      content: [
        "Le propriétaire de flotte s'engage à ne mettre en gérance sur la plateforme que des motocyclettes conformes à la réglementation routière en vigueur (assurance à jour, carte rose légitime et plaque d'immatriculation d'État).",
        "En collaboration avec les ministères de tutelle, le propriétaire accepte l'inclusion future de la retenue fiscale automatique sur ses gains nets liés aux impositions légales sur les flottes."
      ]
    }
  ]
};

export const legalRegulations = {
  title: "Règlementations Légales Obligatoires (Chauffeur RDC)",
  requirements: [
    "Être âgé de 18 ans révolus au moment de l'inscription.",
    "Détenir un permis de conduire de catégorie A valide en République Démocratique du Congo.",
    "Posséder un certificat de nationalité, une carte d'électeur ou un passeport congolais en cours de validité (ou titre de séjour valide).",
    "Présenter un extrait de casier judiciaire vierge ou attestation de bonne vie et mœurs de moins de 3 mois.",
    "La motocyclette doit disposer d'une carte rose valide, d'une plaque d'immatriculation d'État et de la vignette fiscale provinciale à jour.",
    "Porter obligatoirement la tenue officielle / gilet rétro-réfléchissant de GoMoto RDC avec logo visible sur le casque ou le dos.",
    "Se soumettre sans condition aux contrôles de police PNC en cas de signalement de conduite dangereuse détectée par le GPS de l'appareil."
  ]
};

export interface EmergencyPhone {
  label: string;
  number: string;
  category: string;
  description: string;
}

export const drcEmergencyNumbers: EmergencyPhone[] = [
  {
    label: "Secours Police Nationale (PNC)",
    number: "112",
    category: "Police & Sécurité Urbaine",
    description: "Appel d'urgence national de la Police PNC. Pour vols, agressions et incidents de route."
  },
  {
    label: "Permanence Spéciale Gombe",
    number: "111",
    category: "Sécurité & Ordre Public",
    description: "Ligne directe d'urgence provinciale de Kinshasa pour intervention immédiate."
  },
  {
    label: "Pompiers & Secours Incendie",
    number: "118",
    category: "Incendie & Débouchage",
    description: "Sapeurs-pompiers nationaux de la RDC pour sinistres ou incendies routiers."
  },
  {
    label: "Urgences Médicales (SAMU)",
    number: "113",
    category: "Santé & Hôpitaux",
    description: "Service d'aide médicale d'urgence et transports d'ambulances."
  },
  {
    label: "Sécurité & Assistance GoMoto",
    number: "+243821445777",
    category: "Support Partenaire",
    description: "Assistance et secours routier 24h/24 pour la communauté GoMoto."
  }
];

