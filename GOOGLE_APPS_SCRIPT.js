
const TARGET_SHEET_ID = "1q9elvW0_-OkAi8vBwHg38579Z1ozCgeEC27fnLaYBtk";

function doGet(e) {
  e = e || { parameter: { action: "testConnection", sheetId: TARGET_SHEET_ID } };
  const action = e.parameter.action;
  const staffId = e.parameter.staffId;
  const lineUserId = e.parameter.lineUserId;
  const sheetId = e.parameter.sheetId || TARGET_SHEET_ID;

  try {
    const ss = SpreadsheetApp.openById(sheetId);
    if (action === 'checkUserStatus') {
      const sheet = ss.getSheetByName('Employ_DB');
      const data = sheet.getDataRange().getValues();
      const user = data.find(row => row[0] == lineUserId);
      if (user) return jsonResponse({ success: true, profile: { lineUserId: user[0], staffId: user[1], name: user[2], siteId: user[3], roleType: user[4], position: user[5] } });
      return jsonResponse({ success: false, message: 'Not linked' });
    }
    if (action === 'getProfile') {
      const sheet = ss.getSheetByName('Employ_DB');
      const data = sheet.getDataRange().getValues();
      const user = data.find(row => row[1] == staffId);
      if (user) return jsonResponse({ success: true, profile: { lineUserId: user[0], staffId: user[1], name: user[2], siteId: user[3], roleType: user[4], position: user[5] } });
      return jsonResponse({ success: false });
    }
    if (action === 'getBalances') {
      const sheet = ss.getSheetByName('Leave_Balances');
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
        return jsonResponse({ success: true, data: { balances } });
      }
    }
    if (action === 'getRequests' || action === 'getAllRequests') {
      const sheet = ss.getSheetByName('Leave_Requests');
      if (!sheet) return jsonResponse({ success: true, requests: [] });
      const data = sheet.getDataRange().getValues();
      data.shift();
      let filtered = (action === 'getAllRequests') ? data : data.filter(r => r[2] == staffId);
      const res = filtered.map(r => ({
        appliedDate: r[0], id: r[1], staffId: r[2], staffName: r[3], siteId: r[4],
        type: r[5], startDate: r[6], endDate: r[7], totalDays: r[8], reason: r[9],
        status: r[10], attachmentUrl: r[11], approver: r[12], approverReason: r[13], approvalDate: r[14]
      })).reverse();
      return jsonResponse({ success: true, requests: res });
    }
  } catch (err) { return jsonResponse({ success: false, error: err.toString() }); }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(body.sheetId || TARGET_SHEET_ID);
  if (body.action === 'addRequest') {
    const sheet = ss.getSheetByName('Leave_Requests');
    const id = 'REQ-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    sheet.appendRow([new Date().toISOString().split('T')[0], id, body.staffId, body.staffName, body.siteId, body.type, body.startDate, body.endDate, body.totalDays, body.reason, 'Pending', body.attachmentUrl || '']);
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
  if (body.action === 'linkLineId') {
    const sheet = ss.getSheetByName('Employ_DB');
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(r => r[1] == body.staffId);
    if (idx !== -1) { sheet.getRange(idx+1, 1).setValue(body.lineUserId); return jsonResponse({ success: true }); }
  }
  return jsonResponse({ success: false });
}

function updateBalances(ss, req, status) {
  const staffId = req[2];
  const type = req[5];
  const days = parseFloat(req[8]);
  const sheet = ss.getSheetByName('Leave_Balances');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] == staffId);
  if (idx === -1) return;
  const row = idx + 1;

  if (type === 'สลับวันหยุดประจำสัปดาห์ (Weekly Holiday Switch)') {
    const curUsed = parseFloat(sheet.getRange(row, 16).getValue() || 0);
    sheet.getRange(row, 16).setValue(curUsed + 1);
    const curOtherRemain = parseFloat(sheet.getRange(row, 18).getValue() || 0);
    sheet.getRange(row, 18).setValue(curOtherRemain + 1); // เพิ่มวันหยุดให้อีก 1 วันในช่อง 'ลาอื่นๆ'
  } else {
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
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
