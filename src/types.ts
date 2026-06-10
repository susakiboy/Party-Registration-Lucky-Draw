/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Participant {
  id: string;
  fullName: string;
  department: string; // แผนก หรือเบอร์โทรศัพท์
  registeredAt: string; // ISO String
  isWinner: boolean;
  wonPrizeId?: string;
  wonPrizeName?: string;
  wonAt?: string; // ISO String
}

export interface Prize {
  id: string;
  name: string; // ชื่อรางวัล เช่น Grand Prize: iPad Air, Gold Medal
  amount: number; // จำนวนช่ิน
  drawnCount: number; // สุ่มไปแล้ว
}
