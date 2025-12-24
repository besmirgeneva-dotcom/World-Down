
export interface CountryStats {
  economy: number; // 0-100
  military: number; // 0-100
  population: number; // 0-100
  hasNuclear: boolean;
  hasSpaceProgram: boolean;
}

export interface Country {
  id: string; // ISO code or Name
  name: string;
  stats: CountryStats;
  color?: string; // Dynamic color based on status
  allianceId?: string | null;
  ownerId?: string; // The ID/Name of the country that owns this territory (if annexed)
  isDestroyed?: boolean; // New flag for nuclear wasteland
}

export interface Alliance {
  id: string;
  name: string;
  color: string;
  leaderId?: string | null; // ID of the country leading the alliance
}

export interface GameEvent {
  turn: number;
  description: string;
  impacts?: {
    countryId: string;
    stat: keyof CountryStats;
    delta: number;
  }[];
}

export interface GameState {
  turn: number;
  countries: Country[];
  alliances: Alliance[];
  events: GameEvent[];
  selectedCountryId: string | null;
  isSimulating: boolean;
  gameOver: boolean;
  tokensUsed: number;
  turnModifications: Record<string, StatType[]>; // Tracks which stats were changed this turn per country
}

export enum StatType {
  ECONOMY = 'economy',
  MILITARY = 'military',
  POPULATION = 'population',
  NUCLEAR = 'hasNuclear',
  SPACE = 'hasSpaceProgram'
}