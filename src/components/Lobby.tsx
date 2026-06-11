/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Participant, Prize } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  Trash2,
  Download,
  Upload,
  UserPlus,
  Play,
  QrCode,
  Sparkles,
  RefreshCw,
  Gift,
  HelpCircle,
  FileCheck,
  Settings,
  Image as ImageIcon
} from "lucide-react";

interface LobbyProps {
  participants: Participant[];
  prizes: Prize[];
  onAddParticipant: (fullName: string, department: string) => Participant | null;
  onRemoveParticipant: (id: string) => void;
  onClearAll: () => void;
  onImportParticipants: (imported: Participant[]) => void;
  onSwitchToLuckyDraw: () => void;
  onUpdatePrizes: (newPrizes: Prize[]) => void;
  onResetWinner?: (winnerId: string) => void;
  onResetAllWinners?: () => void;
  systemTitle: string;
  onUpdateSystemTitle: (title: string) => void;
  systemSubtitle: string;
  onUpdateSystemSubtitle: (subtitle: string) => void;
  logoUrl: string;
  onUpdateLogoUrl: (url: string) => void;
}

export default function Lobby({
  participants,
  prizes = [],
  onAddParticipant,
  onRemoveParticipant,
  onClearAll,
  onImportParticipants,
  onSwitchToLuckyDraw,
  onUpdatePrizes,
  onResetWinner,
  onResetAllWinners,
  systemTitle,
  onUpdateSystemTitle,
  systemSubtitle,
  onUpdateSystemSubtitle,
  logoUrl,
  onUpdateLogoUrl
}: LobbyProps) {
  // Staff security login
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem("staff_logged_in") === "true");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Prize management states
  const [newPrizeLabel, setNewPrizeLabel] = useState("");
  const [newPrizeAmountVal, setNewPrizeAmountVal] = useState<number>(1);
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [editingPrizeName, setEditingPrizeName] = useState("");
  const [editingPrizeAmount, setEditingPrizeAmount] = useState<number>(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterWinner, setFilterWinner] = useState<"all" | "eligible" | "won">("all");
  
  // Manual adding inputs
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualSuccess, setManualSuccess] = useState(false);

  // QR Code Panel states
  const [showQRModal, setShowQRModal] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "administrator" && password === "m2k3dwin") {
      setIsLoggedIn(true);
      sessionStorage.setItem("staff_logged_in", "true");
      setLoginError("");
    } else {
      setLoginError("คุณป้อน Username หรือ Password ไม่ถูกต้อง!");
    }
  };

  const handleAddPrizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeLabel.trim() || newPrizeAmountVal <= 0) {
      alert("กรุณากรอกชื่อรางวัล และจำนวนที่ถูกต้อง");
      return;
    }
    const newPrizeItem: Prize = {
      id: "p_" + Date.now(),
      name: newPrizeLabel.trim(),
      amount: newPrizeAmountVal,
      drawnCount: 0
    };
    onUpdatePrizes([...prizes, newPrizeItem]);
    setNewPrizeLabel("");
    setNewPrizeAmountVal(1);
  };

  const handleDeletePrize = (id: string) => {
    if (confirm("ต้องการลบของรางวัลชิ้นนี้ใช่หรือไม่?")) {
      onUpdatePrizes(prizes.filter(p => p.id !== id));
    }
  };

  const handleStartEditPrize = (prize: Prize) => {
    setEditingPrizeId(prize.id);
    setEditingPrizeName(prize.name);
    setEditingPrizeAmount(prize.amount);
  };

  const handleSaveEditPrize = (id: string) => {
    if (!editingPrizeName.trim() || editingPrizeAmount <= 0) {
      alert("กรุณากรอกชื่อรางวัล และจำนวนที่ถูกต้อง");
      return;
    }
    const updated = prizes.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: editingPrizeName.trim(),
          amount: editingPrizeAmount
        };
      }
      return p;
    });
    onUpdatePrizes(updated);
    setEditingPrizeId(null);
  };

  // Search and filter logic
  const filteredList = participants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.includes(searchQuery);

    if (filterWinner === "won") return matchesSearch && p.isWinner;
    if (filterWinner === "eligible") return matchesSearch && !p.isWinner;
    return matchesSearch;
  });

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualDept.trim()) {
      setManualError("กรุณากรอกทั้งชื่อและแผนกให้ครบถ้วน");
      setManualSuccess(false);
      return;
    }

    const added = onAddParticipant(manualName.trim(), manualDept.trim());
    if (added) {
      setManualName("");
      setManualDept("");
      setManualError("");
      setManualSuccess(true);
      setTimeout(() => setManualSuccess(false), 3000);
    } else {
      setManualError("ชื่อนี้เคยถูกบันทึกในระบบแล้ว");
      setManualSuccess(false);
    }
  };

  // Export JSON function
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(participants, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `party_participants_export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON function
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Basic validity verify
            const valid = parsed.every(
              (item) =>
                typeof item.id === "string" &&
                typeof item.fullName === "string" &&
                typeof item.department === "string" &&
                typeof item.isWinner === "boolean"
            );
            if (valid) {
               onImportParticipants(parsed);
               alert(`นำเข้ารายชื่อเรียบร้อยแล้วจำนวน ${parsed.length} รายชื่อ!`);
            } else {
              alert("รูปแบบไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ที่ส่งออกจากระบบนี้");
            }
          } else {
            alert("ไฟล์ JSON ต้องเป็นรายการอาร์เรย์ของรายชื่อ");
          }
        } catch (error) {
          alert("ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ JSON ที่ถูกต้อง");
        }
      };
    }
  };

  // Helper to escape CSV cell value cleanly
  const escapeCsvValue = (val: string) => {
    if (val === undefined || val === null) return '""';
    const cleanValue = val.toString().replace(/"/g, '""');
    if (cleanValue.includes(",") || cleanValue.includes("\n") || cleanValue.includes("\r") || cleanValue.includes('"')) {
      return `"${cleanValue}"`;
    }
    return cleanValue;
  };

  // Export CSV function with UTF-8 BOM so Excel displays Thai characters correctly
  const handleExportCSV = () => {
    if (participants.length === 0) return;

    const headers = ["id", "fullName", "department", "registeredAt", "isWinner", "wonPrizeName", "wonAt"];
    const csvRows = [
      headers.join(","),
      ...participants.map((p) => {
        return [
          escapeCsvValue(p.id),
          escapeCsvValue(p.fullName),
          escapeCsvValue(p.department),
          escapeCsvValue(p.registeredAt),
          p.isWinner ? "true" : "false",
          escapeCsvValue(p.wonPrizeName || ""),
          escapeCsvValue(p.wonAt || "")
        ].join(",");
      })
    ];

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `party_participants_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Parser helper to support quotes, newlines, and escape sequences inside CSV
  const parseCSV = (text: string): Participant[] => {
    const lines: string[] = [];
    let currentLine = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\n') {
          lines.push(currentLine);
          currentLine = "";
        } else if (char === '\r') {
          lines.push(currentLine);
          currentLine = "";
          if (text[i + 1] === '\n') {
            i++;
          }
        }
      } else {
        currentLine += char;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    if (lines.length < 2) return [];

    const parseCSVRow = (rowText: string): string[] => {
      const result: string[] = [];
      let currentVal = "";
      let insideQuotes = false;

      for (let i = 0; i < rowText.length; i++) {
        const char = rowText[i];
        if (char === '"') {
          if (insideQuotes && rowText[i + 1] === '"') {
            currentVal += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          result.push(currentVal.trim());
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal.trim());
      return result;
    };

    const headerLine = lines[0];
    const headers = parseCSVRow(headerLine).map(h => h.toLowerCase().trim());
    const importedParticipants: Participant[] = [];

    // Search indexes matching different localized strings
    const idxId = headers.findIndex(h => h.includes("id") || h.includes("ลำดับ") || h.includes("รหัส") || h === "no" || h === "ลำดับที่");
    const idxFullName = headers.findIndex(h => h.includes("fullname") || h.includes("name") || h.includes("ชื่อ") || h.includes("สกุล"));
    const idxDept = headers.findIndex(h => h.includes("department") || h.includes("dept") || h.includes("แผนก") || h.includes("ฝ่าย") || h === "หน่วยงาน");
    const idxRegAt = headers.findIndex(h => h.includes("registeredat") || h.includes("time") || h.includes("เวลา"));
    const idxIsWinner = headers.findIndex(h => h.includes("iswinner") || h.includes("winner") || h.includes("ชนะ"));
    const idxWonPrize = headers.findIndex(h => h.includes("wonprizename") || h.includes("prize") || h.includes("รางวัลที่ได้"));
    const idxWonAt = headers.findIndex(h => h.includes("wonat") || h.includes("เวลาได้"));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = parseCSVRow(line);
      if (columns.length === 0) continue;

      // Make fields with fallback index logic
      let id = "";
      if (idxId !== -1 && columns[idxId]) {
        id = columns[idxId];
      } else {
        id = columns[0] ? columns[0] : `S${Date.now()}_${i}`;
      }

      let fullName = "";
      if (idxFullName !== -1 && columns[idxFullName]) {
        fullName = columns[idxFullName];
      } else {
        // Fallback: second column
        fullName = columns[1] || "";
      }

      let department = "";
      if (idxDept !== -1 && columns[idxDept]) {
        department = columns[idxDept];
      } else {
        // Fallback: third column
        department = columns[2] || "ทั่วไป (General)";
      }

      // If name is blank, we can generate a simple placeholder or skip
      if (!fullName) continue;

      let registeredAt = new Date().toISOString();
      if (idxRegAt !== -1 && columns[idxRegAt]) {
        registeredAt = columns[idxRegAt];
      }

      let isWinner = false;
      if (idxIsWinner !== -1 && columns[idxIsWinner]) {
        const val = columns[idxIsWinner].toLowerCase();
        isWinner = val === "true" || val === "1" || val === "yes" || val === "y" || val === "ใช่";
      }

      let wonPrizeName = "";
      if (idxWonPrize !== -1 && columns[idxWonPrize]) {
        wonPrizeName = columns[idxWonPrize];
      }

      let wonAt = "";
      if (idxWonAt !== -1 && columns[idxWonAt]) {
        wonAt = columns[idxWonAt];
      }

      importedParticipants.push({
        id,
        fullName,
        department,
        registeredAt,
        isWinner,
        wonPrizeName: wonPrizeName || undefined,
        wonAt: wonAt || undefined
      });
    }

    return importedParticipants;
  };

  // Import CSV function
  const handleImportCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = parseCSV(content);
          if (parsed.length > 0) {
            onImportParticipants(parsed);
            alert(`นำเข้ารายชื่อผู้ร่วมงานจาก CSV เรียบร้อยแล้วจำนวน ${parsed.length} คน!`);
          } else {
            alert("ไม่พบรายชื่อผู้ร่วมงานในไฟล์ CSV หรือรูปเล่มหัวตาราง (Header) ไม่ถูกต้อง\n\nหัวตารางควรมีอย่างน้อย: id, fullName, department");
          }
        } catch (error) {
          alert("ไม่สามารถประมวลผลไฟล์ CSV ได้ กรุณาตรวจสอบความถูกต้องของไฟล์");
        }
      };
    }
  };

  const loadSampleParticipants = () => {
    const samples: Participant[] = [
      { id: "S1", fullName: "สมศักดิ์ รักดี", department: "IT Support", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S2", fullName: "พิมพ์ชนก ณ นคร", department: "Marketing", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S3", fullName: "David Beckham", department: "Executive Office", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S4", fullName: "กิตติพงษ์ แก้วมณี", department: "Accounting", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S5", fullName: "อนันดา พงษ์ศิริ", department: "Human Resources", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S6", fullName: "ศิริพร บุญล้อม", department: "Customer Service", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S7", fullName: "John Carter", department: "R&D Software", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S8", fullName: "พัชราภรณ์ ทวีวิลัย", department: "Purchasing", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S9", fullName: "วิชัย ยอดทอง", department: "Facilities", registeredAt: new Date().toISOString(), isWinner: false },
      { id: "S10", fullName: "ณิชารีย์ สุขสำราญ", department: "Business Analyst", registeredAt: new Date().toISOString(), isWinner: false }
    ];
    onImportParticipants(samples);
  };

  // Generate current registration page link dynamically
  const registrationLink = window.location.href;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=236-72-153&bgcolor=11-8-26&data=${encodeURIComponent(registrationLink)}`;

  if (!isLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 animate-fadeIn" id="login-panel">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-[32px] p-8 shadow-2xl relative overflow-hidden text-center border border-white/10"
        >
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-purple-500/70 rounded-tl-[24px]"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-pink-500/70 rounded-br-[24px]"></div>

          <div className="space-y-2 mb-6">
            <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
              Staff Portal Security
            </span>
            <h3 className="text-2xl font-black text-white uppercase tracking-wider">
              แผงควบคุมสตาฟฟ์
            </h3>
            <p className="text-white/60 text-xs font-light">
              กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ เพื่อสับเปลี่ยนของรางวัลและจัดการผู้ลงทะเบียน
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold uppercase text-white/50 mb-1.5 tracking-wide">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ป้อนชื่อผู้ใช้งาน..."
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-white/50 mb-1.5 tracking-wide">
                รหัสผ่าน (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ป้อนรหัสผ่าน..."
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                required
              />
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center font-medium"
              >
                ⚠️ {loginError}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 via-violet-600 to-pink-500 hover:opacity-95 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
            >
              เข้าสู่ระบบสตาฟฟ์ 🔓
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-2 space-y-6" id="lobby-panel">
      {/* Top Staff Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white/[0.02] border border-white/10 rounded-2xl p-4 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="text-xs text-white/70 font-semibold tracking-wider uppercase font-mono">STAFF AUTHORIZED PORTAL / แผงควบคุมระบบสตาฟฟ์</span>
        </div>
        <button
          onClick={() => {
            setIsLoggedIn(false);
            sessionStorage.removeItem("staff_logged_in");
            setUsername("");
            setPassword("");
          }}
          className="text-xs font-bold text-red-300 hover:text-red-200 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          🔐 ออกจากระบบสตาฟฟ์
        </button>
      </div>

      {/* Upper overview section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-6 shadow-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-1">
            <span className="text-xs text-white/50 font-light uppercase tracking-wider block">ลงทะเบียนแล้วทั้งหมด</span>
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{participants.length}</span>
            <span className="text-xs text-white/40 block">คน (จากช่องทางมือถือ & คีย์มือ)</span>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 text-white rounded-xl">
            <Users className="w-8 h-8" />
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-xl flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs text-white/50 font-light uppercase tracking-wider block">สิทธิ์ที่รอสุ่มรางวัล</span>
            <span className="text-3xl font-extrabold text-[#FF2E93] font-mono tracking-tight glow-text-pink">
              {participants.filter((p) => !p.isWinner).length}
            </span>
            <span className="text-xs text-white/40 block">คน (ผู้ที่มีสถานะยังไม่ได้รับของรางวัล)</span>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 text-pink-400 rounded-xl">
            <Gift className="w-8 h-8" />
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col justify-between items-center sm:items-stretch gap-4 relative overflow-hidden">
          <div className="flex justify-between items-center w-full">
            <div className="space-y-0.5">
              <span className="text-xs text-white/50 font-light uppercase tracking-wider block">หน้าสแกนลงทะเบียน</span>
              <span className="text-xs text-white/40 block">แจกจ่าย QR บนจอบิมโปรเจกเตอร์</span>
            </div>
            <button
              onClick={() => setShowQRModal(true)}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <QrCode className="w-4 h-4" />
              แสดง QR จอใหญ่
            </button>
          </div>
          
          <button
            onClick={onSwitchToLuckyDraw}
            className="w-full bg-gradient-to-r from-purple-550 to-pink-550 hover:from-purple-650 hover:to-pink-650 text-white text-sm font-extrabold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-4 h-4 animate-pulse" />
            เข้าสู่หน้าสุ่มวงล้อ LUCKY DRAW 🎮
          </button>
        </div>
      </div>

      {/* Main Panel Content: Add manual, search system and registry lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Grid: Add Manual & Core functions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-5 shadow-xl relative animate-fadeIn">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
              <UserPlus className="w-4 h-4 text-pink-400" />
              <span>คีย์รายชื่อด่วน (สตาฟฟ์)</span>
            </h3>
            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-white/60 mb-1.5 tracking-wide">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="เช่น มงคล ศรีสำราญ"
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-white/60 mb-1.5 tracking-wide">แผนก / โทรศัพท์ *</label>
                <input
                  type="text"
                  value={manualDept}
                  onChange={(e) => setManualDept(e.target.value)}
                  placeholder="เช่น บัญชี หรือ 0xx-xxxxxxx"
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              {manualError && (
                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2.5 py-1.5 animate-bounce">
                  ⚠️ {manualError}
                </div>
              )}

              {manualSuccess && (
                <div className="text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded px-2.5 py-1.5">
                  ✓ บันทึกรายชื่อเข้าพูลสำเร็จ!
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90 font-extrabold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
              >
                <span>เพิ่มรายชื่อเข้าสู่ระบบ ＋</span>
              </button>
            </form>
          </div>

          {/* บริหารจัดการของรางวัล */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Gift className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span>บริหารจัดการของรางวัล ({prizes.length})</span>
            </h3>

            {/* List current prizes with delete and edit */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
              {prizes.length === 0 ? (
                <div className="text-xs text-white/40 text-center py-4 font-light">
                  ไม่มีของรางวัลในระบบขณะนี้ กรุณาเพิ่มรางวัล!
                </div>
              ) : (
                prizes.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 relative transition-all hover:bg-white/[0.08]"
                  >
                    {editingPrizeId === p.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingPrizeName}
                          onChange={(e) => setEditingPrizeName(e.target.value)}
                          placeholder="ชื่อรางวัล..."
                          className="w-full glass-input rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                        />
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min="1"
                            value={editingPrizeAmount}
                            onChange={(e) => setEditingPrizeAmount(parseInt(e.target.value, 10) || 1)}
                            className="w-20 glass-input rounded-lg px-2.5 py-1 text-xs text-white text-center focus:outline-none"
                          />
                          <span className="text-xs text-white/50 font-sans">ชิ้น</span>
                          <div className="ml-auto flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveEditPrize(p.id)}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded text-[10px] cursor-pointer"
                            >
                              บันทึก
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPrizeId(null)}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white/70 rounded text-[10px] cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-semibold text-white block truncate">{p.name}</span>
                          {(() => {
                            const prizeDrawnCount = participants.filter(
                              (part) => part.isWinner && part.wonPrizeName === p.name
                            ).length;
                            const isFullyDrawn = prizeDrawnCount >= p.amount;
                            return (
                              <span className="text-[10px] text-white/50 font-mono block mt-0.5">
                                จำนวน: {p.amount} ชิ้น{" "}
                                {prizeDrawnCount > 0 && (
                                  <span className={isFullyDrawn ? "text-red-450 font-semibold" : "text-pink-400"}>
                                    | สุ่มไปแล้ว {prizeDrawnCount} ชิ้น {isFullyDrawn ? "(ครบโควตา 🔴)" : `(เหลือ ${p.amount - prizeDrawnCount} ชิ้น 🟢)`}
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditPrize(p)}
                            className="p-1.5 border border-white/5 text-white/50 hover:text-yellow-400 hover:border-yellow-500/20 hover:bg-yellow-500/10 rounded-lg transition-all cursor-pointer"
                            title="แก้ไขรางวัล"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrize(p.id)}
                            className="p-1.5 border border-white/5 text-white/30 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="ลบของรางวัล"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick add prize form */}
            <div className="border-t border-white/10 pt-3.5 space-y-2.5 font-sans">
              <span className="text-[11px] block uppercase font-bold text-white/50 tracking-wide">เพิ่มของรางวัลใหม่</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="เช่น ทองคำแท่ง 🪙"
                  value={newPrizeLabel}
                  onChange={(e) => setNewPrizeLabel(e.target.value)}
                  className="col-span-2 glass-input rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="จำนวน"
                  value={newPrizeAmountVal === 0 ? "" : newPrizeAmountVal}
                  onChange={(e) => setNewPrizeAmountVal(parseInt(e.target.value, 10) || 0)}
                  className="col-span-1 glass-input rounded-xl px-2.5 py-1.5 text-xs text-white text-center focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPrizeSubmit}
                className="w-full bg-white text-black hover:bg-white/90 font-extrabold py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
              >
                <span>เพิ่มของรางวัล ＋</span>
              </button>
            </div>
          </div>

          {/* Settings Panel: Name and Logo */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-pink-400 rotate-90" />
              <span>ตั้งค่าปาร์ตี้ & โลโก้ระบบ</span>
            </h3>

            <p className="text-xs text-white/55 leading-relaxed font-light">
              ปรับแต่งชื่อธีมงาน และอัปโหลดโลโก้บริษัทสำหรับแสดงผลบนจอหลักและหน้าจับรางวัล
            </p>

            <div className="space-y-3.5">
              {/* Logo Upload Section */}
              <div className="space-y-2">
                <label className="text-xs text-white/70 block font-medium">
                  โลโก้ประจำระบบ (แนะนำไฟล์รูปตระกูล PNG/JPG ขนาดไม่เกิน 2MB)
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative group shrink-0">
                      <img
                        src={logoUrl}
                        alt="Uploaded Logo"
                        className="w-16 h-16 object-contain rounded-xl border border-white/20 bg-black/40 p-1.5 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("คุณต้องการลบโลโก้ปัจจุบันและกลับไปใช้โลโก้เริ่มต้นใช่หรือไม่?")) {
                            onUpdateLogoUrl("");
                          }
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-xs shadow-lg transition-transform hover:scale-110 cursor-pointer"
                        title="ลบโลโก้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 group hover:border-pink-500/30 transition-all">
                      <ImageIcon className="w-5 h-5 mb-1" />
                      <span className="text-[10px]">ไม่มีโลโก้</span>
                    </div>
                  )}

                  <label className="flex-1 bg-white/[0.04] border border-white/10 hover:bg-white/10 relative rounded-xl px-4 py-3 text-xs font-semibold text-white/80 text-center transition-all cursor-pointer shadow-sm select-none">
                    <ImageIcon className="w-4 h-4 inline-block mr-1.5 text-pink-400 align-text-bottom" />
                    <span>{logoUrl ? "เปลี่ยนรูปโลโก้" : "อัปโหลดโลโก้"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 2MB)!");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result && typeof event.target.result === "string") {
                              onUpdateLogoUrl(event.target.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/70 block font-medium">ชื่อระบบหลัก (System Title)</label>
                <input
                  type="text"
                  value={systemTitle}
                  onChange={(e) => onUpdateSystemTitle(e.target.value)}
                  placeholder="เช่น Carrier Staff Party"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500/50"
                />
              </div>

              {/* Subtitle Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/70 block font-medium">ชื่องานสแตนอินรอง (System Subtitle)</label>
                <input
                  type="text"
                  value={systemSubtitle}
                  onChange={(e) => onUpdateSystemSubtitle(e.target.value)}
                  placeholder="เช่น Thai Dance in the Dark"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>
          </div>

          {/* Backup Panel: Import / Export */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>การบริหารจัดการข้อมูล</span>
            </h3>
            
            <p className="text-xs text-white/55 leading-relaxed font-light">
              แอปพลิเคชันรองรับการทำงานกับข้อมูลทั้งรูปแบบไฟล์ CSV (เปิดใน Excel / Google Sheets ได้ทันที) และรูปแบบไฟล์ JSON
            </p>

            {/* CSV Controls */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>รูปแบบไฟล์ CSV (รองรับ Excel & Sheets)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={participants.length === 0}
                  className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 py-2.5 px-3 rounded-lg text-xs font-semibold text-emerald-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  title="ส่งออกไฟล์ CSV สำหรับเปิดใน Excel หรือ Google Sheets"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  ส่งออกเป็น CSV
                </button>

                <label className="bg-[#22c55e]/10 border border-[#22c55e]/20 hover:bg-[#22c55e]/20 py-2.5 px-3 rounded-lg text-xs font-semibold text-emerald-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm text-center">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>นำเข้า CSV (.csv)</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSVFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* JSON Backup Controls */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-60"></span>
                <span>รูปแบบไฟล์ JSON (สำรองข้อมูลระบบ)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={participants.length === 0}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 px-3 rounded-lg text-xs font-semibold text-white/90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  title="ส่งออกไฟล์ JSON เพื่อสำรองหรือย้ายไปเครื่องอื่น"
                >
                  <Download className="w-3.5 h-3.5 opacity-70" />
                  ส่งออกเป็น JSON
                </button>

                <label className="bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 px-3 rounded-lg text-xs font-semibold text-white/90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm text-center">
                  <Upload className="w-3.5 h-3.5 opacity-70" />
                  <span>นำเข้า JSON (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3.5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={loadSampleParticipants}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white py-2 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                สุ่มใส่รายชื่อตัวอย่าง (10 คน) สำหรับลองระบบ
              </button>

              {participants.some((p) => p.isWinner) && onResetAllWinners && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("ต้องการรีเซ็ตประวัติผู้ได้รับรางวัลทั้งหมด และคืนสิทธิ์การสุ่มกลับให้ทุกคน ใช่หรือไม่?")) {
                      onResetAllWinners();
                    }
                  }}
                  className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 text-yellow-300 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  ล้างรายชื่อผู้ได้รับรางวัลทั้งหมด (คืนสิทธิ์สุ่มให้ทุกคน)
                </button>
              )}

              {participants.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างรายชื่อผู้เข้าร่วมและรางวัลทั้งหมด? ข้อมูลเดิมจะสูญหายทันที!")) {
                      onClearAll();
                    }
                  }}
                  className="w-full bg-red-400/10 hover:bg-red-400/20 border border-red-500/25 text-red-300 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ล้างรายชื่อทั้งหมดและล้างรางวัล
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Grid: Table / Lists views */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4.5 h-4.5 text-purple-400" />
                <span>รายชื่อผู้ลงทะเบียนจริงทั้งหมด ({participants.length} คน)</span>
              </h3>
              <p className="text-xs text-white/50 font-light mt-0.5">
                ค้นหา ดูสถานะ และคัดเลือกรายกรที่นี่
              </p>
            </div>

            {/* View selectors */}
            <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5" id="filter-tabs">
              <button
                onClick={() => setFilterWinner("all")}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterWinner === "all" ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterWinner("eligible")}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterWinner === "eligible" ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                มีสิทธิ์ลุ้น
              </button>
              <button
                onClick={() => setFilterWinner("won")}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterWinner === "won" ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                ได้รางวัลแล้ว
              </button>
            </div>
          </div>

          {/* Search boxes */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ชื่อ, แผนก หรือ รหัส ID..."
              className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-white/30 focus:outline-none"
              id="lobby-search"
            />
          </div>

          {/* Register database table list */}
          <div className="flex-1 overflow-y-auto max-h-[460px] pr-1.5 space-y-2 scrollbar-none">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-sm font-light">
                {participants.length === 0 ? (
                  <div className="space-y-2.5 max-w-xs mx-auto">
                    <p className="text-white/60 text-base font-normal">ยังไม่มีผู้ลงทะเบียนในขณะนี้</p>
                    <p className="text-xs text-white/45">
                      คุณสามารถแชร์ลิงก์ให้ผู้ใช้งานสแกนพาสเวิร์ดผ่านมือถือ หรือกด <span className="text-pink-400 font-semibold cursor-pointer" onClick={loadSampleParticipants}>"สุ่มใส่รายชื่อตัวอย่าง"</span> ด้านซ้ายเพื่อทดสอบความตื่นเต้น!
                    </p>
                  </div>
                ) : (
                  "🔍 ไม่พบข้อมูลที่ตรงกับการค้นหาของคุณ"
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredList.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="group bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex justify-between items-center transition-all hover:border-white/10 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-white/75">
                        {String(participant.id).startsWith("S") ? participant.id : `#${String(participant.id).padStart(4, "0")}`}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                          <span className="truncate">{participant.fullName}</span>
                          {participant.isWinner && (
                            <span className="text-[10px] font-bold text-yellow-300 bg-yellow-500/10 border border-yellow-500/25 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse shrink-0 tracking-wider">
                              🏆 WINNER
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/45 truncate mt-0.5">
                          แผนก/สังกัด: {participant.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {participant.isWinner && participant.wonPrizeName && (
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-white/40">รางวัลที่ได้</div>
                          <div className="text-xs font-bold text-yellow-300">{participant.wonPrizeName}</div>
                        </div>
                      )}

                      {participant.isWinner && onResetWinner && (
                        <button
                          onClick={() => {
                            if (confirm(`ยกเลิกประวัติรางวัลและคืนสิทธิ์การสุ่มให้คุณ ${participant.fullName} ใช่หรือไม่?`)) {
                              onResetWinner(participant.id);
                            }
                          }}
                          className="p-2 border border-yellow-500/15 text-yellow-400 hover:text-yellow-300 hover:border-yellow-500/30 hover:bg-yellow-500/10 rounded-lg transition-all cursor-pointer"
                          title="คืนสิทธิ์การจับรางวัลกลับเข้าหมวดสุ่มใหม่"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onRemoveParticipant(participant.id)}
                        className="p-2 border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/35 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                        title="ลบรายชื่อนี้ออกถาวร"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Large Projector QR Modal Code Overlay */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="glass-panel rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative"
            >
              {/* Corner Graphic Accents from Frosted Glass Theme */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-pink-500/70 rounded-tl-[24px]"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-pink-500/70 rounded-br-[24px]"></div>

              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>

              <div className="mb-4">
                <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                  📲 SCAN TO REGISTER
                </span>
                <h3 className="text-2xl font-black text-white">
                  สแกนคิวอาร์โค้ดเพื่อลงทะเบียนเข้างาน
                </h3>
                <p className="text-white/60 text-xs mt-1 font-light">
                  นำจอนี้ขึ้นภาพโปรเจกเตอร์ใหญ่ เพื่อให้ผู้เข้าร่วมลงทะเบียนด้วยมือถือและจอยสนุกร่วมกัน
                </p>
              </div>

              {/* Real QR code using QR server API */}
              <div className="bg-[#050110] border border-white/10 p-5 rounded-3xl inline-block my-4 shadow-inner">
                <img
                  src={qrImageSrc}
                  alt="QR Code สำหรับลงทะเบียน"
                  className="w-60 h-60 mx-auto rounded-xl shadow-md border-4 border-[#050110]"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-3">
                <div className="text-xs text-white/50 bg-[#050110]/50 p-2.5 rounded-xl border border-white/10 break-all select-all font-mono">
                  {registrationLink}
                </div>
                <p className="text-xs text-white/40 font-light">
                  💡 ผู้ใช้ทุกคนจะต้องเชื่อมต่ออินเทอร์เน็ตเพื่อเปิดหน้าเว็บร่วมลุ้นผลรางวัลเดียวกัน
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
