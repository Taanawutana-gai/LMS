
/**
 * GOOGLE APPS SCRIPT - LMS BACKEND (Focus on Data Recording)
 * Target Sheet: 1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk
 */

const TARGET_SHEET_ID = "1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk";

// --- ฟังก์ชันสำหรับทดสอบ (ใช้กด Run ใน Editor) ---
function manualTestRecord() {
  const testBody = {
    action: "addRequest",
    sheetId: TARGET_SHEET_ID,
    appliedDate: new Date().toISOString().split('T')[0],
    staffId: "TEST-001",
    staffName: "Test User",
    siteId: "TEST-SITE",
    type: "ลาพักร้อน (Annual Leave)",
    startDate: "2024-01-01",
    endDate: "2024-01-02",
    totalDays: 2,
    reason: "Testing GAS Recording Function"
  };
  
  const result = processAddRequest(SpreadsheetApp.openById(TARGET_SHEET_ID), testBody);
  Logger.log("Test Result: " + JSON.stringify(result));
}

function doGet(e) {
  // ป้องกัน Error เมื่อกด Run ใน Apps Script Editor โดยตรง
  e = e || { parameter: { action: "testConnection", sheetId: TARGET_SHEET_ID } };
  const action = e.parameter.action;
  const staffId = e.parameter.staffId;
  const lineUserId = e.parameter.lineUserId;
  const sheetId = e.parameter.sheetId || TARGET_SHEET_ID;

  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    if (action === 'testConnection') {
      const sheet = ss.getSheetByName('Employ_DB');
      if (!sheet) return jsonResponse({ success: false, message: "Sheet 'Employ_DB' not found." });
      const data = sheet.getDataRange().getValues();
      return jsonResponse({
        success: true,
        sheetName: 'Employ_DB',
        rowCount: data.length,
        headers: data[0],
        sampleData: data.slice(1, 6)
      });
    }

    if (action === 'checkUserStatus') {
      const sheet = ss.getSheetByName('Employ_DB');
      const data = sheet.getDataRange().getValues();
      // ค้นหาจาก LINE ID (Column 0)
      const user = data.find(row => row[0] == lineUserId);
      
      if (user) {
        return jsonResponse({
          success: true,
          profile: { lineUserId: user[0], staffId: user[1], name: user[2], siteId: user[3], roleType: user[4], position: user[5] }
        });
      }
      return jsonResponse({ success: false, message: 'LINE ID not linked' });
    }

    if (action === 'getProfile') {
      const sheet = ss.getSheetByName('Employ_DB');
      const data = sheet.getDataRange().getValues();
      // ค้นหาจาก Staff ID (Column 1)
      const user = data.find(row => row[1] == staffId);
      
      if (user) {
        return jsonResponse({
          success: true,
          profile: { lineUserId: user[0], staffId: user[1], name: user[2], siteId: user[3], roleType: user[4], position: user[5] }
        });
      }
      return jsonResponse({ success: false, message: 'User not found' });
    }

    if (action === 'getBalances') {
      const sheet = ss.getSheetByName('Leave_Balances');
      if (!sheet) return jsonResponse({ success: false, message: "Sheet 'Leave_Balances' not found." });
      const data = sheet.getDataRange().getValues();
      const row = data.find(r => r[0] == staffId);

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
        return jsonResponse({ success: true, data: { staffId: row[0], name: row[1], siteId: row[2], balances: balances, switchCount: row[15] } });
      }
      return jsonResponse({ success: false, message: 'Balance not found' });
    }

    if (action === 'getRequests' || action === 'getAllRequests') {
      const sheet = ss.getSheetByName('Leave_Requests');
      if (!sheet) return jsonResponse({ success: true, requests: [] });
      const data = sheet.getDataRange().getValues();
      data.shift(); // remove header
      
      let filtered = data;
      if (action === 'getRequests') {
        filtered = data.filter(row => row[2] == staffId);
      }

      const requests = filtered.map(row => ({
        appliedDate: row[0], id: row[1], staffId: row[2], staffName: row[3], siteId: row[4],
        type: row[5], startDate: row[6], endDate: row[7], totalDays: row[8], reason: row[9],
        status: row[10], attachmentUrl: row[11], approver: row[12], approverReason: row[13], approvalDate: row[14]
      })).reverse();

      return jsonResponse({ success: true, requests: requests });
    }

    return jsonResponse({ success: false, message: "Invalid action" });

  } catch (error) {
    return jsonResponse({ success: false, message: "Error: " + error.toString() });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch(err) {
    return jsonResponse({ success: false, message: "Invalid JSON" });
  }

  const action = body.action;
  const sheetId = body.sheetId || TARGET_SHEET_ID;

  try {
    const ss = SpreadsheetApp.openById(sheetId);

    if (action === 'addRequest') {
      return jsonResponse(processAddRequest(ss, body));
    }

    if (action === 'updateStatus') {
      const sheet = ss.getSheetByName('Leave_Requests');
      const data = sheet.getDataRange().getValues();
      const rowIndex = data.findIndex(row => row[1] == body.requestId);

      if (rowIndex !== -1) {
        const rowNum = rowIndex + 1;
        sheet.getRange(rowNum, 11).setValue(body.status);
        sheet.getRange(rowNum, 13).setValue(body.approver || "");
        sheet.getRange(rowNum, 14).setValue(body.reason || "");
        sheet.getRange(rowNum, 15).setValue(new Date().toISOString().split('T')[0]);

        if (body.status === 'Approved') {
          updateEmployeeBalance(ss, data[rowIndex]);
        }
        return jsonResponse({ success: true });
      }
      return jsonResponse({ success: false, message: 'Request not found' });
    }

  } catch (error) {
    return jsonResponse({ success: false, message: error.toString() });
  }
}

/**
 * จัดการการเพิ่มข้อมูลคำขอลา
 */
function processAddRequest(ss, body) {
  let sheet = ss.getSheetByName('Leave_Requests');
  
  // ถ้าไม่มีชีต ให้สร้างใหม่พร้อม Header
  if (!sheet) {
    sheet = ss.insertSheet('Leave_Requests');
    sheet.appendRow([
      'Applied Date', 'Request ID', 'Staff ID', 'Name', 'Site ID', 
      'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Reason', 
      'Status', 'Attachment', 'Approver', 'Appr. Reason', 'Appr. Date'
    ]);
  }

  const requestId = 'REQ-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  sheet.appendRow([
    body.appliedDate || new Date().toISOString().split('T')[0],
    requestId,
    body.staffId,
    body.staffName,
    body.siteId,
    body.type,
    body.startDate,
    body.endDate,
    body.totalDays,
    body.reason,
    'Pending',
    body.attachmentUrl || '',
    '',
    '',
    ''
  ]);
  
  return { success: true, id: requestId };
}

/**
 * อัปเดตยอดคงเหลือในชีต Leave_Balances
 */
function updateEmployeeBalance(ss, requestRow) {
  const staffId = requestRow[2];
  const leaveType = requestRow[5];
  const days = parseFloat(requestRow[8]);
  
  const balanceSheet = ss.getSheetByName('Leave_Balances');
  if (!balanceSheet) return;

  const data = balanceSheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] == staffId);
  if (rowIndex === -1) return;
  
  const rowNum = rowIndex + 1;
  const mapping = {
    'ลาป่วย (Sick Leave)': [6, 7],
    'ลากิจ (Personal Leave)': [8, 9],
    'ลาพักร้อน (Annual Leave)': [4, 5],
    'ลาคลอด (Maternity Leave)': [10, 11],
    'วันหยุดนักขัตฤกษ์ (Public Holiday)': [12, 13],
    'ลาไม่รับเงินเดือน (Leave Without Pay)': [14, 15],
    'ลาอื่นๆ (Other Leave)': [17, 18]
  };

  if (leaveType === 'สลับวันหยุดประจำสัปดาห์ (Weekly Holiday Switch)') {
    const currentCount = parseFloat(balanceSheet.getRange(rowNum, 16).getValue() || 0);
    balanceSheet.getRange(rowNum, 16).setValue(currentCount + 1);
    const currentOtherRemain = parseFloat(balanceSheet.getRange(rowNum, 18).getValue() || 0);
    balanceSheet.getRange(rowNum, 18).setValue(currentOtherRemain + 1);
  } else if (mapping[leaveType]) {
    const [usedCol, remainCol] = mapping[leaveType];
    const currentUsed = parseFloat(balanceSheet.getRange(rowNum, usedCol).getValue() || 0);
    const currentRemain = parseFloat(balanceSheet.getRange(rowNum, remainCol).getValue() || 0);
    balanceSheet.getRange(rowNum, usedCol).setValue(currentUsed + days);
    balanceSheet.getRange(rowNum, remainCol).setValue(currentRemain - days);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
