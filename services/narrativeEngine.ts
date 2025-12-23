import { Country } from "../types";

// --- TEMPLATES DATABASE ---
// Plus il y a de variations, moins le joueur sentira la répétition.
const TEMPLATES: Record<string, string[]> = {
  // --- GUERRE & CONQUÊTE ---
  "WAR_WIN": [
    "FLASH SPÉCIAL : Le drapeau de {source} flotte désormais sur le palais présidentiel de {target}. L'armée a capitulé sans condition après 48h de pilonnage intensif. La communauté internationale est sous le choc de cette annexion brutale.",
    "FRONTIÈRES REDESSINÉES : Les divisions blindées de {source} ont traversé les lignes de défense de {target} comme du papier. L'annexion est confirmée par les observateurs de l'ONU, plongeant la région dans une nouvelle ère géopolitique.",
    "OPÉRATION 'TEMPÊTE D'ACIER' : Succès total pour l'état-major de {source}. La résistance de {target} s'est effondrée, laissant le pays et ses ressources à la merci de l'envahisseur. Les bourses mondiales s'affolent face à ce coup de force.",
    "CHUTE D'UN RÉGIME : {target} n'est plus. Les forces spéciales de {source} ont sécurisé les points stratégiques de la capitale à l'aube. Une administration militaire provisoire a été mise en place immédiatement."
  ],
  "WAR_LOSS": [
    "DÉBÂCLE MILITAIRE : L'invasion tentée par {source} tourne au fiasco total. Les forces de défense de {target}, galvanisées, ont repoussé l'ennemi au-delà de la frontière, infligeant de lourdes pertes matérielles aux agresseurs.",
    "ENLISMENT SANGLANT : Les troupes de {source} sont piégées dans la guérilla urbaine de {target}. Le moral s'effondre alors que les images de colonnes de chars détruits inondent les réseaux sociaux. Le repli stratégique est ordonné.",
    "ÉCHEC TACTIQUE : Les renseignements de {source} avaient sous-estimé les capacités de {target}. L'offensive s'est brisée sur un mur de feu défensif. C'est une humiliation majeure pour le commandement de {source}."
  ],
  
  // --- DIPLOMATIE & ALLIANCES ---
  "ALLIANCE_NEW": [
    "NOUVEL ORDRE MONDIAL : {source} annonce avec fracas la création de l'alliance '{extra}'. Un nouveau bloc de superpuissance est né, promettant de défier l'hégémonie actuelle et de protéger ses intérêts par la force si nécessaire.",
    "TRAITÉ HISTORIQUE : La signature de la charte de '{extra}' par {source} marque le début d'une nouvelle ère. Les chancelleries rivales s'activent fébrilement pour analyser la menace que représente cette nouvelle coalition."
  ],
  "ALLIANCE_JOIN": [
    "EXTENSION D'INFLUENCE : {source} rejoint officiellement les rangs de l'alliance menée par {target}. Le bloc se renforce considérablement, isolant un peu plus ses rivaux et sécurisant une zone d'influence majeure.",
    "RENFORT STRATÉGIQUE : L'alliance de {target} accueille {source} à bras ouverts. Des exercices militaires conjoints sont déjà annoncés pour sceller cette fraternité d'armes face aux menaces extérieures."
  ],
  "ALLIANCE_LEAVE": [
    "RUPTURE DIPLOMATIQUE : Coup de théâtre à l'ONU, {source} claque la porte de son alliance. Les analystes prédisent une période d'instabilité majeure alors que les anciens alliés deviennent des rivaux potentiels.",
    "ISOLATIONNISME : {source} déclare son indépendance stratégique et quitte le bloc de {target}. 'Nous ne suivrons plus les ordres de puissances étrangères', a déclaré le président lors d'une allocution télévisée."
  ],

  // --- NUCLÉAIRE ---
  "NUKE": [
    "APOCALYPSE NOW : Un champignon atomique s'élève au-dessus de {target}. {source} a franchi la ligne rouge absolue. Le monde retient son souffle en attendant une riposte qui pourrait signifier la fin de la civilisation.",
    "HORREUR NUCLÉAIRE : {source} a frappé {target} avec une arme tactique. Les capteurs sismiques mondiaux confirment l'explosion. Condamnation unanime et terrifiée du Conseil de Sécurité face à l'impensable."
  ],

  // --- ÉCONOMIE & SABOTAGE ---
  "ECO_BLOCK": [
    "GUERRE COMMERCIALE : {source} impose un blocus naval et aérien total à {target}. Les pénuries alimentaires et médicales commencent déjà à se faire sentir dans la capitale assiégée.",
    "ASPHYXIE ÉCONOMIQUE : L'économie de {target} suffoque sous les sanctions draconiennes dictées par {source}. La monnaie s'effondre de 40% en une séance, provoquant des émeutes de la faim."
  ],
  "SABOTAGE": [
    "CYBER-GUERRE : Les infrastructures énergétiques de {target} sont paralysées par un virus inconnu. {source} nie toute implication, mais les traces numériques pointent vers ses services de renseignement.",
    "OMBRES DE LA GUERRE : Une série d'explosions mystérieuses a ravagé les complexes militaro-industriels de {target}. Les experts y voient la signature des agents de l'ombre de {source}."
  ],

  // --- ESPACE ---
  "SPACE_OPS": [
    "DOMINATION ORBITALE : {source} déploie une nouvelle constellation de satellites espions. 'Le ciel nous appartient', déclare le ministre de la défense, provoquant l'ire de ses rivaux.",
    "COURSE AUX ÉTOILES : {source} annonce une percée majeure dans la militarisation de l'espace, menaçant l'équilibre de la terreur."
  ],

  // --- GÉNÉRIQUE / FALLBACK ---
  "GENERIC": [
    "TENSIONS VIVES : Les relations entre {source} et {target} atteignent un point de rupture. Des mouvements de troupes suspects sont signalés le long de la frontière.",
    "INCIDENT DIPLOMATIQUE : L'ambassadeur de {target} a été convoqué par {source} suite à des déclarations incendiaires. La rhétorique guerrière s'intensifie de part et d'autre."
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
    // 1. Trouver le bon set de templates
    // On supporte les codes exacts "WAR_WIN" ou les préfixes "WAR" si pas de match exact
    let templates = TEMPLATES[eventCode];
    
    if (!templates) {
        // Fallback partiel (ex: WAR_SKIRMISH -> WAR_WIN par défaut si non trouvé)
        const prefix = eventCode.split('_')[0]; 
        const potentialKey = Object.keys(TEMPLATES).find(k => k.startsWith(prefix));
        templates = potentialKey ? TEMPLATES[potentialKey] : TEMPLATES["GENERIC"];
    }

    // 2. Choisir une variation aléatoire
    const template = templates[Math.floor(Math.random() * templates.length)];

    // 3. Remplacer les variables
    return template
        .replace(/{source}/g, sourceName)
        .replace(/{target}/g, targetName)
        .replace(/{extra}/g, extraInfo || "Coalition")
        .replace(/{alliance}/g, extraInfo || "l'Alliance");
};
