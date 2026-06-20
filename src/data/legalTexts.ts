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
  lastUpdated: "Mis à jour le 13 Juin 2026",
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
    },
    {
      heading: "4. Devoirs de Civilité et Comportement envers les Passagers (Clients)",
      content: [
        "Le chauffeur (partenaire motard) est le premier ambassadeur de GoMoto RDC sur la voie publique. Il a l'obligation stricte d'adopter un comportement irréprochable, courtois et digne face aux passagers.",
        "Salutations et Dignité : Le chauffeur doit saluer respectueusement chaque client au début du trajet ('Bonjour', 'Mboté', ou 'Jambo' selon la région) et s'adresser à lui avec une grande politesse. Tout langage familier, injurieux ou déplacé, et toute forme de harcèlement moral, physique ou verbal, mènera au blocage immédiat du compte.",
        "Sécurité et Assistance Bienveillante : Le chauffeur doit prêter assistance au passager pour ajuster correctement son casque de protection GoMoto. Il doit également être prévenant envers les clients vulnérables ou transportant des effets personnels légers et conformes.",
        "Conduite Sereine : En cours de trajet, le conducteur s'interdit les conduites brusques, les cascades ou les accélérations agressives. Le confort psychologique de nos passagers est aussi important que leur sécurité physique."
      ]
    },
    {
      heading: "5. Priorité Absolue et Respect Sacré des Piétons sur la Voie Publique",
      content: [
        "Consciente de la situation en République Démocratique du Congo où les piétons sont historiquement marginalisés sur la chaussée par les chauffeurs de deux-roues, GoMoto RDC exige de tous ses collaborateurs un comportement civique d'avant-garde fondé sur la protection mutuelle.",
        "Priorité Piétonne Sacrée : Le piéton a toujours la priorité absolue dans l'écosystème GoMoto. À l'approche de tout piéton s'apprêtant à traverser la route, en particulier au niveau des carrefours ou des passages cloutés (quand ils existent), le chauffeur GoMoto doit obligatoirement ralentir et lui céder le passage.",
        "Interdiction Absolue des Trottoirs : Les trottoirs, accotements surélevés et passages de marche appartiennent exclusivement aux piétons. Il est rigoureusement et sans exception interdit de rouler, de stationner ou d'effectuer des manœuvres avec une moto GoMoto sur les trottoirs. Les contrevenants s'exposent à un bannissement immédiat et à un signalement automatique.",
        "Protection des Personnes Vulnérables : Une patience absolue doit être observée face aux enfants, personnes âgées, femmes enceintes, parents portant des bébés et personnes en situation de handicap physique. Le chauffeur de moto GoMoto doit stopper sa machine pour sécuriser leur traversée.",
        "Utilisation Interdite des Klaxons Intimidants : Il est formellement interdit de klaxonner de façon prolongée ou agressive afin d'effrayer, bousculer ou forcer de manière hostile un piéton à dégager la chaussée. Le klaxon est réservé uniquement aux alertes de sécurité urgentes contre les collisions.",
        "Sanctions Sévères : Tout manquement aux règles de respect des piétons, tout comportement incivique généralisé ou toute mise en danger de la vie des marcheurs entraînera la résiliation immédiate de la collaboration du chauffeur partenaire."
      ]
    }
  ]
};

export const clientPolicy: LegalDocument = {
  title: "Charte et Politique des Clients",
  lastUpdated: "Mis à jour le 12 Juin 2026",
  sections: [
    {
      heading: "1. Comportement du Passager, Équité et Dignité de Voyage",
      content: [
        "Chaque passager s'engage de manière solennelle et irrévocable à saluer son chauffeur, à s'adresser à lui avec courtoisie et à respecter sa dignité humaine et professionnelle à chaque instant du trajet. Le chauffeur de taxi-moto GoMoto est un partenaire de la route digne de respect.",
        "Le port du casque de protection homologué fourni par GoMoto RDC est obligatoire et non négociable. Le passager doit correctement l'ajuster pour sa propre sécurité et pour préserver la vie humaine sur la voie publique."
      ]
    },
    {
      heading: "2. Civilité, Savoir-Être et Interdiction des Violences envers les Chauffeurs et Agents",
      content: [
        "Le passager s'interdit formellement d'user de comportements agressifs, de violences verbales, de cris, d'insultes, d'injures rabaissantes ou de gestes déplacés à l'égard des chauffeurs (pilotes motards) ou de nos agents d'assistance clientèle (support d'arbitrage).",
        "Aucune menace verbale ou physique ne sera tolérée. Tout manquement à cette règle de savoir-être entraînera la résiliation immédiate du compte du client, ainsi qu'un possible signalement aux autorités policières si l’intégrité physique ou morale de nos professionnels ou de nos agents est menacée."
      ]
    },
    {
      heading: "3. Non-Interférence avec la Conduite et Respect des Règles Routières",
      content: [
        "Pour des raisons évidentes de sécurité, le passager s'engage à ne pas importuner le chauffeur en cours de conduite ou à perturber son attention sur la route.",
        "Le passager a la stricte interdiction de contraindre, de forcer ou d'inciter le chauffeur à commettre des infractions routières, telles que le surpassement de la vitesse autorisée (50 km/h), le transport en surcharge (plus d'un passager), ou le franchissement des barrières de la commune interdite de la Gombe.",
        "Le passager accepte de s'acquitter pleinement du tarif exactement calculé par l'application, sans négociation hostile, intimidation ou recours à de fausses manipulations de portefeuille."
      ]
    },
    {
      heading: "4. Tolérance Zéro Bagages et Colis Illicites",
      content: [
        "Le passager d'un service de transport GoMoto ne peut transporter d'armes, d'objets tranchants ou contondants non emballés sécuritairement, de drogues, de produits hautement inflammables ou d'explosifs.",
        "Le chauffeur est entièrement habilité à refuser la course s'il suspecte un colis illicite ou un danger imminent, sans pénalité pour son compte, et en informant immédiatement nos services pour arbitrage étatique."
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

export const securityTerms: LegalDocument = {
  title: "Codes de Sécurité Nationaux & Rôle d'Arbitre d'État de GoMoto RDC",
  lastUpdated: "Mis à jour le 11 Juin 2026",
  sections: [
    {
      heading: "Art 1. Port Obligatoire du Double Casque d'État",
      content: [
        "En stricte application de la Loi n° 78/022 relative au Code de la Route en RDC, le port du casque homologué est formellement obligatoire pour toute personne à bord d'un deux-roues motorisé.",
        "GoMoto RDC applique cette mesure avec la plus grande fermeté. Les motards ont le devoir de fournir un casque de protection propre pour chaque client. Le passager a l'obligation de le porter durant tout le trajet. Les contrevenants s'exposent à une interpellation immédiate de la PNC et une exclusion définitive de nos services."
      ]
    },
    {
      heading: "Art 2. Interdiction Formelle de la Surcharge Routière (Surcharger la Moto)",
      content: [
        "La pratique de la surcharge (transporter plus d'un passager unique ou charger des colis d'un poids ou d'un gabarit démesuré) est rigoureusement interdite par la loi de transport routier de la RDC.",
        "Nos équipes techniques surveillent le respect strict d'une seule personne embarquée (hors conducteur). Cela garantit l'efficacité du freinage d'urgence, stabilise la motocyclette contre l'usure de suspension et valide la couverture d'assurance de trajet. Les contrevenants subissent une mise à pied immédiate de leur compte."
      ]
    },
    {
      heading: "Art 3. Zone de Restriction Interprovinciale - Ordonnance Gombe",
      content: [
        "Suivant l'Arrêt Provincial de l'Hôtel de Ville de Kinshasa, le transit public des taxi-motos est interdit dans toute la délimitation de la commune de la Gombe, sur le Boulevard du 30 Juin et l'accès à l'Aéroport.",
        "L'application GoMoto RDC applique ce prescrit de l'autorité étatique par barrière virtuelle active (Géofencing GPS). Le système interdit automatiquement d'accepter ou de planifier des courses franchissant ces zones interdites, préservant nos conducteurs de confiscation définitive de leur moto ou d'amendes administratives colossales."
      ]
    },
    {
      heading: "Art 4. Respect du Code de la Route & Alertes Télématiques",
      content: [
        "La vitesse maximale réglementaire autorisée en agglomération urbaine est de 50 km/h pour les motards.",
        "L'application GoMoto RDC audite en permanence l'accéléromètre et le GPS du smartphone. Les conduites erratiques (slaloms intempestifs entre voitures, zigzags, excès de vitesse) génèrent des avertissements instantanés et réduisent la notation citoyenne du conducteur. Les comportements dangereux récurrents ou conduite en état d'ébriété entraînent un bannissement irrévocable."
      ]
    },
    {
      heading: "Art 5. Exigence de Conformité Technique et de Licence",
      content: [
        "Toute motocyclette rattachée au réseau doit être techniquement agréée (freins avant/arrière infaillibles, rétroviseurs bilatéraux réglementaires, éclairage rutilant) et détenir toutes ses pièces d'État valides (Permis A approuvé, Carte Rose de la moto, Vignette Provinciale annuelle et Assurance tiers valide).",
        "Notre plateforme en ligne offre un tableau de bord sécurisé permettant d'émettre instantanément les documents certifiés au format numérique lors de contrôles légaux par la Police de Circulation Routière (PCR)."
      ]
    },
    {
      heading: "Art 6. Lutte contre les Tracasseries & Rôle de Souveraineté de GoMoto",
      content: [
        "Le rôle historique de GoMoto RDC est d'agir en tiers de confiance et arbitre de transparence pour formaliser le transport.",
        "Grâce au tracking GPS inaltérable, à l'authentification faciale de nos chauffeurs et à l'élimination des encaissements physiques par versement automatique en Mobile Money, nous évitons les fraudes, les faux tickets réclamés par certains agents, et les tracasseries policières inutiles sur la voie publique."
      ]
    },
    {
      heading: "Art 7. Tolérance Zéro Produits Prohibés & Sécurité Civique",
      content: [
        "La contribution à l'effort national de pacification implique de barrer la route aux réseaux de vol, contrebande ou transport de colis suspects sans autorisation d'État.",
        "Le transport de drogues, de produits contrefaits frelatés, de substances dangereuses inflammables ou d'armes mène à une suspension à vie. Les coordonnées GPS du trajet en cause et l'identité des comptes de l'utilisateur concerné seront transmises immédiatement aux Officiers de Police Judicière (OPJ) de la PNC."
      ]
    }
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

