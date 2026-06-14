/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Participant, Prize } from "./types";
import RegistrationForm from "./components/RegistrationForm";
import LuckyDraw from "./components/LuckyDraw";
import Lobby from "./components/Lobby";
import { Ticket, Users, Trophy, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const defaultPrizes: Prize[] = [];

export default function App() {
  // Navigation mode state: 'register' | 'lobby' | 'draw'
  const [activeTab, setActiveTab] = useState<"register" | "lobby" | "draw">("register");

  // State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);

  // State for overall party settings
  const [systemTitle, setSystemTitle] = useState(() => localStorage.getItem("party_system_title") || "Carrier Staff Party");
  const [systemSubtitle, setSystemSubtitle] = useState(() => localStorage.getItem("party_system_subtitle") || "Thai Dance in the Dark");
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("party_logo_url") || "");

  const handleUpdateSystemTitle = (title: string) => {
    setSystemTitle(title);
    localStorage.setItem("party_system_title", title);
  };

  const handleUpdateSystemSubtitle = (subtitle: string) => {
    setSystemSubtitle(subtitle);
    localStorage.setItem("party_system_subtitle", subtitle);
  };

  const handleUpdateLogoUrl = (url: string) => {
    setLogoUrl(url);
    localStorage.setItem("party_logo_url", url);
  };

  // Load initial data from localStorage
  useEffect(() => {
    // Participants
    const storedParticipants = localStorage.getItem("party_participants");
    if (storedParticipants) {
      try {
        setParticipants(JSON.parse(storedParticipants));
      } catch (e) {
        console.error("Failed to parse participants from localStorage", e);
      }
    }

    // Prizes list config
    const storedPrizes = localStorage.getItem("party_prizes");
    if (storedPrizes) {
      try {
        const parsed = JSON.parse(storedPrizes);
        const isLegacyDefault = Array.isArray(parsed) && (
          (parsed.length === 4 && parsed[0]?.id === "p1" && parsed[0]?.name.includes("บัตรของขวัญมูลค่า 1,000 บาท")) ||
          (parsed.length === 8 && parsed[0]?.id === "p1" && parsed[0]?.name.includes("iPhone 15"))
        );
        if (isLegacyDefault) {
          setPrizes([]);
          localStorage.setItem("party_prizes", JSON.stringify([]));
        } else if (parsed && parsed.length > 0) {
          setPrizes(parsed);
        } else {
          setPrizes(defaultPrizes);
          localStorage.setItem("party_prizes", JSON.stringify(defaultPrizes));
        }
      } catch (e) {
        console.error("Failed to parse prizes", e);
        setPrizes(defaultPrizes);
      }
    } else {
      setPrizes(defaultPrizes);
      localStorage.setItem("party_prizes", JSON.stringify(defaultPrizes));
    }
  }, []);

  // Save to localStorage when participants list changes
  const saveParticipants = (newList: Participant[]) => {
    setParticipants(newList);
    localStorage.setItem("party_participants", JSON.stringify(newList));
  };

  const handleUpdatePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
    localStorage.setItem("party_prizes", JSON.stringify(newPrizes));
  };

  // Add a participant from Registration or Manual additions
  const handleRegister = (fullName: string, department: string): Participant | null => {
    // Check duplication
    const isDuplicate = participants.some(
      (p) => p.fullName.trim().toLowerCase() === fullName.trim().toLowerCase()
    );
    if (isDuplicate) {
      return null;
    }

    // Next ID
    let nextIdIndex = 1;
    if (participants.length > 0) {
      // Find maximum numerical ID
      const ids = participants
        .map((p) => {
          const num = parseInt(p.id.replace(/\D/g, ""), 10);
          return isNaN(num) ? 0 : num;
        })
        .filter((val) => val > 0);
      if (ids.length > 0) {
        nextIdIndex = Math.max(...ids) + 1;
      } else {
        nextIdIndex = participants.length + 1;
      }
    }

    const newParticipant: Participant = {
      id: String(nextIdIndex),
      fullName,
      department,
      registeredAt: new Date().toISOString(),
      isWinner: false
    };

    const updated = [...participants, newParticipant];
    saveParticipants(updated);
    return newParticipant;
  };

  // Remove single participant
  const handleRemoveParticipant = (id: string) => {
    const updated = participants.filter((p) => p.id !== id);
    saveParticipants(updated);
  };

  // Import full payload
  const handleImportParticipants = (imported: Participant[]) => {
    // Sanitize and save
    saveParticipants(imported);
  };

  // Clear all
  const handleClearAll = () => {
    saveParticipants([]);
    localStorage.removeItem("party_prizes");
    setPrizes([]);
  };

  // Trigger Win State for Participant
  const handleWinnerDrawn = (winnerId: string, prizeName: string) => {
    const updated = participants.map((p) => {
      if (p.id === winnerId) {
        return {
          ...p,
          isWinner: true,
          wonPrizeName: prizeName,
          wonAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveParticipants(updated);
  };

  // Trigger multiple Win States for Participants at the same time
  const handleWinnersDrawn = (winnersList: { winnerId: string; prizeName: string }[]) => {
    const updated = participants.map((p) => {
      const match = winnersList.find((w) => w.winnerId === p.id);
      if (match) {
        return {
          ...p,
          isWinner: true,
          wonPrizeName: match.prizeName,
          wonAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveParticipants(updated);
  };

  // Reset single winner back to drawing pool
  const handleResetWinner = (winnerId: string) => {
    const updated = participants.map((p) => {
      if (p.id === winnerId) {
        return {
          ...p,
          isWinner: false,
          wonPrizeName: undefined,
          wonAt: undefined
        };
      }
      return p;
    });
    saveParticipants(updated);
  };

  // Reset list of winners entirely
  const handleResetAllWinners = () => {
    const updated = participants.map((p) => ({
      ...p,
      isWinner: false,
      wonPrizeName: undefined,
      wonAt: undefined
    }));
    saveParticipants(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050110] text-white relative selection:bg-pink-500 selection:text-white" id="main-app-container">
      
      {/* Animated Mesh Background Effects from Frosted Glass Theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/40 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/40 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-pink-800/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Header navigation styled as Frosted Glass navbar */}
      <header className="sticky top-0 z-40 bg-white/[0.03] backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("register")}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-[120px] h-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold italic shadow-lg shadow-purple-500/20 select-none">
                {systemTitle.charAt(0) || "N"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent uppercase">
                  {systemTitle}
                </h1>
                {systemSubtitle && (
                  <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/30 px-2 py-0.5 rounded uppercase tracking-widest shrink-0">
                    {systemSubtitle}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.2em]">{systemTitle} 2026 / Lucky Draw</p>
            </div>
          </div>

          {/* Navigation Controls tabs with Frosted buttons */}
          <nav className="flex bg-white/5 border border-white/10 p-1 rounded-full w-full sm:w-auto overflow-x-auto scrollbar-none" id="app-nav-tabs">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "register"
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>ลงทะเบียนเข้างาน</span>
            </button>

            <button
              onClick={() => setActiveTab("lobby")}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "lobby"
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>แดชบอร์ดสตาฟฟ์</span>
              {participants.length > 0 && (
                <span className={`rounded-full text-[10px] px-2 py-0.2 font-mono ${activeTab === "lobby" ? "bg-black/10 text-black font-bold" : "bg-white/10 text-white"}`}>
                  {participants.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("draw")}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "draw"
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>สุ่มรางวัล (Lucky Draw)</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Core Container Views */}
      <main className="flex-1 py-8 flex flex-col justify-center items-center relative z-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full flex justify-center items-center"
          >
            {activeTab === "register" && (
              <RegistrationForm onRegister={handleRegister} />
            )}

            {activeTab === "lobby" && (
              <Lobby
                participants={participants}
                prizes={prizes}
                onAddParticipant={handleRegister}
                onRemoveParticipant={handleRemoveParticipant}
                onClearAll={handleClearAll}
                onImportParticipants={handleImportParticipants}
                onSwitchToLuckyDraw={() => setActiveTab("draw")}
                onUpdatePrizes={handleUpdatePrizes}
                onResetWinner={handleResetWinner}
                onResetAllWinners={handleResetAllWinners}
                systemTitle={systemTitle}
                onUpdateSystemTitle={handleUpdateSystemTitle}
                systemSubtitle={systemSubtitle}
                onUpdateSystemSubtitle={handleUpdateSystemSubtitle}
                logoUrl={logoUrl}
                onUpdateLogoUrl={handleUpdateLogoUrl}
              />
            )}

            {activeTab === "draw" && (
              <LuckyDraw
                participants={participants}
                prizes={prizes}
                onWinnerDrawn={handleWinnerDrawn}
                onWinnersDrawn={handleWinnersDrawn}
                onResetWinner={handleResetWinner}
                onResetAllWinners={handleResetAllWinners}
                systemTitle={systemTitle}
                systemSubtitle={systemSubtitle}
                logoUrl={logoUrl}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Aesthetic Footer Branding */}
      <footer className="py-6 border-t border-purple-500/5 text-center bg-[#070513]/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-light">
          <div>
            <span>© 2026 Party Spinner Lite. </span>
            <span className="hidden sm:inline"> | </span>
            <span>บันทึกข้อมูลแบบปลอดภัยในบราว์เซอร์ของคุณ (Local Storage)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>พร้อมขึ้นจอโปรเจกเตอร์ 4K คมชัดสูง</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
