
/**
 * Leave Management System - Backend Script
 */

const TARGET_SHEET_ID = "1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk";
const ATTACHMENT_FOLDER_ID = "1Or-p8MwFH35PbROikrvjDS3yQ-V6IOGr";

function doGet(e) {
  if (!e || !e.parameter || !e.parameter.action) {
    return ContentService.createTextOutput("LMS Backend is running.").setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  const staffId = e.parameter.staffId;
  const lineUserId = e.parameter.lineUserId;
  const sheetId = e.parameter.sheetId || TARGET_SHEET_ID;

  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    if (action === 'checkUserStatus') {
      const sheet = ss.getSheetByName('Employ_DB');
      const data = sheet.getDataRange().getValues();
      // ตรวจสอบความถูกต้องโดยใช้เงื่อนไข row[0] = LINE ID
      const user = data.find(row => String(row[0]).trim() === String(lineUserId).trim());
      
      if (user && String(user[1]).trim() !== "") {
        return jsonResponse({ 
          success: true, 
          profile: { 
            lineUserId: user[0], 
            staffId: user[1], 
            name: user[2], 
            siteId: user[3], 
            roleType: user[4], 
            position: user[5] 
          } 
        });
      }
      return jsonResponse({ success: false, message: 'Not linked' });
    }

    if (action === 'getBalances') {
      const sheet = ss.getSheetByName('Leave_Balances');
      const data = sheet.getDataRange().getValues();
      const row = data.find(r => String(r[0]).trim() === String(staffId).trim());
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
      let filtered = (action === 'getAllRequests') ? data : data.filter(r => String(r[2]).trim() === String(staffId).trim());
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
    return jsonResponse({ success: false, message: "Manual run detected." });
  }

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, message: "Invalid JSON" });
  }

  const ss = SpreadsheetApp.openById(body.sheetId || TARGET_SHEET_ID);
  
  if (body.action === 'LOGIN_USER') {
    const sheet = ss.getSheetByName('Employ_DB');
    const data = sheet.getDataRange().getValues();
    
    const username = String(body.lineUserId).trim(); // LINE ID จากระบบ
    const password = String(body.staffId).trim();    // Staff ID ที่ผู้ใช้กรอก

    // 1. ค้นหาแถวที่ตรงตามลอจิกที่คุณให้มา (พิจารณาการผูกครั้งแรกด้วย)
    // เงื่อนไข: Staff ID (Password) ต้องตรง 
    // และ (LINE ID (Username) ต้องตรง OR LINE ID ในฐานข้อมูลยังว่างอยู่)
    const staffIdx = data.findIndex(row => {
      const rowLineId = String(row[0]).trim();
      const rowStaffId = String(row[1]).trim();
      
      const staffMatch = (rowStaffId === password);
      const lineMatch = (rowLineId === username || rowLineId === "");
      
      return staffMatch && lineMatch;
    });
    
    if (staffIdx === -1) {
      return jsonResponse({ success: false, message: 'รหัสพนักงานไม่ถูกต้อง หรือถูกผูกกับบัญชีอื่นแล้ว' });
    }

    const targetRow = data[staffIdx];
    const rowLineId = String(targetRow[0]).trim();

    // 2. ตรวจสอบว่า LINE ID นี้ไปผูกกับ Staff ID อื่นที่ "ไม่ใช่แถวนี้" หรือไม่
    const otherIdx = data.findIndex((row, idx) => 
      idx !== staffIdx && String(row[0]).trim() === username
    );
    
    if (otherIdx !== -1) {
      return jsonResponse({ success: false, message: 'บัญชี LINE นี้ถูกใช้งานโดยรหัสพนักงานอื่นแล้ว' });
    }

    // 3. หากผ่านเงื่อนไข ให้บันทึก LINE ID ลงในช่องว่าง (ถ้ายังไม่มี)
    if (rowLineId === "") {
      sheet.getRange(staffIdx + 1, 1).setValue(username);
    }

    return jsonResponse({
      success: true,
      profile: {
        lineUserId: username,
        staffId: targetRow[1],
        name: targetRow[2],
        siteId: targetRow[3],
        roleType: targetRow[4],
        position: targetRow[5]
      }
    });
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
  
  return jsonResponse({ success: false });
}

function updateBalances(ss, req, status) {
  const staffId = req[2];
  const type = req[5];
  const days = parseFloat(req[8]);
  const sheet = ss.getSheetByName('Leave_Balances');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]).trim() === String(staffId).trim());
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
