
import { UserProfile, LeaveRequest, RawLeaveBalance, LeaveStatus } from './types.ts';

const SHEET_ID = '1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxokHPwHu8cgjl1xFnN7Hc2K7bty3U3I14ybYSZR9kAfuvGReSXFn-4mDpGUJoLUkJYIA/exec'; 

export const SheetService = {
  async checkUserStatus(lineUserId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=checkUserStatus&lineUserId=${lineUserId}&sheetId=${SHEET_ID}`);
      const data = await response.json();
      return data.success ? data.profile : null;
    } catch (error) {
      console.error('CheckUserStatus Error:', error);
      return null;
    }
  },

  async loginUser(staffId: string, lineUserId: string): Promise<{ success: boolean; message?: string; profile?: UserProfile }> {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'LOGIN_USER', 
          sheetId: SHEET_ID, 
          staffId, 
          lineUserId 
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Login Error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' };
    }
  },

  async getBalances(staffId: string): Promise<RawLeaveBalance | null> {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getBalances&staffId=${staffId}&sheetId=${SHEET_ID}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('GetBalances Error:', error);
      return null;
    }
  },

  async getRequests(staffId?: string, isManager?: boolean): Promise<LeaveRequest[]> {
    try {
      const actionParam = isManager ? 'action=getAllRequests' : 'action=getRequests';
      const staffIdParam = staffId ? `&staffId=${staffId}` : '';
      const response = await fetch(`${SCRIPT_URL}?${actionParam}${staffIdParam}&sheetId=${SHEET_ID}`);
      const data = await response.json();
      return data.success ? data.requests : [];
    } catch (error) {
      console.error('GetRequests Error:', error);
      return [];
    }
  },

  async submitRequest(request: Partial<LeaveRequest>): Promise<{ success: boolean; id?: string }> {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addRequest', sheetId: SHEET_ID, ...request })
      });
      return await response.json();
    } catch (error) {
      console.error('SubmitRequest Error:', error);
      return { success: false };
    }
  },

  async updateRequestStatus(requestId: string, status: LeaveStatus, approver?: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateStatus', sheetId: SHEET_ID, requestId, status, approver, reason })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('UpdateStatus Error:', error);
      return false;
    }
  }
};
