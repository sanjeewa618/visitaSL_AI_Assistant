export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences?: {
    vibe?: string;
    budget?: string;
  };
  createdAt: string;
}

export interface ChatSession {
  id: string;
  uid: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id?: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    type?: 'itinerary' | 'route' | 'places' | 'hotels';
    data?: any;
  };
  createdAt: string;
}

export interface UserSettings {
  language: 'English' | 'Sinhala' | 'Tamil';
  budget: 'Low Budget' | 'Medium Budget' | 'Luxury';
  transport: 'Bus' | 'Train' | 'Car' | 'Bike';
  notifications: {
    tripReminders: boolean;
    weatherAlerts: boolean;
    travelTips: boolean;
  };
  locationEnabled: boolean;
  responseStyle: 'Short' | 'Detailed' | 'Friendly' | 'Professional';
}

export interface TripPlan {
  id: string;
  uid: string;
  location: string;
  days: number;
  itinerary: any[];
  budget: {
    total: number;
    breakdown: {
      hotels: number;
      transport: number;
      food: number;
    };
  };
  createdAt: string;
}
