
export enum LeaveType {
  SICK = 'Sick Leave',
  ANNUAL = 'Annual Leave',
  PERSONAL = 'Personal Leave',
  MATERNITY = 'Maternity Leave',
  OTHER = 'Other'
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum UserRole {
  EMPLOYEE = 'Employee',
  MANAGER = 'Manager',
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
  total: number;
  used: number;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  delegate?: string;
  status: LeaveStatus;
  attachmentUrl?: string;
  appliedDate: string;
  approverId?: string;
  approverReason?: string;
  approvalDate?: string;
}
