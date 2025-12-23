/**
 * GOOGLE APPS SCRIPT - LMS BACKEND
 * Sheet Structure:
 * 1. Employ_DB (6 Columns)
 * 2. Leave_Balances (18 Columns)
 * 3. Leave_Requests (15 Columns)
 */

function doGet(e) {
  const action = e.parameter.action;
  const staffId = e.parameter.staffId;
  const sheetId = e.parameter.sheetId;
  const ss = SpreadsheetApp.openById(sheetId);

  try {
    if (action === 'getProfile') {
      const sheet = ss.getSheetByName('Employ_DB');
      const data = sheet.getDataRange().getValues();
      const user = data.find(row => row[1] == staffId);
      
      if (user) {
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
      return jsonResponse({ success: false, message: 'User not found' });
    }

    if (action === 'getBalances') {
      const sheet = ss.getSheetByName('Leave_Balances');
      const data = sheet.getDataRange().getValues();
      const row = data.find(r => r[0] == staffId);

      if (row) {
        // Mapping 18 Columns to Structured Object
        const balances = [
          { type: 'ลาพักร้อน (Annual Leave)', used: row[3], remain: row[4] },
          { type: 'ลาป่วย (Sick Leave)', used: row[5], remain: row[6] },
          { type: 'ลากิจ (Personal Leave)', used: row[7], remain: row[8] },
          { type: 'ลาคลอด (Maternity Leave)', used: row[9], remain: row[10] },
          { type: 'วันหยุดนักขัตฤกษ์ (Public Holiday)', used: row[11], remain: row[12] },
          { type: 'ลาไม่รับเงินเดือน (Leave Without Pay)', used: row[13], remain: row[14] },
          { type: 'สลับวันหยุดประจำสัปดาห์ (Weekly Holiday Switch)', used: row[15], remain: 0 }, // Switch count
          { type: 'ลาอื่นๆ (Other Leave)', used: row[16], remain: row[17] }
        ];

        return jsonResponse({
          success: true,
          data: {
            staffId: row[0],
            name: row[1],
            siteId: row[2],
            balances: balances,
            switchCount: row[15]
          }
        });
      }
      return jsonResponse({ success: false, message: 'Balance not found' });
    }

    if (action === 'getRequests' || action === 'getAllRequests') {
      const sheet = ss.getSheetByName('Leave_Requests');
      const data = sheet.getDataRange().getValues();
      const headers = data.shift();
      
      let filtered = data;
      if (action === 'getRequests') {
        filtered = data.filter(row => row[2] == staffId);
      }

      const requests = filtered.map(row => ({
        appliedDate: row[0],
        id: row[1],
        staffId: row[2],
        staffName: row[3],
        siteId: row[4],
        type: row[5],
        startDate: row[6],
        endDate: row[7],
        totalDays: row[8],
        reason: row[9],
        status: row[10],
        attachmentUrl: row[11],
        approver: row[12],
        approverReason: row[13],
        approvalDate: row[14]
      })).reverse(); // Newest first

      return jsonResponse({ success: true, requests: requests });
    }

  } catch (error) {
    return jsonResponse({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  const sheetId = body.sheetId;
  const ss = SpreadsheetApp.openById(sheetId);

  try {
    if (action === 'addRequest') {
      const sheet = ss.getSheetByName('Leave_Requests');
      const requestId = 'REQ-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      sheet.appendRow([
        body.appliedDate,
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

      return jsonResponse({ success: true, id: requestId });
    }

    if (action === 'updateStatus') {
      const sheet = ss.getSheetByName('Leave_Requests');
      const data = sheet.getDataRange().getValues();
      const rowIndex = data.findIndex(row => row[1] == body.requestId);

      if (rowIndex !== -1) {
        const rowNum = rowIndex + 1;
        sheet.getRange(rowNum, 11).setValue(body.status); // Status
        sheet.getRange(rowNum, 13).setValue(body.approver); // Approver
        sheet.getRange(rowNum, 14).setValue(body.reason); // Approver Reason
        sheet.getRange(rowNum, 15).setValue(new Date().toISOString().split('T')[0]); // Date

        // --- Business Logic: Update Balances on Approval ---
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
 * Update Leave_Balances based on Approved Request
 */
function updateEmployeeBalance(ss, requestRow) {
  const staffId = requestRow[2];
  const leaveType = requestRow[5];
  const days = parseFloat(requestRow[8]);
  
  const balanceSheet = ss.getSheetByName('Leave_Balances');
  const data = balanceSheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] == staffId);
  
  if (rowIndex === -1) return;
  const rowNum = rowIndex + 1;

  // Mapping Column index for each Leave Type
  // Col 4-5: Annual, 6-7: Sick, 8-9: Personal, 10-11: Maternity, 12-13: Public, 14-15: LWOP, 16: Switch, 17-18: Other
  const mapping = {
    'ลาพักร้อน (Annual Leave)': [4, 5],
    'ลาป่วย (Sick Leave)': [6, 7],
    'ลากิจ (Personal Leave)': [8, 9],
    'ลาคลอด (Maternity Leave)': [10, 11],
    'วันหยุดนักขัตฤกษ์ (Public Holiday)': [12, 13],
    'ลาไม่รับเงินเดือน (Leave Without Pay)': [14, 15],
    'ลาอื่นๆ (Other Leave)': [17, 18]
  };

  if (leaveType === 'สลับวันหยุดประจำสัปดาห์ (Weekly Holiday Switch)') {
    // Column 16: สลับวันหยุด (Increment Count)
    const currentCount = parseFloat(balanceSheet.getRange(rowNum, 16).getValue() || 0);
    balanceSheet.getRange(rowNum, 16).setValue(currentCount + 1);
    
    // Column 18: ลาอื่นๆ_remain (Automatically increases based on your rule)
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