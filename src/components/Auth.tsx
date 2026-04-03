import React from 'react';
import { Compass, Sparkles, MapPin, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { signInWithPopup, signInWithRedirect, googleProvider, auth } from '../firebase';

export default function Auth() {
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const getFriendlyAuthError = (code?: string) => {
    switch (code) {
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized in Firebase. Add localhost (or your dev URL) to Firebase Auth > Settings > Authorized domains.';
      case 'auth/operation-not-allowed':
        return 'Google sign-in is disabled. Enable Google provider in Firebase Auth > Sign-in method.';
      case 'auth/invalid-api-key':
        return 'Firebase API key is invalid. Please verify firebase-applet-config.json values.';
      case 'auth/network-request-failed':
        return 'Network error while connecting to Google. Check your connection and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing login.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return 'Google sign-in failed. Please try again.';
    }
  };

  const handleLogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      const code = error?.code as string | undefined;

      // Popup can be blocked by browser/privacy settings. Redirect is more reliable.
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError: any) {
          console.error('Redirect Login Error:', redirectError);
          const message = getFriendlyAuthError(redirectError?.code);
          setAuthError(message);
          toast.error(message);
          return;
        }
      }

      console.error('Login Error:', error);
      const message = getFriendlyAuthError(code);
      setAuthError(message);
      toast.error(message);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex relative overflow-hidden transition-colors duration-500">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Left Side - Hero Content */}
      <div className="flex-1 flex flex-col justify-center px-20 z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">visitaSL AI</h1>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 max-w-xl"
        >
          <h2 className="text-6xl font-bold text-zinc-900 dark:text-white leading-tight">
            Discover the <span className="text-emerald-500">Pearl</span> of the Indian Ocean.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl leading-relaxed">
            Your personal AI travel companion for Sri Lanka. Plan itineraries, find routes, and explore hidden gems with real-time intelligence.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-16 grid grid-cols-2 gap-8"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-zinc-900 dark:text-white font-semibold mb-1">AI Powered</h3>
              <p className="text-zinc-500 text-sm">Smart itineraries tailored to your travel vibe.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-zinc-900 dark:text-white font-semibold mb-1">Real-time Routes</h3>
              <p className="text-zinc-500 text-sm">Live transport data and optimized travel paths.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login Card */}
      <div className="w-[500px] flex flex-col justify-center px-12 z-10 bg-zinc-50/30 dark:bg-zinc-900/30 backdrop-blur-3xl border-l border-zinc-200 dark:border-zinc-800/50">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-10 shadow-2xl space-y-8"
        >
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome Back</h3>
            <p className="text-zinc-500 text-sm">Sign in to access your saved trips and preferences</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold rounded-2xl transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              {isSigningIn ? 'Signing in...' : 'Continue with Google'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-2xl transition-all border border-zinc-200 dark:border-zinc-700">
              Continue as Guest
            </button>
          </div>

          {authError && (
            <div className="rounded-xl border border-red-300/60 bg-red-50/60 px-4 py-3 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
              {authError}
            </div>
          )}

          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-[1px] bg-zinc-800" />
            <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Secure Login</span>
            <div className="flex-1 h-[1px] bg-zinc-800" />
          </div>

          <div className="flex items-center justify-center gap-6 text-zinc-500">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>SSL Secure</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>Global Access</span>
            </div>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          By continuing, you agree to visitaSL's <br />
          <span className="text-zinc-400 hover:text-emerald-500 cursor-pointer transition-colors">Terms of Service</span> and <span className="text-zinc-400 hover:text-emerald-500 cursor-pointer transition-colors">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
