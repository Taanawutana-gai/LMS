
import { UserProfile, LeaveRequest, RawLeaveBalance, LeaveStatus } from './types.ts';

const SHEET_ID = '1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwmHfydqNynRoIz4XUsyCo6G_YDy2uPKTLUdWMm7Pyommg7YcuSMEGHvf3VTpjxGzV9/exec'; 

export const SheetService = {
  async testConnection(): Promise<any> {
    try {
      const url = `${SCRIPT_URL}?action=testConnection&sheetId=${SHEET_ID}`;
      console.log('Fetching:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error('Connection Error:', error);
      return { success: false, message: error.message };
    }
  },

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

  async getProfile(staffId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getProfile&staffId=${staffId}&sheetId=${SHEET_ID}`);
      const data = await response.json();
      return data.success ? data.profile : null;
    } catch (error) {
      console.error('GetProfile Error:', error);
      throw error;
    }
  },

  async linkLineId(staffId: string, lineUserId: string): Promise<boolean> {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'linkLineId', sheetId: SHEET_ID, staffId, lineUserId })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('LinkLineId Error:', error);
      return false;
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
      const query = isManager ? `action=getAllRequests` : `action=getRequests&staffId=${staffId}`;
      const response = await fetch(`${SCRIPT_URL}?${query}&sheetId=${SHEET_ID}`);
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

  async updateRequestStatus(requestId: string, status: LeaveStatus, approver?: string): Promise<boolean> {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateStatus', sheetId: SHEET_ID, requestId, status, approver })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('UpdateStatus Error:', error);
      return false;
    }
  }
};
