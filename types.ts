
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

export interface UserProfile {
  lineUserId: string;
  staffId: string;
  name: string;
  siteId: string;
  roleType: UserRole;
  position: string;
}

export interface LeaveBalance {
  type: LeaveType;
  remain: number;
  used: number;
}

export interface RawLeaveBalance {
  staffId: string;
  name: string;
  siteId: string;
  balances: LeaveBalance[];
  switchCount: number;
}

export interface LeaveRequest {
  appliedDate: string;
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  attachmentUrl?: string;
  approver?: string;
  approverReason?: string;
  approvalDate?: string;
}
