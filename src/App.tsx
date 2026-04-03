import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signOut, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  handleFirestoreError,
  OperationType
} from './firebase';
import { UserProfile, ChatSession, ChatMessage, TripPlan, UserSettings } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import PlannerPanel from './components/PlannerPanel';
import Auth from './components/Auth';
import SettingsModal from './components/SettingsModal';
import { generateChatResponse } from './services/gemini';

const DEFAULT_SETTINGS: UserSettings = {
  language: 'English',
  budget: 'Medium Budget',
  transport: 'Car',
  notifications: {
    tripReminders: true,
    weatherAlerts: true,
    travelTips: true
  },
  locationEnabled: false,
  responseStyle: 'Friendly'
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        // Sync user profile
        const userRef = doc(db, 'users', u.uid);
        setDoc(userRef, {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          lastSeen: new Date().toISOString()
        }, { merge: true });

        // Load settings
        const settingsRef = doc(db, 'users', u.uid, 'config', 'settings');
        onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
            setSettings(docSnap.data() as UserSettings);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}/config/settings`);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Theme Handling (Force Dark Mode)
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    if (user) {
      try {
        const settingsRef = doc(db, 'users', user.uid, 'config', 'settings');
        await setDoc(settingsRef, newSettings);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/config/settings`);
      }
    }
  };

  // Fetch Sessions
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'sessions'),
      orderBy('lastMessageAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sess = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
      setSessions(sess);
      if (sess.length > 0 && !activeSessionId) {
        setActiveSessionId(sess[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sessions`);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Messages
  useEffect(() => {
    if (!user || !activeSessionId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'sessions', activeSessionId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sessions/${activeSessionId}/messages`);
    });
    return () => unsubscribe();
  }, [user, activeSessionId]);

  // Fetch Trips
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'trips'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrips(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TripPlan)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/trips`);
    });
    return () => unsubscribe();
  }, [user]);

  const handleNewChat = async () => {
    if (!user) return;
    try {
      const sessionRef = await addDoc(collection(db, 'users', user.uid, 'sessions'), {
        uid: user.uid,
        title: 'New Trip Planning',
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString()
      });
      setActiveSessionId(sessionRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/sessions`);
    }
  };

  const handleSendMessage = async (content: string, isTripPlanningRequest = false) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let currentSessionId = activeSessionId;
      
      // 1. Create session if it doesn't exist
      if (!currentSessionId) {
        const sessionRef = await addDoc(collection(db, 'users', user.uid, 'sessions'), {
          uid: user.uid,
          title: content.slice(0, 40) + '...',
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString()
        });
        currentSessionId = sessionRef.id;
        setActiveSessionId(currentSessionId);
      }

      // 2. Get Location if enabled
      let locationContext = '';
      if (settings.locationEnabled) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          locationContext = `\nUSER CURRENT LOCATION: Lat ${position.coords.latitude}, Lng ${position.coords.longitude}`;
        } catch (e) {
          console.warn("Location access denied or failed.");
        }
      }

      // 3. Save User Message
      const userMsg: ChatMessage = {
        sessionId: currentSessionId,
        role: 'user',
        content: content + locationContext,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'users', user.uid, 'sessions', currentSessionId, 'messages'), userMsg);

      // 4. Update Session Title if it's the first message
      if (messages.length === 0) {
        const sessionRef = doc(db, 'users', user.uid, 'sessions', currentSessionId);
        await setDoc(sessionRef, { title: content.slice(0, 40) + '...' }, { merge: true });
      }

      // 5. Get AI Response
      const chatHistory = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const response = await generateChatResponse(chatHistory, settings);
      const aiContent = response.text || "I'm sorry, I couldn't generate a response.";

      // 6. Save AI Message
      const aiMsg: ChatMessage = {
        sessionId: currentSessionId,
        role: 'assistant',
        content: aiContent,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'users', user.uid, 'sessions', currentSessionId, 'messages'), aiMsg);

      // 7. Update Session Last Message
      const sessionRef = doc(db, 'users', user.uid, 'sessions', currentSessionId);
      await setDoc(sessionRef, { lastMessageAt: new Date().toISOString() }, { merge: true });

      // 8. Check if AI generated a trip plan (ONLY if explicitly requested)
      const isTripPlan = aiContent.includes('"type": "trip_plan"') || 
                         (aiContent.toLowerCase().includes('itinerary') && aiContent.toLowerCase().includes('day 1'));
      
      if (isTripPlanningRequest && isTripPlan) {
        saveTripFromAI(aiContent);
      }

    } catch (error: any) {
      console.error("Chat Error:", error);
      let displayMessage = "Failed to get AI response. Please try again.";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) displayMessage = `AI Error: ${parsed.error}`;
      } catch {
        displayMessage = error.message || displayMessage;
      }
      toast.error(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTripFromAI = async (content: string) => {
    if (!user) return;
    
    try {
      // 1. Try to find a JSON block in the content
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*?"type":\s*"trip_plan"[\s\S]*?\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0].startsWith('```') ? jsonMatch[1] : jsonMatch[0];
        const data = JSON.parse(jsonStr);
        if (data.type === 'trip_plan') {
          const newTrip: Partial<TripPlan> = {
            uid: user.uid,
            location: data.location || 'Sri Lanka',
            days: Number(data.days) || 3,
            itinerary: data.itinerary || [],
            budget: {
              total: Number(data.budget?.total) || 150000,
              breakdown: {
                hotels: Number(data.budget?.breakdown?.hotels) || 80000,
                transport: Number(data.budget?.breakdown?.transport) || 40000,
                food: Number(data.budget?.breakdown?.food) || 30000
              }
            },
            createdAt: new Date().toISOString()
          };
          try {
            await addDoc(collection(db, 'users', user.uid, 'trips'), newTrip);
            toast.success(`Saved trip to ${newTrip.location}!`);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/trips`);
          }
          return;
        }
      }

      // 2. Fallback to simple parser if no JSON found but looks like a trip
      if (content.toLowerCase().includes('day 1') || content.toLowerCase().includes('itinerary')) {
        const locationMatch = content.match(/to ([\w\s]+)/i) || content.match(/Trip to ([\w\s]+)/i);
        const location = locationMatch ? locationMatch[1].trim() : 'Sri Lanka';
        
        // Try to estimate days
        const dayMatches = content.match(/Day \d+/gi);
        const days = dayMatches ? Math.max(...dayMatches.map(m => parseInt(m.match(/\d+/)![0]))) : 3;

        const newTrip: Partial<TripPlan> = {
          uid: user.uid,
          location,
          days: Number(days) || 3,
          itinerary: Array.from({ length: Number(days) || 3 }, (_, i) => ({ title: `Day ${i + 1}: Exploration`, activities: [] })),
          budget: {
            total: 150000,
            breakdown: { hotels: 80000, transport: 40000, food: 30000 }
          },
          createdAt: new Date().toISOString()
        };

        try {
          await addDoc(collection(db, 'users', user.uid, 'trips'), newTrip);
          toast.success(`Saved trip to ${location}!`);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/trips`);
        }
      }
    } catch (error) {
      console.error("Save Trip Error:", error);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'trips', id));
      toast.success("Trip deleted successfully.");
    } catch (error) {
      console.error("Delete Trip Error:", error);
      toast.error("Failed to delete trip.");
    }
  };

  const handleSelectTrip = (trip: TripPlan) => {
    const content = `I'd like to view and discuss my trip to ${trip.location}. It's a ${trip.days}-day trip with a budget of LKR ${trip.budget.total}.`;
    handleSendMessage(content);
    toast.info(`Loading trip to ${trip.location}...`);
  };

  const handleOptimizeCosts = () => {
    if (trips.length === 0) {
      toast.error("No trips to optimize!");
      return;
    }
    const latestTrip = trips[0];
    const content = `Can you help me optimize the costs for my trip to ${latestTrip.location}? The current budget is LKR ${latestTrip.budget.total}. I'm looking for ways to save money while keeping it a great experience.`;
    handleSendMessage(content);
  };

  const handleVibeClick = (vibe: string) => {
    const content = `I'm looking for some travel inspiration. Can you recommend some places in Sri Lanka for a "${vibe}" vibe?`;
    handleSendMessage(content);
  };

  const handleDeleteSession = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'sessions', id));
      if (activeSessionId === id) {
        const remainingSessions = sessions.filter(s => s.id !== id);
        if (remainingSessions.length > 0) {
          setActiveSessionId(remainingSessions[0].id);
        } else {
          setActiveSessionId(null);
        }
      }
      toast.success("Chat deleted successfully.");
    } catch (error) {
      console.error("Delete Session Error:", error);
      toast.error("Failed to delete chat.");
    }
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleCreateTrip = (destinations: any[], numPeople: number) => {
    const totalDays = destinations.reduce((acc, d) => acc + Number(d.days), 0);
    const totalCost = destinations.reduce((acc, d) => acc + Number(d.cost), 0);
    const placesList = destinations.map(d => `${d.name} (${d.days} days, LKR ${d.cost})`).join(', ');
    
    const content = `I want to plan a custom trip for ${numPeople} people to the following places in Sri Lanka: ${placesList}. 

Details:
- Total duration: ${totalDays} days. 
- Total estimated budget: LKR ${totalCost}. 
- Number of travelers: ${numPeople}.

Please provide:
1. A detailed day-by-day itinerary for all ${totalDays} days.
2. Specific hotel and restaurant recommendations for each destination, suitable for ${numPeople} people.
3. Transport options between these places (e.g. ${numPeople > 4 ? 'Van' : 'Car/Tuk-tuk'}).
4. A final budget breakdown in LKR.

IMPORTANT: You MUST include the structured JSON block at the very end of your response so the system can save this trip. The JSON must follow the "trip_plan" schema defined in your instructions.`;
    
    handleSendMessage(content, true);
    toast.success(`Generating trip plan for ${numPeople} people...`);
  };

  if (!isAuthReady) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <Auth />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 overflow-hidden transition-colors duration-500">
      <Toaster position="top-center" richColors />
      
      <Sidebar 
        user={user}
        sessions={sessions}
        activeSessionId={activeSessionId}
        settings={settings}
        onNewChat={handleNewChat}
        onSelectSession={setActiveSessionId}
        onDeleteSession={handleDeleteSession}
        onSignOut={() => signOut(auth)}
        onVibeClick={handleVibeClick}
        onSettingsClick={handleSettingsClick}
        onUpdateSettings={handleUpdateSettings}
      />

      <ChatInterface 
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <PlannerPanel 
        trips={trips}
        onDeleteTrip={handleDeleteTrip}
        onSelectTrip={handleSelectTrip}
        onOptimizeCosts={handleOptimizeCosts}
        onCreateTrip={handleCreateTrip}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdate={handleUpdateSettings}
      />
    </div>
  );
}
