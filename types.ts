
export enum TournamentType {
  SOLO = 'SOLO',
  SQUAD = 'SQUAD'
}

export interface Tournament {
  id: string;
  title: string;
  image: string; // 16:9 ratio
  type: TournamentType;
  entryFee: number; // In Diamonds
  prizePool: number; // In Diamonds
  slots: number;
  filledSlots: number;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'FINISHED';
  roomId?: string;
  roomPassword?: string;
  winnerName?: string;
  resultImage?: string;
  targetCountry?: TargetCountry;
}

export interface Player {
  name: string;
  ffId: string;
  photo?: string; // base64
}

export interface AudiencePlayer {
  id: string;
  name: string;
  ffId: string;
  photo: string; // base64 or URL
  country?: Country;
  // teamLogo removed as per user request to simplify
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  targetCountry?: TargetCountry;
}

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  teamName?: string;
  teamLogo?: string;
  players: Player[];
  timestamp: number;
}

export interface AppSettings {
  youtubeVideoId: string;
  playVideoId: string;
  bannerImage?: string;
  bannerLink?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeChannelUrl?: string;
  // New Branding Fields
  appLogo?: string;
  appBackground?: string; // Hex or Gradient
  logoScale?: number; // Percentage 50-200
  playBannerMedia?: string | null;
  playBannerType?: 'image' | 'video' | null;
  playBannerLink?: string | null;
  hideAdsButton?: boolean;
}

export type Country = 'IN' | 'ID';
export type TargetCountry = 'IN' | 'ID' | 'BOTH';

export interface User {
  id: string;
  email: string;
  phone_number: string;
  name: string;
  password?: string;
  photo?: string;
  isAdmin: boolean;
  coins: number;
  diamonds: number; // Renamed from kohinoor to match Firestore
  dailyClicks: number;
  lastClickDate?: string;
  joinedTournaments?: string[];
  // New fields for direct join tracking
  freeFireId?: string;
  idPhoto?: string;
  joinedTournament?: boolean;
  lastJoinedTournamentId?: string;
  cancelReason?: string;
  country?: Country;
  permanent_location?: string;
  countryLocked?: boolean;
}

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
  reply?: string;
  isRead?: boolean;
  image?: string;
}

export interface RedeemCard {
  id: string;
  title?: string;
  imageUrl: string;
  amount: number;
  diamonds: number;
  targetCountry: TargetCountry;
}

export interface RedeemOrder {
  id: string;
  userId: string;
  userName: string;
  rupeesAmount: number;
  diamondCost: number;
  status: 'Pending' | 'Completed' | 'Rejected';
  redeemCode?: string;
  timestamp: number;
  country?: Country;
  countryFlag?: string;
  permanent_location?: string;
  imageUrl?: string;
}
