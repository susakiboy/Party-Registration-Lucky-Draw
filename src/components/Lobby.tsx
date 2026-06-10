/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Participant } from "../types";
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
  FileCheck
} from "lucide-react";

interface LobbyProps {
  participants: Participant[];
  onAddParticipant: (fullName: string, department: string) => Participant | null;
  onRemoveParticipant: (id: string) => void;
  onClearAll: () => void;
  onImportParticipants: (imported: Participant[]) => void;
  onSwitchToLuckyDraw: () => void;
}

export default function Lobby({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onClearAll,
  onImportParticipants,
  onSwitchToLuckyDraw
}: LobbyProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWinner, setFilterWinner] = useState<"all" | "eligible" | "won">("all");
  
  // Manual adding inputs
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualSuccess, setManualSuccess] = useState(false);

  // QR Code Panel states
  const [showQRModal, setShowQRModal] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-2 space-y-8" id="lobby-panel">
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

          {/* Backup Panel: Import / Export */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>การบริหารจัดการข้อมูล</span>
            </h3>
            
            <p className="text-xs text-white/55 leading-relaxed font-light">
              เนื่องจากแอปพึ่งพา Local Storage คุณสามารถนำออกข้อมูลเพื่อสำรอง หรือนำเข้ามาใช้เป็นต้นแบบล่วงหน้าได้ในพริบตา!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportData}
                disabled={participants.length === 0}
                className="bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 px-3 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                title="ส่งออกไฟล์ JSON เพื่อสำรองเครื่องอื่น"
              >
                <Download className="w-3.5 h-3.5" />
                ส่งออกส่งไฟล์ (JSON)
              </button>

              <label className="bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 px-3 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าข้อมูล (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border-t border-white/10 pt-3.5 flex flex-col gap-2.5">
              <button
                onClick={loadSampleParticipants}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white py-2 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                สุ่มใส่รายชื่อตัวอย่าง (10 คน) สำหรับลองระบบ
              </button>

              {participants.length > 0 && (
                <button
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
