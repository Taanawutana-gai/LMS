
export enum LeaveType {
  SICK = 'ลาป่วย (Sick Leave)',
  ANNUAL = 'ลาพักร้อน (Annual Leave)',
  PERSONAL = 'ลากิจ (Personal Leave)',
  MATERNITY = 'ลาคลอด (Maternity Leave)',
  PUBLIC_HOLIDAY = 'วันหยุดนักขัตฤกษ์ (Public Holiday)',
  LEAVE_WITHOUT_PAY = 'ลาไม่รับเงินเดือน (Leave Without Pay)',
  WEEKLY_HOLIDAY_SWITCH = 'สลับวันหยุดประจำสัปดาห์ (Weekly Holiday Switch)',
  OTHER = 'ลาอื่นๆ (Other Leave)'
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled'
}

export enum UserRole {
  FIXED = 'Fixed',
  SUPERVISOR = 'Supervisor',
  HR = 'HR'
}

/**
 * Interface mapping to Google Sheet: Employ_DB
 */
export interface UserProfile {
  lineUserId: string; // Column 1: LINE ID
  staffId: string;    // Column 2: รหัสพนักงาน
  name: string;       // Column 3: ชื่อ-นามสกุล
  siteId: string;     // Column 4: ไซต์งาน
  roleType: UserRole; // Column 5: บทบาท (Fixed / Supervisor)
  position: string;   // Column 6: ตำแหน่ง
}

/**
 * Interface mapping to Google Sheet: Leave_Balances (Horizontal Style - 18 Columns)
 * 1 row per employee
 * 
 * Column 1 (A):  staffId (Key)
 * Column 2 (B):  name (ชื่อพนักงาน)
 * Column 3 (C):  siteId (รหัสไซต์งาน)
 * Column 4 (D):  ลาพักร้อนused       | Column 5 (E):  ลาพักร้อน_remain
 * Column 6 (F):  ลาป่วยL_used       | Column 7 (G):  ลาป่วยL_remain
 * Column 8 (H):  ลากิจ_used         | Column 9 (I):  ลากิจ_remain
 * Column 10 (J): ลาคลอด_used        | Column 11 (K): ลาคลอด_remain
 * Column 12 (L): วันหยุดนักขัตฤกษ์_used | Column 13 (M): วันหยุดนักขัตฤกษ์_remain
 * Column 14 (N): ลาไม่รับเงินเดือน_used | Column 15 (O): ลาไม่รับเงินเดือน_remain
 * Column 16 (P): การขอสลับวันหยุด (Counter - Adds to Column R when approved)
 * Column 17 (Q): ลาอื่นๆ_used        | Column 18 (R): ลาอื่นๆ_remain (Base + Approved Switches)
 */
export interface LeaveBalance {
  type: LeaveType;
  total: number; // This maps to the _remain or total based on type logic
  used: number;  // This maps to the _used column
}

/**
 * Interface mapping to Google Sheet: Leave_Requests (15 Columns)
 */
export interface LeaveRequest {
  appliedDate: string;      // Column 1: วันที่กดยื่นคำขอ
  id: string;               // Column 2: ไอดีคำขอ
  staffId: string;          // Column 3: รหัสพนักงาน
  staffName: string;        // Column 4: ชื่อพนักงาน
  siteId: string;           // Column 5: รหัสไซต์งาน
  type: LeaveType;          // Column 6: ประเภทการลา
  startDate: string;        // Column 7: วันที่เริ่มลา
  endDate: string;          // Column 8: วันที่สิ้นสุดลา
  totalDays: number;        // Column 9: จำนวนวันที่ลาจริง
  reason: string;           // Column 10: เหตุผลการลา
  status: LeaveStatus;      // Column 11: สถานะ
  attachmentUrl?: string;   // Column 12: ลิงก์รูปภาพ
  approver?: string;        // Column 13: ผู้อนุมัติ
  approverReason?: string;  // Column 14: เหตุผลจากหัวหน้า
  approvalDate?: string;    // Column 15: วันที่อนุมัติ/ปฏิเสธ
}
