/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect, useRef } from "react";
import { Participant, Prize } from "../types";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Trophy,
  RefreshCw,
  Trash2,
  ListRestart,
  Music,
  Volume2,
  VolumeX,
  Plus,
  Compass,
  ArrowRight,
  Users,
  Award,
  Maximize2,
  Minimize2
} from "lucide-react";

interface LuckyDrawProps {
  participants: Participant[];
  prizes: Prize[];
  onWinnerDrawn: (winnerId: string, prizeName: string) => void;
  onWinnersDrawn: (winnersList: { winnerId: string; prizeName: string }[]) => void;
  onResetWinner: (winnerId: string) => void;
  onResetAllWinners: () => void;
  systemTitle: string;
  systemSubtitle: string;
  logoUrl: string;
}

export default function LuckyDraw({
  participants,
  prizes = [],
  onWinnerDrawn,
  onWinnersDrawn,
  onResetWinner,
  onResetAllWinners,
  systemTitle,
  systemSubtitle,
  logoUrl
}: LuckyDrawProps) {
  const [currentPrizeName, setCurrentPrizeName] = useState("รางวัลพิเศษ (Lucky Draw)");
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinIndex, setSpinIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [spinCount, setSpinCount] = useState<number>(1);
  const [multiWinners, setMultiWinners] = useState<Participant[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Full Screen States & Refs
  const [isFullscreenDraw, setIsFullscreenDraw] = useState(false);
  const [isFullscreenWinners, setIsFullscreenWinners] = useState(false);
  const drawContainerRef = useRef<HTMLDivElement>(null);
  const winnersContainerRef = useRef<HTMLDivElement>(null);

  // Sync real browser full-screen transitions
  useEffect(() => {
    const onFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      if (!isCurrentlyFullscreen) {
        setIsFullscreenDraw(false);
        setIsFullscreenWinners(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Listen to Escape key as fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreenDraw) {
          setIsFullscreenDraw(false);
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }
        if (isFullscreenWinners) {
          setIsFullscreenWinners(false);
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreenDraw, isFullscreenWinners]);

  const toggleFullscreenDraw = () => {
    if (!isFullscreenDraw) {
      setIsFullscreenDraw(true);
      if (drawContainerRef.current) {
        drawContainerRef.current.requestFullscreen().catch((err) => {
          console.warn("Browser Fullscreen failed, falling back to clean virtual fullscreen:", err);
        });
      }
    } else {
      setIsFullscreenDraw(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const toggleFullscreenWinners = () => {
    if (!isFullscreenWinners) {
      setIsFullscreenWinners(true);
      if (winnersContainerRef.current) {
        winnersContainerRef.current.requestFullscreen().catch((err) => {
          console.warn("Browser Fullscreen failed, falling back to clean virtual fullscreen:", err);
        });
      }
    } else {
      setIsFullscreenWinners(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Synchronize current prize selection with dynamic prizes prop
  useEffect(() => {
    if (prizes && prizes.length > 0) {
      const exists = prizes.some((p) => p.name === currentPrizeName);
      if (!exists) {
        setCurrentPrizeName(prizes[0].name);
      }
    }
  }, [prizes, currentPrizeName]);

  const prevPrizeNameRef = useRef<string>(currentPrizeName);

  // Reset states when current prize tier changes
  useEffect(() => {
    if (prevPrizeNameRef.current !== currentPrizeName) {
      setWinner(null);
      setMultiWinners([]);
      prevPrizeNameRef.current = currentPrizeName;
      
      const activePrize = prizes.find((p) => p.name === currentPrizeName);
      if (activePrize) {
        const drawnCountForCurrentPrize = participants.filter(
          (p) => p.isWinner && p.wonPrizeName === currentPrizeName
        ).length;
        const rem = Math.max(0, activePrize.amount - drawnCountForCurrentPrize);
        setSpinCount(rem > 0 ? rem : 1);
      } else {
        setSpinCount(1);
      }
    }
  }, [currentPrizeName, prizes, participants]);

  const [digitPads, setDigitPads] = useState<string[]>(["0", "0", "0", "0"]);

  // Staggered or concurrent scrambling behavior for the digit boards
  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        setDigitPads([
          Math.floor(Math.random() * 10).toString(),
          Math.floor(Math.random() * 10).toString(),
          Math.floor(Math.random() * 10).toString(),
          Math.floor(Math.random() * 10).toString()
        ]);
      }, 50);
      return () => clearInterval(interval);
    } else {
      if (winner) {
        // Extract sequence digits from ID and pad to 4 spaces
        const idStr = String(winner.id).trim();
        setDigitPads(idStr.padStart(4, "0").split(""));
      } else {
        setDigitPads(["0", "0", "0", "0"]);
      }
    }
  }, [isSpinning, winner]);

  const spinIntervalRef = useRef<number | null>(null);

  // Filter available participants (not winners yet)
  const availablePool = participants.filter((p) => !p.isWinner);

  // Find active prize config to determine total amount and remaining count
  const activePrize = prizes.find((p) => p.name === currentPrizeName);
  const drawnCountForCurrentPrize = activePrize
    ? participants.filter((p) => p.isWinner && p.wonPrizeName === currentPrizeName).length
    : 0;
  const remainingCount = activePrize ? Math.max(0, activePrize.amount - drawnCountForCurrentPrize) : 0;

  // Sound effects
  const playBeep = (freq = 600, duration = 0.08) => {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.type = "sine";
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  const playFanfare = () => {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const playNote = (pitch: number, start: number, duration: number, vol = 0.12) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(pitch, start);
        gainNode.gain.setValueAtTime(vol, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      // Joyous C Major arpeggio
      playNote(261.63, now, 0.25); // C4
      playNote(329.63, now + 0.10, 0.25); // E4
      playNote(392.00, now + 0.20, 0.25); // G4
      playNote(523.25, now + 0.30, 0.5);  // C5
      playNote(659.25, now + 0.38, 0.6, 0.08);  // E5
      playNote(783.99, now + 0.46, 0.8, 0.06);  // G5
    } catch (e) {}
  };

  // Launch confetti explosion
  const triggerConfetti = () => {
    const duration = 4.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleSpin = () => {
    if (isSpinning) return;
    if (availablePool.length === 0) {
      alert("ไม่มีรายชื่อผู้เข้างานปาร์ตี้ หรือทุกคนได้รับรางวัลไปหมดแล้ว!");
      return;
    }

    // Look up current active prize config to enforce limit
    const activePrize = prizes.find((p) => p.name === currentPrizeName);
    if (activePrize) {
      const drawnCountForCurrentPrize = participants.filter(
        (p) => p.isWinner && p.wonPrizeName === currentPrizeName
      ).length;
      const remainingCount = activePrize.amount - drawnCountForCurrentPrize;

      if (remainingCount <= 0) {
        alert(`❌ ของรางวัลนี้จับครบตามจำนวนแล้ว!\n\nรางวัล "${currentPrizeName}" ถูกจับครบหมดแล้ว (${activePrize.amount}/${activePrize.amount} ชิ้น) ไม่สามารถจับเพิ่มได้อีก!\n\nหากต้องการสุ่มเพิ่ม กรุณาเพิ่มจำนวนชิ้นของรางวัลนี้ในแดชบอร์ดสตาฟฟ์`);
        return;
      }

      if (spinCount > remainingCount) {
        alert(`❌ ของรางวัลคงเหลือไม่พอสำหรับสุ่ม ${spinCount} คน!\n\nรางวัล "${currentPrizeName}" เหลือโควตาว่างสำหรับสุ่มเพียง ${remainingCount} ชิ้นเท่านั้น ไม่สามารถเลือกสุ่ม ${spinCount} คนได้\n\n(กรุณาลองสุ่มจำนวนที่น้อยลง หรือสุ่มทีละ 1 คน)`);
        return;
      }
    }

    setIsSpinning(true);
    setWinner(null);
    setMultiWinners([]);

    let currentSpeed = 40; // Starts fast
    const minSpeed = 500; // Slows down to this speed
    const slowdownFactor = 1.25; // Deceleration rate
    let currentIndex = 0;

    const tick = () => {
      // Pick next index
      currentIndex = Math.floor(Math.random() * availablePool.length);
      setSpinIndex(currentIndex);
      playBeep(400 + (currentIndex % 10) * 80, currentSpeed / 1000);

      // Decelerate
      if (currentSpeed < minSpeed) {
        currentSpeed = currentSpeed * slowdownFactor;
        spinIntervalRef.current = window.setTimeout(tick, currentSpeed);
      } else {
        // Stop & announce winner
        setTimeout(() => {
          setIsSpinning(false);
          setSpinIndex(null);

          if (spinCount === 1) {
            const rawWinner = availablePool[currentIndex];
            setWinner(rawWinner);
            onWinnerDrawn(rawWinner.id, currentPrizeName);
          } else {
            // Draw Math.min(spinCount, availablePool.length) random unique winners
            const winnersToDrawIndex = Math.min(spinCount, availablePool.length);
            const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
            const selectedWinners = shuffled.slice(0, winnersToDrawIndex);
            
            setMultiWinners(selectedWinners);
            onWinnersDrawn(selectedWinners.map(w => ({ winnerId: w.id, prizeName: currentPrizeName })));
          }

          playFanfare();
          triggerConfetti();
        }, 150);
      }
    };

    spinIntervalRef.current = window.setTimeout(tick, currentSpeed);
  };

  const winners = participants.filter((p) => p.isWinner);

  // Clear running timeout on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearTimeout(spinIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4 py-4" id="lucky-draw-grid">
      {/* Drawer Panel left: Prizes & Statistics */}
      <div className="lg:col-span-1 glass-panel rounded-3xl p-5 shadow-2xl space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-none">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>เลือกรอบรางวัล</span>
          </h3>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-none">
            {prizes.length === 0 ? (
              <div className="text-xs text-white/40 text-center py-4 font-light">
                ไม่มีของรางวัลในระบบขณะนี้ กรุณากรอกเพิ่มในดีชบอร์ดสตาฟฟ์!
              </div>
            ) : (
              prizes.map((prize) => {
                const prizeDrawnCount = participants.filter(
                  (p) => p.isWinner && p.wonPrizeName === prize.name
                ).length;
                const isFullyDrawn = prizeDrawnCount >= prize.amount;
                return (
                  <button
                    key={prize.id}
                    onClick={() => setCurrentPrizeName(prize.name)}
                    className={`w-full text-left px-3.5 py-2.5 text-sm rounded-xl border transition-all flex justify-between items-center cursor-pointer ${
                      currentPrizeName === prize.name
                        ? "bg-white text-black border-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                        : "bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span className="truncate mr-2">{prize.name}</span>
                    {isFullyDrawn ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentPrizeName === prize.name
                          ? "bg-red-500 text-white"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      } font-mono shrink-0`}>
                        หมดแล้ว ({prizeDrawnCount}/{prize.amount})
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        currentPrizeName === prize.name
                          ? "bg-black/10 text-black"
                          : "bg-white/10 text-white/80"
                      } font-mono shrink-0`}>
                        {prizeDrawnCount}/{prize.amount} ชิ้น
                      </span>
                    )}
                    {currentPrizeName === prize.name && !isFullyDrawn && (
                      <span className="w-2 h-2 ml-1.5 bg-pink-500 rounded-full animate-ping shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic pool details */}
        <div className="border-t border-white/10 pt-4 space-y-3.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60 font-light flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              ผู้มีสิทธิ์สุ่มทั้งหมด:
            </span>
            <span className="font-mono text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {availablePool.length} คน
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60 font-light flex items-center gap-1.5">
              <Award className="w-4 h-4 text-yellow-400" />
              ได้รับรางวัลแล้ว:
            </span>
            <span className="font-mono text-yellow-300 font-bold bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              {winners.length} คน
            </span>
          </div>

          {/* Sound options and global reset */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-white/60 font-light">เปิดเสียงเอฟเฟกต์</span>
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isSoundEnabled
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/5 text-white/30"
              }`}
              title={isSoundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main lucky wheel block (Full Center Stage) */}
      <div className="lg:col-span-3 flex flex-col justify-between items-center space-y-6">
        <div
          ref={drawContainerRef}
          className={`${
            isFullscreenDraw
              ? "fixed inset-0 z-50 overflow-y-auto flex flex-col bg-[#050110] p-6 md:p-12 text-center"
              : "w-full glass-panel rounded-[32px] p-8 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[460px]"
          }`}
        >
          
          {/* Corner Graphic Accents from Frosted Glass Theme */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-purple-500/70 rounded-tl-[32px]"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-pink-500/70 rounded-br-[32px]"></div>

          {/* Top-right corner controls */}
          <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreenDraw}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/70 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-lg"
              title={isFullscreenDraw ? "ย่อหน้าจอ (Exit Fullscreen)" : "เต็มหน้าจอภาพสุ่ม (Fullscreen)"}
            >
              {isFullscreenDraw ? <Minimize2 className="w-5 h-5 text-pink-400" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Animated decorative sparks inside the box */}
          <div className="absolute top-4 left-4 text-pink-500/20 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="absolute bottom-4 right-4 text-yellow-500/10 animate-bounce">
            <Sparkles className="w-12 h-12" />
          </div>

          {/* Inner scrolling and spacing safe flex wrapper */}
          <div className={`w-full max-w-5xl mx-auto my-auto flex flex-col items-center justify-center relative z-10 ${isFullscreenDraw ? "py-4 space-y-6 md:space-y-8" : "space-y-6"}`}>
            
            {/* Dynamic System Brand/Logo Header on screen */}
            <div className="flex flex-col items-center justify-center gap-3 select-none">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="System Logo"
                  className="w-[120px] h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold italic shadow-2xl shadow-purple-500/30 border border-white/10 transition-all ${
                  isFullscreenDraw ? "w-20 h-20 text-3xl" : "w-14 h-14 text-xl"
                }`}>
                  {systemTitle.charAt(0) || "N"}
                </div>
              )}
              <div className="text-center">
                <h2 className={`font-black tracking-tight leading-tight bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent uppercase ${
                  isFullscreenDraw ? "text-2xl md:text-4xl lg:text-5xl" : "text-xl md:text-2xl"
                }`}>
                  {systemTitle}
                </h2>
                {systemSubtitle && (
                  <p className={`text-pink-400 font-bold uppercase tracking-widest mt-0.5 leading-normal ${
                    isFullscreenDraw ? "text-sm md:text-base" : "text-[10px]"
                  }`}>
                    {systemSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-x-3 gap-y-2 justify-center">
              <span className="px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center gap-1.5 justify-center">
                🏆 กำลังจับรางวัลรอบ: {currentPrizeName}
              </span>
              <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5 gap-1 shadow-inner flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpinning) return;
                    setSpinCount(1);
                    setWinner(null);
                    setMultiWinners([]);
                  }}
                  disabled={isSpinning}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    spinCount === 1
                      ? "bg-white text-black shadow-md font-bold"
                      : "text-white/60 hover:text-white disabled:opacity-50"
                  }`}
                >
                  สุ่มทีละ 1 คน
                </button>
                {remainingCount > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpinning) return;
                      setSpinCount(remainingCount);
                      setWinner(null);
                      setMultiWinners([]);
                    }}
                    disabled={isSpinning}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      spinCount === remainingCount
                        ? "bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-md font-bold"
                        : "text-white/60 hover:text-white disabled:opacity-50"
                    }`}
                  >
                    ⚡ สุ่มทั้งหมดที่เหลือ ({remainingCount} คน)
                  </button>
                )}
                {remainingCount >= 10 && remainingCount !== 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpinning) return;
                      setSpinCount(10);
                      setWinner(null);
                      setMultiWinners([]);
                    }}
                    disabled={isSpinning}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      spinCount === 10
                        ? "bg-[#0ea5e9] text-white shadow-md font-bold"
                        : "text-white/60 hover:text-white disabled:opacity-50"
                    }`}
                  >
                    ⚡ สุ่มทีเดียว 10 คน
                  </button>
                )}
              </div>
            </div>

            {/* Core Spinner Board */}
            <div className="w-full max-w-5xl flex flex-col items-center justify-center relative min-h-[160px]">
              <AnimatePresence mode="popLayout">
                {/* Spinning State */}
                {isSpinning && (
                  <motion.div
                    key="spinning-number"
                    initial={{ opacity: 0, scale: 0.82, filter: "blur(8px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.15, filter: "blur(4px)" }}
                    transition={{ duration: 0.1 }}
                    className="space-y-4 md:space-y-6 text-center flex flex-col items-center w-full"
                  >
                    <div className="font-mono text-[#FF2E93] font-bold text-sm sm:text-base md:text-lg uppercase tracking-[0.25em] animate-pulse">
                      ⚡ RUNNING NUMBER / กำลังสุ่มตัวเลขทุกหลักพร้อมกัน...
                    </div>
                    <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 justify-center items-center my-2 select-none flex-wrap">
                      {digitPads.map((digit, index) => (
                        <div
                          key={index}
                          className={`bg-[#A855F7] text-black flex items-center justify-center font-black font-mono shadow-[0_0_40px_rgba(168,85,247,0.45)] border-[3px] border-purple-200 leading-none relative overflow-hidden animate-bounce rounded-2xl md:rounded-[2rem] ${
                            isFullscreenDraw
                              ? "text-6xl sm:text-7xl md:text-8xl lg:text-9xl w-20 h-28 sm:w-24 sm:h-34 md:w-28 md:h-40 lg:w-36 lg:h-52"
                              : "text-4xl sm:text-5xl md:text-6xl w-14 h-20 sm:w-18 sm:h-26 md:w-22 md:h-30"
                          }`}
                          style={{
                            animationDuration: `${0.12 + index * 0.04}s`,
                          }}
                        >
                          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/40 pointer-events-none" />
                          <span className="relative z-10">{digit}</span>
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                        </div>
                      ))}
                    </div>
                    <div className="text-white/40 font-mono text-xs uppercase tracking-widest">
                      HOLDING BREATH / กรุณารอลุ้นหมายเลข...
                    </div>
                  </motion.div>
                )}

                {/* No Winner yet and not spinning state */}
                {!isSpinning && !winner && multiWinners.length === 0 && (
                  <motion.div
                    key="idle-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 md:space-y-6 text-center flex flex-col items-center w-full"
                  >
                    <div className="font-mono text-purple-400 font-semibold text-sm sm:text-base md:text-lg uppercase tracking-widest animate-pulse">
                      READY TO SPIN / ลำดับผู้ลงทะเบียนพร้อมสุ่ม...
                    </div>
                    
                    {/* Purple/Black digit boxes before starting to spin */}
                    <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 justify-center items-center my-2 select-none flex-wrap">
                      {digitPads.map((digit, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.08, type: "spring" }}
                          className={`bg-[#A855F7] text-black flex items-center justify-center font-black font-mono shadow-[0_0_40px_rgba(168,85,247,0.4)] border-[3px] border-purple-300 leading-none relative overflow-hidden rounded-2xl md:rounded-[2rem] ${
                            isFullscreenDraw
                              ? "text-6xl sm:text-7xl md:text-8xl lg:text-9xl w-20 h-28 sm:w-24 sm:h-34 md:w-28 md:h-40 lg:w-36 lg:h-52"
                              : "text-4xl sm:text-5xl md:text-6xl w-14 h-20 sm:w-18 sm:h-26 md:w-22 md:h-30"
                          }`}
                        >
                          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/30 pointer-events-none" />
                          <span className="relative z-10">{digit}</span>
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-center">
                      <p className="text-white/60 font-light max-w-md text-sm sm:text-base leading-relaxed">
                        มีรายชื่อสำรองในระบบทั้งหมด <span className="text-pink-400 font-bold">{availablePool.length} คน</span> ที่พร้อมรับโชคชิ้นนี้!
                      </p>
                      <p className="text-pink-400/80 text-xs font-semibold tracking-widest mt-2 flex items-center justify-center gap-1.5 uppercase">
                        <Compass className="w-4 h-4 animate-spin text-pink-500" />
                        กดปุ่ม SPIN ดำเนินการสุ่มทันที
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Winner Announced Showcase (Bold text, projector styled) */}
                {!isSpinning && winner && (
                  <motion.div
                    key="winner-showcase"
                    initial={{ scale: 0.6, y: 50, opacity: 0 }}
                    animate={{
                      scale: [1.2, 1],
                      y: 0,
                      opacity: 1
                    }}
                    transition={{
                      type: "spring",
                      damping: 12,
                      stiffness: 110
                    }}
                    className="text-center relative z-10 p-2 flex flex-col items-center w-full"
                  >
                    <div className="text-amber-400 font-bold text-sm sm:text-base uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-4 py-1 rounded-full inline-flex items-center gap-1.5 mb-3 glow-text-yellow select-none">
                      🎉 <Sparkles className="w-4 h-4" /> THE LUCKY WINNER IS <Sparkles className="w-4 h-4" /> 🎉
                    </div>

                    {/* Winner sequence ID shown in purple backdrop cards */}
                    <div className="flex gap-2 sm:gap-3 justify-center items-center mb-4 select-none flex-wrap">
                      {digitPads.map((digit, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0.5, rotateY: 180 }}
                          animate={{ scale: 1, rotateY: 0 }}
                          transition={{ delay: index * 0.1, type: "spring", stiffness: 150 }}
                          className={`bg-[#A855F7] text-black flex items-center justify-center font-black font-mono shadow-[0_0_40px_rgba(168,85,247,0.45)] border-[2.5px] border-purple-200 leading-none relative overflow-hidden rounded-xl md:rounded-[1.5rem] ${
                            isFullscreenDraw
                              ? "text-5xl sm:text-6xl md:text-7xl w-16 h-22 sm:w-20 sm:h-28 md:w-24 md:h-34"
                              : "text-3xl sm:text-4xl md:text-5xl w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24"
                          }`}
                        >
                          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white/40 pointer-events-none" />
                          <span className="relative z-10">{digit}</span>
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Gigantic Title - Projector optimized (4K clean style) */}
                    <div className={`font-extrabold bg-gradient-to-b from-yellow-101 via-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-wide glow-text-yellow py-2 px-4 uppercase break-words max-w-full text-center ${
                      isFullscreenDraw
                        ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight"
                        : "text-3xl sm:text-4xl md:text-5xl leading-snug"
                    }`}>
                      {winner.fullName}
                    </div>

                    <div className={`font-semibold text-white mt-1.5 flex items-center justify-center gap-2 flex-wrap ${
                      isFullscreenDraw ? "text-lg sm:text-xl md:text-2xl" : "text-sm sm:text-base"
                    }`}>
                      <span className="text-white/40 font-light">ฝ่าย / หน่วยงาน:</span>
                      <span className="text-emerald-400">{winner.department}</span>
                    </div>

                    <div className={`font-mono text-purple-300 mt-2.5 bg-[#050110]/95 px-4 py-1.5 rounded-xl inline-block border border-white/10 uppercase tracking-wider ${
                      isFullscreenDraw ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"
                    }`}>
                      ID: #{String(winner.id).padStart(4, "0")} | รางวัล: {winner.wonPrizeName}
                    </div>
                  </motion.div>
                )}

                {/* Multi Winners Showcase (10-Winner gorgeous grid) */}
                {!isSpinning && multiWinners.length > 0 && (
                  <motion.div
                    key="multi-winner-showcase"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full text-center p-2"
                  >
                    <div className="text-amber-400 font-bold text-sm sm:text-base uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-6 py-2 rounded-full inline-flex items-center gap-1.5 mb-4 glow-text-yellow select-none">
                      🎉 <Sparkles className="w-4 h-4" /> เก่งมาก! ผู้โชคดีได้รับรางวัลรอบนี้ทั้งสิ้น {multiWinners.length} ท่าน <Sparkles className="w-4 h-4" /> 🎉
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
                      {multiWinners.map((w, index) => (
                        <motion.div
                          key={w.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, type: "spring", stiffness: 120 }}
                          className="glass-panel rounded-2xl p-4 border border-yellow-500/20 bg-[#ffffff]/5 text-center shadow-lg relative overflow-hidden flex flex-col justify-between"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-amber-400 to-pink-500 animate-pulse" />
                          <div>
                            <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-yellow-300 font-mono">
                              {index + 1}
                            </span>
                            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2 animate-bounce mt-2" />
                            <div className="text-sm font-bold text-white truncate px-1" title={w.fullName}>
                              {w.fullName}
                            </div>
                            <div className="text-[11px] text-white/55 truncate mt-0.5" title={w.department}>
                              {w.department}
                            </div>
                          </div>
                          <div className="text-[9px] font-mono text-purple-300 mt-2.5 bg-black/30 py-0.5 rounded border border-white/5 uppercase">
                            ID: #{String(w.id).padStart(4, "0")}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trigger button */}
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-md justify-center">
              <motion.button
                whileHover={{ scale: isSpinning ? 1 : 1.05, boxShadow: "0 0 30px rgba(168,85,247,0.5)" }}
                whileTap={{ scale: isSpinning ? 1 : 0.95 }}
                onClick={handleSpin}
                disabled={isSpinning || availablePool.length === 0}
                className={`w-full sm:w-64 font-extrabold uppercase py-4 sm:py-5 px-8 rounded-2xl shadow-2xl tracking-widest text-lg flex items-center justify-center gap-3 transition-all cursor-pointer border-t border-white/25 select-none ${
                  isSpinning
                    ? "bg-white/10 text-white/30 cursor-not-allowed border-none"
                    : availablePool.length === 0
                    ? "from-white/5 to-white/10 text-white/20 border-none cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-650 hover:to-pink-650 text-white"
                }`}
                id="btn-spin"
              >
                <RefreshCw className={`w-6 h-6 ${isSpinning ? "animate-spin" : ""}`} />
                {isSpinning ? "SPINNING..." : spinCount === 1 ? "SPIN FOR WIN" : `SPIN ${spinCount} WINNERS!`}
              </motion.button>

              {(winner || multiWinners.length > 0) && !isSpinning && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setWinner(null);
                    setMultiWinners([]);
                  }}
                  className="w-full sm:w-auto px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 text-base shadow-lg"
                  id="btn-next-spin"
                >
                  <span>ล้างจอ / สุ่มใหม่</span>
                  <ArrowRight className="w-5 h-5 text-pink-400" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Panel: Winner Table for Verification */}
        <div
          ref={winnersContainerRef}
          className={`${
            isFullscreenWinners
              ? "fixed inset-0 z-50 overflow-y-auto flex flex-col bg-[#050110] p-8 md:p-16"
              : "w-full glass-panel rounded-3xl p-6 shadow-2xl"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 mb-4 gap-4 relative">
            <div>
              <h4 className={`${isFullscreenWinners ? "text-2xl md:text-3xl font-black" : "text-lg font-bold"} text-white flex items-center gap-2 uppercase tracking-wider`}>
                <Sparkles className={`${isFullscreenWinners ? "w-7 h-7" : "w-5 h-5"} text-yellow-400`} />
                <span>ทำเนียบผู้ได้รับรางวัลเกียรติยศ ({winners.length})</span>
              </h4>
              <p className={`${isFullscreenWinners ? "text-sm text-white/60 mt-1.5" : "text-xs text-white/50 mt-0.5"} font-light`}>
                รายชื่อสุ่มได้จะถูกบันทึกที่นี่โดยอัตโนมัติ เจ้าหน้าที่สามารถลบผู้โชคดีคืนได้หากสปินกรณีผิดพลาด
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              {winners.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("ต้องการรีเซ็ตประวัติผู้ได้รับรางวัลทั้งหมดใช่หรือไม่?")) {
                      onResetAllWinners();
                      setWinner(null);
                      setMultiWinners([]);
                    }
                  }}
                  className={`${isFullscreenWinners ? "text-sm px-5 py-3" : "text-xs px-3.5 py-2"} font-semibold text-red-300 hover:text-red-200 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer`}
                >
                  <ListRestart className={`${isFullscreenWinners ? "w-4.5 h-4.5" : "w-3.5 h-3.5"}`} />
                  ล้างผู้ได้รับรางวัลทั้งหมด
                </button>
              )}
              
              <button
                type="button"
                onClick={toggleFullscreenWinners}
                className={`${isFullscreenWinners ? "p-3 bg-white/10 hover:bg-white/15" : "px-3.5 py-2 bg-white/5 hover:bg-white/10"} border border-white/10 rounded-xl text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm`}
                title={isFullscreenWinners ? "ย่อหน้าจอ (Exit Fullscreen)" : "เต็มจอภาพทำเนียบรางวัล (Fullscreen)"}
              >
                {isFullscreenWinners ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-pink-400" />
                    <span>ย่อจอ</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>เต็มจอ</span>
                  </>
                )}
              </button>
            </div>
          </div>
 
          {winners.length === 0 ? (
            <div className={`text-center ${isFullscreenWinners ? "py-24 text-lg text-white/30" : "py-8 text-sm text-white/40"} font-light`}>
              🏆 ยังไม่มีใครได้รับรางวัลประดับประดาบอร์ดในขณะนี้
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 ${isFullscreenWinners ? "flex-1 overflow-y-auto mt-6 pr-1 pb-10" : "max-h-48 overflow-y-auto pr-1 scrollbar-none"}`}>
              {winners.map((winner) => (
                <div
                  key={winner.id}
                  className={`bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center transition-all hover:bg-white/5 hover:border-white/10 shadow-sm ${isFullscreenWinners ? "p-5 md:p-6" : "p-3.5"}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                    {/* Big prominent ID number in front */}
                    <div className={`bg-[#A855F7] text-black font-black font-mono flex items-center justify-center rounded-xl shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.35)] border border-purple-300 select-none ${
                      isFullscreenWinners 
                        ? "text-2xl md:text-3xl w-14 h-14 md:w-16 md:h-16 rounded-2xl" 
                        : "text-base sm:text-lg w-10 h-10 sm:w-11 sm:h-11"
                    }`}>
                      {String(winner.id).startsWith("S") ? winner.id : String(winner.id).padStart(3, "0")}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className={`${isFullscreenWinners ? "text-lg md:text-xl" : "text-sm"} font-bold text-yellow-300 truncate`}>{winner.fullName}</div>
                      <div className={`${isFullscreenWinners ? "text-sm mt-0.5" : "text-xs"} text-white/50 truncate`}>แผนก: {winner.department}</div>
                      <div className={`${isFullscreenWinners ? "text-xs mt-2 px-3 py-1" : "text-[10px] mt-1 px-2 py-0.5"} text-yellow-300 uppercase tracking-widest truncate bg-yellow-500/10 rounded-full inline-block border border-yellow-500/20`}>
                        🎁 {winner.wonPrizeName || "รางวัล"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`ยกเลิกประวัติรางวัลของ ${winner.fullName} คืนผู้ได้รับรางวัลสู่ระบบสุ่ม?`)) {
                        onResetWinner(winner.id);
                        setWinner((current) => (current && current.id === winner.id ? null : current));
                        setMultiWinners((prev) => prev.filter((w) => w.id !== winner.id));
                      }
                    }}
                    className={`border border-white/5 text-white/30 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer ${isFullscreenWinners ? "p-3" : "p-2"}`}
                    title="ลบสิทธิ์และส่งกลับหมวดสุ่มใหม่"
                  >
                    <Trash2 className={`${isFullscreenWinners ? "w-4.5 h-4.5" : "w-3.5 h-3.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
