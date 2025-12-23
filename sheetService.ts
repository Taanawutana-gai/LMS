
import { UserProfile, LeaveRequest, RawLeaveBalance, LeaveStatus } from './types';

// ลิงก์ชีตของคุณ: https://docs.google.com/spreadsheets/d/1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk/
const SHEET_ID = '1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk';

// URL ที่ได้จากการ Deploy Google Apps Script (ต้องทำการ Deploy เป็น Web App และตั้งค่าสิทธิ์เป็น 'Anyone')
// สำคัญ: หลังจากก๊อบปี้โค้ดใน GOOGLE_APPS_SCRIPT.js ไปวางและ Deploy แล้ว ให้นำ URL มาวางที่นี่
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwW37g7b1zvDtXZIA46suTuby9BVvGBy0gLIlZT_0yqE7h7Cdw0n6YGnIKoaO4jfQr5Vw/exec'; 

/**
 * บริการเชื่อมต่อกับ Google Sheets ผ่าน Web App Script
 */
export const SheetService = {
  /**
   * ทดสอบการเชื่อมต่อและดึงข้อมูลจาก Employ_DB
   */
  async testConnection(): Promise<any> {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=testConnection&sheetId=${SHEET_ID}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('SheetService Error (testConnection):', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * ตรวจสอบสิทธิ์และดึงข้อมูลโปรไฟล์จาก Employee_DB
   */
  async getProfile(staffId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getProfile&staffId=${staffId}&sheetId=${SHEET_ID}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.success ? data.profile : null;
    } catch (error) {
      console.error('SheetService Error (getProfile):', error);
      return null;
    }
  },

  /**
   * ดึงข้อมูลยอดคงเหลือการลาจาก Leave_Balances
   */
  async getBalances(staffId: string): Promise<RawLeaveBalance | null> {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getBalances&staffId=${staffId}&sheetId=${SHEET_ID}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('SheetService Error (getBalances):', error);
      return null;
    }
  },

  /**
   * ดึงประวัติรายการลาจาก Leave_Requests
   */
  async getRequests(staffId?: string, isManager?: boolean): Promise<LeaveRequest[]> {
    try {
      const query = isManager ? `action=getAllRequests` : `action=getRequests&staffId=${staffId}`;
      const response = await fetch(`${SCRIPT_URL}?${query}&sheetId=${SHEET_ID}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.success ? data.requests : [];
    } catch (error) {
      console.error('SheetService Error (getRequests):', error);
      return [];
    }
  },

  /**
   * บันทึกคำขอลาใหม่ลงใน Leave_Requests
   */
  async submitRequest(request: Partial<LeaveRequest>): Promise<{ success: boolean; id?: string }> {
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
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('SheetService Error (submitRequest):', error);
      return { success: false };
    }
  },

  /**
   * อัปเดตสถานะการลา (อนุมัติ/ปฏิเสธ)
   */
  async updateRequestStatus(requestId: string, status: LeaveStatus, approver?: string, reason?: string): Promise<boolean> {
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
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('SheetService Error (updateStatus):', error);
      return false;
    }
  }
};
