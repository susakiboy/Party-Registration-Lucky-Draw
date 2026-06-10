/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Participant } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { User, Shield, Briefcase, CheckCircle2, Ticket } from "lucide-react";

interface RegistrationFormProps {
  onRegister: (fullName: string, department: string) => Participant | null;
}

export default function RegistrationForm({ onRegister }: RegistrationFormProps) {
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [registeredUser, setRegisteredUser] = useState<Participant | null>(null);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setIsError(true);
      setErrorMsg("กรุณากรอกชื่อ-นามสกุล");
      return;
    }
    if (!department.trim()) {
      setIsError(true);
      setErrorMsg("กรุณากรอกแผนก หรือเบอร์โทรศัพท์");
      return;
    }

    setIsError(false);
    setErrorMsg("");

    const result = onRegister(fullName.trim(), department.trim());
    if (result) {
      setRegisteredUser(result);
      setFullName("");
      setDepartment("");
    } else {
      setIsError(true);
      setErrorMsg("ชื่อนี้เคยลงทะเบียนไว้ในระบบแล้ว");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-2" id="registration-section">
      <AnimatePresence mode="wait">
        {!registeredUser ? (
          <motion.div
            key="reg-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="glass-panel rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Corner Graphic Accents from Frosted Glass Theme */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-pink-500/70 rounded-tl-[32px]"></div>
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-indigo-550/70 rounded-br-[32px]"></div>

            {/* Background elements */}
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-550/15 rounded-full blur-2xl pointer-events-none"></div>

            <div className="text-center mb-6 relative">
              <span className="inline-block px-4 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-xs font-bold uppercase tracking-widest mb-3">
                🎉 GUEST REGISTER
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent uppercase">
                ลงทะเบียนเข้างาน
              </h2>
              <p className="text-white/60 text-sm mt-1 font-light">
                กรอกข้อมูลของคุณเพื่อลุ้นรับรางวัล Lucky Draw สุดพิเศษ!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-white/70 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-pink-400" />
                  ชื่อ - นามสกุล
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ภาษาไทย หรือ English"
                    className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-550 font-light text-base"
                    id="input-fullname"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-white/70 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  แผนก / เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="เช่น IT, HR, ฝ่ายขาย หรือ 089-xxxxxxx"
                    className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-550 font-light text-base"
                    id="input-department"
                  />
                </div>
              </div>

              {isError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/15 border border-red-500/30 text-red-200 text-sm py-2 px-3 rounded-lg text-center font-light"
                  id="error-message"
                >
                  ⚠️ {errorMsg}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(236, 72, 153, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-650 text-white font-extrabold uppercase py-3.5 px-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-2 text-base cursor-pointer tracking-wider"
                id="btn-register"
              >
                <Ticket className="w-5 h-5 animate-pulse" />
                ลงทะเบียนเข้างาน
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="reg-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="glass-panel rounded-[32px] p-8 shadow-2xl relative text-center"
          >
            {/* Corner Graphic Accents from Frosted Glass Theme */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-emerald-500/60 rounded-tl-[32px]"></div>
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-emerald-500/60 rounded-br-[32px]"></div>

            <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-555/10 rounded-full blur-2xl pointer-events-none"></div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-2 tracking-tight uppercase">
              ลงทะเบียนสำเร็จ!
            </h3>
            <p className="text-white/70 text-sm mb-6 font-light max-w-xs mx-auto">
              ชื่อของคุณได้รับการบันทึกเข้าระบบสุ่มรางวัล Lucky Draw เป็นที่เรียบร้อยแล้ว ขอให้คุณโชคดี! 🎉
            </p>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-2.5 max-w-sm mx-auto shadow-inner">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40 font-light">ชื่อ-นามสกุล:</span>
                <span className="text-white font-medium text-base">{registeredUser.fullName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40 font-light">แผนก/เบอร์โทร:</span>
                <span className="text-white font-medium text-base">{registeredUser.department}</span>
              </div>
              <div className="border-t border-white/10 my-2 pt-2.5 flex justify-between items-center text-sm">
                <span className="text-pink-400 font-light">ลำดับลงทะเบียน:</span>
                <span className="font-mono text-pink-300 font-bold bg-pink-500/15 border border-pink-500/30 px-2.5 py-0.5 rounded text-sm shadow-sm">
                  #{String(registeredUser.id).padStart(4, "0")}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRegisteredUser(null)}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              ลงทะเบียนเพิ่มอีกคน +
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
