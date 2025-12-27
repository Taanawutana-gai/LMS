
/**
 * Leave Management System - Backend Script
 */

const TARGET_SHEET_ID = "1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk";
const ATTACHMENT_FOLDER_ID = "1Or-p8MwFH35PbROikrvjDS3yQ-V6IOGr";

/**
 * ฟังก์ชันตรวจสอบความถูกต้องของคู่ข้อมูล LINE ID (Username) และ Staff ID (Password)
 * จากชีท "Employ_DB"
 */
function handleLogin(username, password, ss) {
  try {
    const sheet = ss.getSheetByName('Employ_DB');
    if (!sheet) return { success: false, message: "ไม่พบฐานข้อมูลพนักงาน (Employ_DB)" };
    
    const db = sheet.getDataRange().getValues(); 

    // Verification Logic: ตรวจสอบความถูกต้องของคู่ข้อมูลในแถวเดียวกัน
    // username คือ LINE ID จาก LIFF (ต้องตรงกับ คอลัมน์ A)
    // password คือ Staff ID ที่ผู้ใช้กรอก (ต้องตรงกับ คอลัมน์ B)
    const userRow = db.find(row => 
      String(row[0] || '').trim() === String(username || '').trim() && // ตรวจ Username (คอลัมน์ A)
      String(row[1] || '').trim() === String(password || '').trim()    // ตรวจ Password (คอลัมน์ B)
    );

    if (!userRow) {
      return { success: false, message: "Username หรือ Password ไม่ถูกต้อง" };
    }

    // ส่งข้อมูลผู้ใช้กลับไปเมื่อผ่านการตรวจสอบ
    return {
      success: true,
      profile: {
        lineUserId: String(userRow[0]).trim(),
        staffId: String(userRow[1]).trim(),
        name: userRow[2],
        siteId: userRow[3],
        roleType: userRow[4],
        position: userRow[5]
      }
    };
  } catch (err) {
    return { success: false, message: "Backend Error: " + err.toString() };
  }
}

function doGet(e) {
  if (!e || !e.parameter || !e.parameter.action) {
    return ContentService.createTextOutput("LMS Backend is running.").setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  const staffId = e.parameter.staffId;
  const sheetId = e.parameter.sheetId || TARGET_SHEET_ID;

  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    // หมายเหตุ: ปิด action 'checkUserStatus' ใน doGet เพื่อบังคับใช้ Password เสมอ

    if (action === 'getBalances') {
      const sheet = ss.getSheetByName('Leave_Balances');
      const data = sheet.getDataRange().getValues();
      const row = data.find(r => String(r[0] || '').trim() === String(staffId || '').trim());
      if (row) {
        const balances = [
          { type: 'ลาพักร้อน (Annual Leave)', used: row[3], remain: row[4] },
          { type: 'ลาป่วย (Sick Leave)', used: row[5], remain: row[6] },
          { type: 'ลากิจ (Personal Leave)', used: row[7], remain: row[8] },
          { type: 'ลาคลอด (Maternity Leave)', used: row[9], remain: row[10] },
          { type: 'วันหยุดนักขัตฤกษ์ (Public Holiday)', used: row[11], remain: row[12] },
          { type: 'ลาไม่รับเงินเดือน (Leave Without Pay)', used: row[13], remain: row[14] },
          { type: 'สลับวันหยุดประจำสัปดาห์ (Weekly Holiday Switch)', used: row[15], remain: 0 },
          { type: 'ลาอื่นๆ (Other Leave)', used: row[16], remain: row[17] }
        ];
        return jsonResponse({ success: true, data: { balances } });
      }
    }

    if (action === 'getRequests' || action === 'getAllRequests') {
      const sheet = ss.getSheetByName('Leave_Requests');
      if (!sheet) return jsonResponse({ success: true, requests: [] });
      const data = sheet.getDataRange().getValues();
      data.shift();
      let filtered = (action === 'getAllRequests') ? data : data.filter(r => String(r[2] || '').trim() === String(staffId || '').trim());
      const res = filtered.map(r => ({
        appliedDate: r[0], id: r[1], staffId: r[2], staffName: r[3], siteId: r[4],
        type: r[5], startDate: r[6], endDate: r[7], totalDays: r[8], reason: r[9],
        status: r[10], attachmentUrl: r[11], approver: r[12], approverReason: r[13], approvalDate: r[14]
      })).reverse();
      return jsonResponse({ success: true, requests: res });
    }
  } catch (err) { 
    return jsonResponse({ success: false, error: err.toString() }); 
  }
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return jsonResponse({ success: false, message: "No data provided." });
  }

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, message: "Invalid JSON" });
  }

  const ss = SpreadsheetApp.openById(body.sheetId || TARGET_SHEET_ID);
  
  if (body.action === 'LOGIN_USER') {
    // ตรวจสอบ Username (LINE ID) และ Password (Staff ID)
    return jsonResponse(handleLogin(body.username, body.password, ss));
  }

  if (body.action === 'addRequest') {
    const sheet = ss.getSheetByName('Leave_Requests');
    const id = 'REQ-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    let fileUrl = "";
    if (body.attachment && body.attachment.includes("base64,")) {
      try {
        const folder = DriveApp.getFolderById(ATTACHMENT_FOLDER_ID);
        const parts = body.attachment.split(",");
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const base64Data = parts[1];
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, id);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
      } catch (err) { fileUrl = "Error saving file"; }
    }

    sheet.appendRow([
      new Date().toISOString().split('T')[0], 
      id, body.staffId, body.staffName, body.siteId, 
      body.type, body.startDate, body.endDate, 
      body.totalDays, body.reason, 'Pending', fileUrl
    ]);
    return jsonResponse({ success: true, id });
  }
  
  if (body.action === 'updateStatus') {
    const sheet = ss.getSheetByName('Leave_Requests');
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(r => r[1] == body.requestId);
    if (idx !== -1) {
      sheet.getRange(idx+1, 11).setValue(body.status);
      sheet.getRange(idx+1, 13).setValue(body.approver || '');
      sheet.getRange(idx+1, 14).setValue(body.reason || '');
      sheet.getRange(idx+1, 15).setValue(new Date().toISOString().split('T')[0]);
      if (body.status === 'Approved') updateBalances(ss, data[idx], body.status);
      return jsonResponse({ success: true });
    }
  }
  
  return jsonResponse({ success: false, message: "Unknown action" });
}

function updateBalances(ss, req, status) {
  const staffId = req[2];
  const type = req[5];
  const days = parseFloat(req[8]);
  const sheet = ss.getSheetByName('Leave_Balances');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0] || '').trim() === String(staffId || '').trim());
  if (idx === -1) return;
  const row = idx + 1;

  const map = {
    'ลาพักร้อน (Annual Leave)': [4, 5],
    'ลาป่วย (Sick Leave)': [6, 7],
    'ลากิจ (Personal Leave)': [8, 9],
    'ลาคลอด (Maternity Leave)': [10, 11],
    'วันหยุดนักขัตฤกษ์ (Public Holiday)': [12, 13],
    'ลาไม่รับเงินเดือน (Leave Without Pay)': [14, 15],
    'ลาอื่นๆ (Other Leave)': [17, 18]
  };
  
  if (map[type]) {
    const [uCol, rCol] = map[type];
    const u = parseFloat(sheet.getRange(row, uCol).getValue() || 0);
    const r = parseFloat(sheet.getRange(row, rCol).getValue() || 0);
    sheet.getRange(row, uCol).setValue(u + days);
    sheet.getRange(row, rCol).setValue(r - days);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
