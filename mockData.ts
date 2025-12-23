
import { UserProfile, UserRole, LeaveType, LeaveStatus, LeaveRequest, LeaveBalance } from './types';

export const MOCK_USER: UserProfile = {
  lineUserId: 'U1234567890',
  staffId: 'EMP-001',
  name: 'Somchai Jaidee',
  siteId: 'SITE-BKK-01',
  roleType: UserRole.EMPLOYEE,
  position: 'Senior Frontend Developer'
};

export const MOCK_MANAGER: UserProfile = {
  lineUserId: 'U0987654321',
  staffId: 'MGR-005',
  name: 'Jane Doe',
  siteId: 'SITE-BKK-01',
  roleType: UserRole.MANAGER,
  position: 'Engineering Manager'
};

export const INITIAL_BALANCES: LeaveBalance[] = [
  { type: LeaveType.ANNUAL, total: 15, used: 3 },
  { type: LeaveType.SICK, total: 30, used: 2 },
  { type: LeaveType.PERSONAL, total: 6, used: 1 },
  { type: LeaveType.PUBLIC_HOLIDAY, total: 13, used: 0 },
  { type: LeaveType.MATERNITY, total: 98, used: 0 },
  { type: LeaveType.LEAVE_WITHOUT_PAY, total: 30, used: 0 },
  { type: LeaveType.WEEKLY_HOLIDAY_SWITCH, total: 0, used: 0 },
  { type: LeaveType.OTHER, total: 5, used: 0 },
];

export const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: 'REQ-001',
    staffId: 'EMP-001',
    staffName: 'Somchai Jaidee',
    siteId: 'SITE-BKK-01',
    type: LeaveType.ANNUAL,
    startDate: '2024-05-10',
    endDate: '2024-05-12',
    reason: 'Family vacation to Phuket',
    status: LeaveStatus.APPROVED,
    appliedDate: '2024-04-20',
    approverId: 'MGR-005',
    approvalDate: '2024-04-21'
  },
  {
    id: 'REQ-002',
    staffId: 'EMP-001',
    staffName: 'Somchai Jaidee',
    siteId: 'SITE-BKK-01',
    type: LeaveType.SICK,
    startDate: '2024-06-01',
    endDate: '2024-06-01',
    reason: 'Food poisoning',
    status: LeaveStatus.PENDING,
    appliedDate: '2024-06-01'
  }
];
