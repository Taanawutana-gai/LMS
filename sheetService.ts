
import { UserProfile, LeaveRequest, RawLeaveBalance, LeaveStatus } from './types';
import { MOCK_USER, INITIAL_BALANCES, INITIAL_REQUESTS } from './mockData';

const SHEET_ID = '1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk';
// ใส่ URL ที่ได้จากการ Deploy Google Apps Script ของคุณที่นี่
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzz6XW4Y-G0O4X_9S9m_oQyqC6uXf-Z0_hX-P0_R-N-C/exec'; 

const isConfigured = () => SCRIPT_URL && !SCRIPT_URL.includes('YOUR_DEPLOYED_SCRIPT_ID');

export const SheetService = {
  async getProfile(staffId: string): Promise<UserProfile | null> {
    if (!isConfigured()) return staffId === MOCK_USER.staffId ? MOCK_USER : (staffId === 'MGR-005' ? (await import('./mockData')).MOCK_MANAGER : null);
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getProfile&staffId=${staffId}&sheetId=${SHEET_ID}`);
      const data = await response.json();
      return data.success ? data.profile : null;
    } catch (error) {
      console.warn('SheetService Error (getProfile): Returning mock');
      return staffId === MOCK_USER.staffId ? MOCK_USER : null;
    }
  },

  async getBalances(staffId: string): Promise<RawLeaveBalance | null> {
    if (!isConfigured()) return { staffId, name: 'Demo User', siteId: 'SITE-01', balances: INITIAL_BALANCES, switchCount: 0 };
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getBalances&staffId=${staffId}&sheetId=${SHEET_ID}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      return { staffId, name: 'Demo User', siteId: 'SITE-01', balances: INITIAL_BALANCES, switchCount: 0 };
    }
  },

  async getRequests(staffId?: string, isManager?: boolean): Promise<LeaveRequest[]> {
    if (!isConfigured()) return INITIAL_REQUESTS;
    try {
      const query = isManager ? `action=getAllRequests` : `action=getRequests&staffId=${staffId}`;
      const response = await fetch(`${SCRIPT_URL}?${query}&sheetId=${SHEET_ID}`);
      const data = await response.json();
      return data.success ? data.requests : [];
    } catch (error) {
      return INITIAL_REQUESTS;
    }
  },

  async submitRequest(request: Partial<LeaveRequest>): Promise<{ success: boolean; id?: string }> {
    if (!isConfigured()) return { success: true, id: 'DEMO-' + Date.now() };
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'addRequest',
          sheetId: SHEET_ID,
          ...request
        })
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  },

  async updateRequestStatus(requestId: string, status: LeaveStatus, approver?: string, reason?: string): Promise<boolean> {
    if (!isConfigured()) return true;
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateStatus',
          sheetId: SHEET_ID,
          requestId,
          status,
          approver,
          reason
        })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      return false;
    }
  }
};
