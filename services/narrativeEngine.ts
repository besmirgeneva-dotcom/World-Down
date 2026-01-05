import { Country } from "../types";

// --- TEMPLATES DATABASE ---
// Plus il y a de variations, moins le joueur sentira la répétition.
const TEMPLATES: Record<string, string[]> = {
  // --- GUERRE & CONQUÊTE (WAR_WIN) ---
  "WAR_WIN": [
    "FLASH SPÉCIAL : Le drapeau de {source} flotte désormais sur le palais présidentiel de {target}. L'armée a capitulé sans condition après 48h de pilonnage intensif.",
    "FRONTIÈRES REDESSINÉES : Les divisions blindées de {source} ont traversé les lignes de défense de {target} comme du papier. L'annexion est confirmée par les observateurs de l'ONU.",
    "OPÉRATION 'TEMPÊTE D'ACIER' : Succès total pour l'état-major de {source}. La résistance de {target} s'est effondrée, laissant le pays et ses ressources à la merci de l'envahisseur.",
    "CHUTE D'UN RÉGIME : {target} n'est plus. Les forces spéciales de {source} ont sécurisé les points stratégiques de la capitale à l'aube. Une administration militaire provisoire a été mise en place.",
    "VICTOIRE ÉCLAIR : En une manœuvre audacieuse, {source} a encerclé les forces principales de {target}, forçant une reddition immédiate. Le territoire est désormais sous contrôle total.",
    "NOUVELLE CARTE : Les cartographes du monde entier doivent se mettre à jour. {target} a été rayé de la carte politique par la puissance de feu écrasante de {source}.",
    "FIN DE PARTIE : Le gouvernement de {target} a fui en exil alors que les chars de {source} défilent sur la place centrale. L'intégration administrative a déjà commencé.",
    "ANNEXION TOTALE : Malgré une résistance héroïque, {target} tombe sous le joug de {source}. Les ressources industrielles sont saisies comme butin de guerre."
  ],

  // --- DÉFAITE / ÉCHEC MILITAIRE (WAR_LOSS) ---
  "WAR_LOSS": [
    "DÉBÂCLE MILITAIRE : L'invasion tentée par {source} tourne au fiasco total. Les forces de défense de {target}, galvanisées, ont repoussé l'ennemi au-delà de la frontière.",
    "ENLISEMENT SANGLANT : Les troupes de {source} sont piégées dans la guérilla urbaine de {target}. Le moral s'effondre et le repli stratégique est ordonné dans la confusion.",
    "ÉCHEC TACTIQUE : Les renseignements de {source} avaient sous-estimé les capacités de {target}. L'offensive s'est brisée sur un mur de feu défensif.",
    "HUMILIATION : Les images de chars de {source} brûlant aux frontières de {target} font le tour du monde. L'opération d'invasion est annulée face aux pertes insoutenables.",
    "CONTRE-OFFENSIVE : {target} a non seulement stoppé l'avancée de {source}, mais a infligé des dégâts critiques à ses lignes de ravitaillement."
  ],

  // --- GUERRE (Générique / Attaque en cours) ---
  "WAR_GENERAL": [
    "BOMBARDEMENTS : L'aviation de {source} pilonne les infrastructures de {target}. Les sirènes résonnent nuit et jour.",
    "OFFENSIVE MAJEURE : {source} lance trois corps d'armée à l'assaut de {target}. Les combats font rage le long de la frontière.",
    "AFFRONTEMENTS : Violents échanges d'artillerie entre {source} et {target}. La situation menace de dégénérer en conflit total."
  ],
  
  // --- ALLIANCES (Création) ---
  "ALLIANCE_NEW": [
    "NOUVEL ORDRE MONDIAL : {source} annonce avec fracas la création de l'alliance '{extra}'. Un nouveau bloc de superpuissance est né, promettant de défier l'hégémonie actuelle.",
    "TRAITÉ HISTORIQUE : La signature de la charte de '{extra}' par {source} marque le début d'une nouvelle ère. Les chancelleries rivales s'activent pour analyser la menace.",
    "COALITION NOUVELLE : {source} fonde '{extra}', un pacte de défense mutuelle destiné à sécuriser ses intérêts vitaux face à l'instabilité mondiale.",
    "LIGUE DES NATIONS : Sous l'impulsion de {source}, le bloc '{extra}' voit le jour. 'Notre union fait notre force', a déclaré le leader."
  ],

  // --- ALLIANCES (Rejoindre) ---
  "ALLIANCE_JOIN": [
    "EXTENSION D'INFLUENCE : {source} rejoint officiellement les rangs de l'alliance menée par {target}. Le bloc se renforce considérablement.",
    "RENFORT STRATÉGIQUE : L'alliance de {target} accueille {source} à bras ouverts. Des exercices militaires conjoints sont déjà annoncés.",
    "ALIGNEMENT : {source} prête serment de fidélité au pacte de {target}. La carte des alliances se redessine dangereusement.",
    "NORD ET SUD : En rejoignant le bloc de {target}, {source} sécurise un parapluie nucléaire et économique vital."
  ],

  // --- ALLIANCES (Quitter) ---
  "ALLIANCE_LEAVE": [
    "RUPTURE DIPLOMATIQUE : Coup de théâtre à l'ONU, {source} claque la porte de son alliance. Les analystes prédisent une période d'instabilité majeure.",
    "ISOLATIONNISME : {source} déclare son indépendance stratégique et quitte le bloc de ses anciens alliés. 'Nous ne suivrons plus les ordres de l'étranger'.",
    "TRAHISON ? : {source} se retire unilatéralement de son pacte de défense. Ses anciens partenaires crient au scandale diplomatique.",
    "SOLO : Estimant que l'alliance freinait ses ambitions, {source} reprend sa liberté totale de mouvement."
  ],

  // --- DIPLOMATIE (Amitié / Soutien / Ennemi) ---
  "FRIENDSHIP": [
    "COOPÉRATION RENFORCÉE : {source} et {target} signent un accord de libre-échange sans précédent. Boom économique en vue.",
    "RAPPROCHEMENT : Visite d'état historique entre les dirigeants de {source} et {target}. L'atmosphère est à la détente.",
    "AXE DE PROSPÉRITÉ : Un pont commercial est établi entre {source} et {target}, scellant une amitié durable.",
    "PACTE DE NON-AGRESSION : {source} et {target} s'engagent à résoudre leurs différends par la voie diplomatique."
  ],
  "MILITARY_SUPPORT": [
    "PONT AÉRIEN : Des cargos militaires de {source} atterrissent chez {target} chargés de munitions et de matériel de pointe.",
    "CONSEILLERS MILITAIRES : {source} déploie ses experts pour former et équiper les bataillons de {target}.",
    "PRÊT-BAIL : {source} ouvre ses arsenaux à {target} pour soutenir son effort de défense national.",
    "FRÈRES D'ARMES : 'Nous ne laisserons pas {target} tomber', déclare le général en chef de {source} en envoyant du ravitaillement."
  ],
  "DECLARE_ENEMY": [
    "TENSIONS EXTRÊMES : {source} désigne officiellement {target} comme une 'menace existentielle'. Les diplomates sont rappelés.",
    "GUERRE FROIDE : Le discours du leader de {source} est sans appel : {target} est désormais considéré comme un état hostile.",
    "LIGNE ROUGE : {source} rompt tout dialogue avec {target} et place ses troupes en état d'alerte maximale.",
    "HOSTILITÉ OUVERTE : Sans déclarer la guerre, {source} gèle les avoirs de {target} et ferme ses frontières."
  ],

  // --- POLITIQUE INTERNE (Stats) ---
  "POLITICS": [
    "RÉFORMES MAJEURES : {source} lance un vaste plan de restructuration nationale. Le gouvernement promet des résultats rapides.",
    "DISCOURS PRÉSIDENTIEL : Le leader de {source} galvanise la nation avec de nouvelles directives stratégiques prioritaires.",
    "CHANGEMENT DE CAP : {source} ajuste sa stratégie globale pour répondre aux défis du siècle. Les marchés réagissent.",
    "MOBILISATION : {source} débloque des fonds d'urgence pour accélérer son développement. La population est mise à contribution.",
    "PROPAGANDE : Une vague de patriotisme traverse {source} suite à une campagne médiatique massive orchestrée par l'état.",
    "PLAN QUINQUENNAL : {source} réoriente toute son industrie pour atteindre des objectifs de production ambitieux."
  ],

  // --- NUCLÉAIRE ---
  "NUKE": [
    "APOCALYPSE NOW : Un champignon atomique s'élève au-dessus de {target}. {source} a franchi la ligne rouge absolue. Le monde retient son souffle.",
    "HORREUR NUCLÉAIRE : {source} a frappé {target} avec une arme tactique. Les capteurs sismiques mondiaux confirment l'explosion. Condamnation unanime.",
    "L'IMPENSABLE : 'Nous avons vitrifié la menace', annonce froidement le commandement de {source} après la frappe nucléaire sur {target}.",
    "HIVER ATOMIQUE : Les retombées radioactives de l'attaque de {source} sur {target} inquiètent les pays voisins. C'est un crime contre l'humanité."
  ],

  // --- ÉCONOMIE & BLOCUS ---
  "ECO_BLOCK": [
    "GUERRE COMMERCIALE : {source} impose un blocus naval et aérien total à {target}. Les pénuries alimentaires commencent.",
    "ASPHYXIE : L'économie de {target} suffoque sous les sanctions draconiennes dictées par {source}. La monnaie s'effondre.",
    "EMBARGO : {source} interdit toute exportation vers {target}. Les ports sont bloqués par la marine de guerre.",
    "CHOC BOURSIER : Les sanctions de {source} provoquent la panique sur les marchés financiers de {target}."
  ],

  // --- SABOTAGE & ESPIONNAGE ---
  "SABOTAGE": [
    "CYBER-GUERRE : Les infrastructures énergétiques de {target} sont paralysées par un virus. {source} nie toute implication.",
    "OMBRES DE LA GUERRE : Une série d'explosions mystérieuses a ravagé les complexes militaro-industriels de {target}. La signature de {source} est suspectée.",
    "BLACKOUT : Le réseau électrique de {target} s'est effondré suite à un sabotage coordonné. Les services de {source} gardent le silence.",
    "INFILTRATION : Des agents de {source} ont corrompu des officiers clés de {target}, désorganisant sa chaîne de commandement."
  ],

  // --- ESPACE ---
  "SPACE_OPS": [
    "DOMINATION ORBITALE : {source} déploie une nouvelle constellation de satellites espions. 'Le ciel nous appartient'.",
    "COURSE AUX ÉTOILES : {source} annonce une percée majeure dans la militarisation de l'espace.",
    "MENACE CÉLESTE : {source} teste une arme anti-satellite, provoquant une pluie de débris en orbite basse."
  ],

  // --- GÉNÉRIQUE / FALLBACK ---
  "GENERIC": [
    "TENSIONS VIVES : Les relations entre {source} et {target} atteignent un point de rupture.",
    "INCIDENT DIPLOMATIQUE : L'ambassadeur de {target} a été convoqué par {source} suite à des déclarations incendiaires.",
    "MANOEUVRES : {source} lance des exercices militaires provocateurs près des frontières de {target}.",
    "CRISE FRONTALIÈRE : Des escarmouches ont été signalées entre les patrouilles de {source} et {target}.",
    "ESPIONNAGE : Un drone de {source} a été abattu au-dessus du territoire de {target}.",
    "GUERRE DES MOTS : Échanges virulents à l'ONU entre les représentants de {source} et {target}."
  ]
};

/**
 * Le Cœur du Moteur Narratif : Transforme un code brut en récit
 * @param eventCode Code type "WAR_WIN" ou "NUKE"
 * @param sourceName Nom du pays source (ex: "United States")
 * @param targetName Nom du pays cible (ex: "China")
 * @param extraInfo Info supplémentaire (ex: Nom de l'alliance)
 */
export const decodeEvent = (eventCode: string, sourceName: string, targetName: string = "une nation rivale", extraInfo: string = ""): string => {
    // 1. Mapping intelligent des codes d'action vers les templates
    let key = eventCode;

    // Mapping des actions CommandBar vers les clés TEMPLATES si nécessaire
    if (eventCode === 'Attaque Militaire') key = 'WAR_GENERAL';
    if (eventCode === 'Soutien Militaire') key = 'MILITARY_SUPPORT';
    if (eventCode === 'Déclarer Ennemi') key = 'DECLARE_ENEMY';
    if (eventCode === 'Blocus Économique') key = 'ECO_BLOCK';
    if (eventCode === 'Frappe Nucléaire') key = 'NUKE';
    if (eventCode === 'Alliance') key = 'ALLIANCE_NEW';
    if (eventCode === 'Rejoindre Alliance') key = 'ALLIANCE_JOIN';
    if (eventCode === 'Quitter Alliance') key = 'ALLIANCE_LEAVE';
    if (eventCode === 'Amis') key = 'FRIENDSHIP';
    if (eventCode === 'Annexer') key = 'WAR_WIN';

    // 2. Trouver le bon set de templates
    let templates = TEMPLATES[key];
    
    if (!templates) {
        // Fallback partiel (ex: WAR_SKIRMISH -> WAR_WIN par défaut si non trouvé, ou GENERIC)
        const prefix = key.split('_')[0]; 
        const potentialKey = Object.keys(TEMPLATES).find(k => k.startsWith(prefix));
        templates = potentialKey ? TEMPLATES[potentialKey] : TEMPLATES["GENERIC"];
    }

    // 3. Choisir une variation aléatoire
    const template = templates[Math.floor(Math.random() * templates.length)];

    // 4. Remplacer les variables
    return template
        .replace(/{source}/g, sourceName)
        .replace(/{target}/g, targetName)
        .replace(/{extra}/g, extraInfo || "Coalition")
        .replace(/{alliance}/g, extraInfo || "l'Alliance");
};