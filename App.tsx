
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Home, PlusCircle, User, ShieldCheck, Clock, X, 
  ChevronLeft, Loader2, RefreshCcw, History, AlertCircle, 
  CheckCircle2, FileText, LogOut, Search, MapPin, Hash, UserCircle,
  Key, ScanFace, AlertTriangle, CheckSquare, Camera, Trash2, RotateCcw
} from 'lucide-react';
import { 
  UserRole, LeaveType, LeaveStatus, LeaveRequest, LeaveBalance, UserProfile 
} from './types.ts';
import { SheetService } from './sheetService.ts';

const LIFF_ID = '2007509057-esMqbZzO';

const getLeaveTheme = (type: LeaveType) => {
  switch (type) {
    case LeaveType.SICK: return { color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', label: 'ลาป่วย' };
    case LeaveType.ANNUAL: return { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'พักร้อน' };
    case LeaveType.PERSONAL: return { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'ลากิจ' };
    case LeaveType.PUBLIC_HOLIDAY: return { color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', label: 'นักขัตฯ' };
    case LeaveType.MATERNITY: return { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', label: 'ลาคลอด' };
    case LeaveType.LEAVE_WITHOUT_PAY: return { color: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'ไม่รับเงิน' };
    case LeaveType.WEEKLY_HOLIDAY_SWITCH: return { color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', label: 'สลับหยุด' };
    case LeaveType.OTHER: return { color: 'bg-fuchsia-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100', label: 'ลาอื่นๆ' };
    default: return { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'ลาอื่นๆ' };
  }
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toISOString().split('T')[0];
  } catch (e) { return dateStr; }
};

const calculateDays = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
};

const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const styles = {
    [LeaveStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [LeaveStatus.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [LeaveStatus.REJECTED]: 'bg-rose-100 text-rose-700 border-rose-200',
    [LeaveStatus.CANCELLED]: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest ${styles[status] || styles[LeaveStatus.PENDING]}`}>{status}</span>;
};

// --- Sub Components ---

const RequestCard: React.FC<{ 
  req: LeaveRequest; 
  user: UserProfile | null;
  isManagerView?: boolean;
  onViewImage: (url: string) => void;
  onAction: (id: string, status: LeaveStatus, reason?: string) => void;
  onResubmit?: (req: LeaveRequest) => void;
}> = ({ req, user, isManagerView, onViewImage, onAction, onResubmit }) => {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const theme = getLeaveTheme(req.type);
  const isOwner = String(req.staffId || '').trim().toLowerCase() === String(user?.staffId || '').trim().toLowerCase();
  const currentStatus = String(req.status || 'Pending').toLowerCase().trim();
  const isPending = currentStatus === 'pending';
  const isRejected = currentStatus === 'rejected';

  return (
    <div className={`relative overflow-hidden p-4 rounded-2xl border transition-all ${isManagerView ? 'bg-white/5 border-white/5' : 'bg-white border-slate-50 shadow-sm'} space-y-3`}>
      {isManagerView && <div className={`absolute top-0 left-0 w-1 h-full ${theme.color}`} />}
      
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${theme.color}`} />
          <div>
            {isManagerView && <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">{req.staffName}</p>}
            <h5 className={`font-black text-[11px] leading-tight ${isManagerView ? 'text-white' : 'text-slate-800'}`}>{theme.label}</h5>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
              {formatDate(req.startDate)} <span className="mx-0.5 text-slate-200">|</span> {formatDate(req.endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {req.attachmentUrl && req.attachmentUrl.startsWith('http') && (
            <button onClick={() => onViewImage(req.attachmentUrl!)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isManagerView ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-300'} hover:text-blue-500`}>
              <Search size={12} />
            </button>
          )}
          <StatusBadge status={req.status} />
        </div>
      </div>
      
      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
         <span className={`${isManagerView ? 'bg-white/5' : 'bg-slate-50'} px-2 py-0.5 rounded-md font-black`}>{req.totalDays} วัน</span>
         {req.approver && <span className="text-slate-300">By: {req.approver}</span>}
      </div>

      {req.reason && (
         <div className={`p-2.5 rounded-xl border ${isManagerView ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-50'}`}>
            <p className={`text-[9px] leading-relaxed italic ${isManagerView ? 'text-slate-400' : 'text-slate-500'}`}>" {req.reason} "</p>
         </div>
      )}

      {isRejected && req.approverReason && (
        <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
           <p className="text-[8px] font-black text-rose-500 uppercase mb-0.5">Note from Approver:</p>
           <p className="text-[9px] text-rose-400 leading-tight italic">"{req.approverReason}"</p>
        </div>
      )}

      <div className={`pt-2 border-t flex gap-2 ${isManagerView ? 'border-white/5' : 'border-slate-50'}`}>
         {!isManagerView && isPending && isOwner && (
            <button 
              onClick={() => window.confirm('ยกเลิกใบลาใช่หรือไม่?') && onAction(req.id, LeaveStatus.CANCELLED)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors py-1 px-2 rounded-md hover:bg-rose-50"
            >
              <Trash2 size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">ยกเลิก</span>
            </button>
         )}
         
         {!isManagerView && isRejected && isOwner && onResubmit && (
            <button 
              onClick={() => onResubmit(req)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-xl active:scale-95 transition-all shadow-md shadow-blue-100"
            >
              <RotateCcw size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">ยื่นใหม่</span>
            </button>
         )}

         {isManagerView && isPending && (
           <div className="w-full space-y-2">
              {showRejectInput ? (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                   <textarea 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="ระบุเหตุผลการปฏิเสธ..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-[10px] text-white outline-none focus:border-rose-500/50 h-16 resize-none"
                   />
                   <div className="flex gap-2">
                     <button 
                      disabled={!rejectReason.trim()}
                      onClick={() => onAction(req.id, LeaveStatus.REJECTED, rejectReason)}
                      className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-[9px] font-black uppercase active:scale-95 transition-all"
                     >
                       Reject
                     </button>
                     <button onClick={() => setShowRejectInput(false)} className="px-3 bg-white/10 text-white rounded-lg"><X size={14}/></button>
                   </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => onAction(req.id, LeaveStatus.APPROVED)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Approve</button>
                  <button onClick={() => setShowRejectInput(true)} className="flex-1 bg-white/10 text-white py-2.5 rounded-xl text-[9px] font-black uppercase border border-white/10 active:scale-95 transition-all">Reject</button>
                </div>
              )}
           </div>
         )}
      </div>
    </div>
  );
};

const DashboardCard: React.FC<{ type: LeaveType; used: number; remain: number }> = ({ type, used, remain }) => {
  const theme = getLeaveTheme(type);
  const total = used + remain;
  const progress = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className={`relative overflow-hidden bg-white rounded-xl border-l-4 ${theme.border} shadow-sm transition-all active:scale-95 h-[100px] flex flex-col justify-between p-3`}>
      <div className="relative z-10">
        <h3 className={`text-[10px] font-[800] uppercase tracking-tight ${theme.text} leading-none mb-1 truncate`}>{theme.label}</h3>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[24px] font-[900] text-slate-800 leading-none">{remain}</span>
          <span className="text-[9px] font-[600] text-slate-400 uppercase">วัน</span>
        </div>
      </div>
      <div className="mt-auto">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[9px] font-[600] text-slate-400 uppercase leading-none">ใช้ {used}</span>
          <span className="text-[9px] font-[600] text-slate-300 uppercase leading-none">/ {total}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
          <div className={`h-full ${theme.color}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [staffIdInput, setStaffIdInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [linePicture, setLinePicture] = useState('');
  const [lineName, setLineName] = useState('');
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newReq, setNewReq] = useState({
    type: LeaveType.ANNUAL, startDate: '', endDate: '', reason: '', attachment: ''
  });

  // Role Checker - More flexible for Staff ID 2624 and others
  const checkIsManager = (role?: string) => {
    if (!role) return false;
    const r = role.toLowerCase().trim();
    // Inclusive matching for common manager roles
    return r.includes('supervisor') || 
           r.includes('hr') || 
           r.includes('manager') || 
           r.includes('lead') || 
           r.includes('admin') || 
           r.includes('head');
  };

  const fetchData = async (p: UserProfile) => {
    setLoading(true);
    try {
      const isManagerRole = checkIsManager(p.roleType);
      // Pass isManagerRole to get all requests if user is a manager
      const [b, r] = await Promise.all([
        SheetService.getBalances(p.staffId),
        SheetService.getRequests(p.staffId, isManagerRole)
      ]);
      if (b) setBalances(b.balances);
      setRequests(r || []);
    } catch (e) { 
      console.error('FetchData Error:', e); 
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const liff = (window as any).liff;
      if (liff) {
        try {
          await liff.init({ liffId: LIFF_ID });
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineName(profile.displayName);
            setLinePicture(profile.pictureUrl);
            setUserIdInput(profile.userId);
            const u = await SheetService.checkUserStatus(profile.userId);
            if (u) { setUser(u); fetchData(u); setIsLoggedIn(true); }
          }
        } catch (e) { console.error(e); }
      }
    };
    init();
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    const sid = staffIdInput.trim();
    if (!sid) { setLoginError('กรุณากรอกรหัสพนักงาน'); return; }
    setLoading(true);
    try {
      const p = await SheetService.getProfile(sid);
      if (!p) {
        setLoginError('ไม่พบรหัสพนักงานนี้ในระบบ');
        setLoading(false);
        return;
      }
      await SheetService.linkLineId(sid, userIdInput);
      const updatedUser = { ...p, lineUserId: userIdInput };
      setUser(updatedUser);
      fetchData(updatedUser);
      setIsLoggedIn(true);
    } catch (e) { 
      console.error('Login Error:', e);
      setLoginError('เกิดข้อผิดพลาดในการเชื่อมต่อ'); 
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewReq({ ...newReq, attachment: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (id: string, status: LeaveStatus, reason?: string) => {
    setLoading(true);
    const success = await SheetService.updateRequestStatus(id, status, user?.name, reason);
    if (success) { await fetchData(user!); }
    else { alert('เกิดข้อผิดพลาดในการดำเนินการ'); }
    setLoading(false);
  };

  const handleResubmit = (req: LeaveRequest) => {
    setNewReq({
      type: req.type,
      startDate: formatDate(req.startDate),
      endDate: formatDate(req.endDate),
      reason: req.reason,
      attachment: req.attachmentUrl || ''
    });
    setView('new');
  };

  const handleSubmit = async () => {
    const days = calculateDays(newReq.startDate, newReq.endDate);
    if (days <= 0) { alert('วันที่ไม่ถูกต้อง'); return; }
    if (!newReq.reason) { alert('กรุณาระบุเหตุผล'); return; }
    
    setLoading(true);
    try {
      const res = await SheetService.submitRequest({
        ...newReq, 
        staffId: user!.staffId, 
        staffName: user!.name, 
        siteId: user!.siteId, 
        totalDays: days, 
        appliedDate: new Date().toISOString().split('T')[0]
      });
      if (res.success) { 
        alert('ส่งใบลาสำเร็จ');
        await fetchData(user!); 
        setView('dashboard'); 
        setNewReq({type: LeaveType.ANNUAL, startDate: '', endDate: '', reason: '', attachment: ''}); 
      }
    } catch (e) { alert('เกิดข้อผิดพลาดในการส่งข้อมูล'); }
    setLoading(false);
  };

  const isEligibleManager = checkIsManager(user?.roleType);
  const myStaffId = String(user?.staffId || '').trim().toLowerCase();
  
  // Refined Filtering Logic to handle Team Pending items
  const myRequests = requests.filter(r => 
    String(r.staffId || '').trim().toLowerCase() === myStaffId
  );
  
  const teamPending = requests.filter(r => {
    const status = String(r.status || '').toLowerCase().trim();
    const staffId = String(r.staffId || '').trim().toLowerCase();
    // Must be Pending and NOT belong to the manager
    return status === 'pending' && staffId !== myStaffId;
  });

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm glass-card rounded-[3rem] shadow-2xl p-8">
        <div className="bg-white/50 rounded-[2.5rem] p-8 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100">
            {linePicture ? <img src={linePicture} className="w-full h-full object-cover" /> : <UserCircle size={80} className="text-slate-200 m-auto mt-2" />}
          </div>
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Leave System</p>
            <h2 className="text-xl font-black text-slate-800">{lineName || 'LINE User'}</h2>
          </div>
          <div className="w-full space-y-4 text-left">
            <input value={userIdInput} readOnly className="w-full bg-slate-50/80 text-slate-400 px-4 py-4 rounded-2xl font-bold text-[11px] ring-1 ring-slate-100 outline-none" />
            <input value={staffIdInput} onChange={e => setStaffIdInput(e.target.value)} className="w-full bg-white/80 px-4 py-4 rounded-2xl font-bold ring-1 ring-slate-100 focus:ring-blue-500 outline-none" placeholder="Staff ID (เช่น 2624)" />
            {loginError && <p className="text-[10px] font-bold text-rose-600 text-center">{loginError}</p>}
            <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
              {loading ? <Loader2 className="animate-spin" /> : 'LOGIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col pb-24 relative overflow-hidden">
      <header className="bg-white/90 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg"><Calendar size={16} strokeWidth={3} /></div>
          <div><h1 className="font-black text-slate-800 text-sm leading-none">LMS</h1><p className="text-[7px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Cloud System</p></div>
        </div>
        <div className="flex items-center gap-2">
           {isEligibleManager && <div className="px-2 py-1 bg-blue-50 rounded-md"><span className="text-[8px] font-black text-blue-600 uppercase">Manager Mode</span></div>}
           <button onClick={() => fetchData(user!)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><RefreshCcw size={16} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md bg-slate-50">
                  {linePicture && <img src={linePicture} className="w-full h-full object-cover" />}
                </div>
                <div><h2 className="text-base font-black text-slate-800 leading-tight">{user?.name}</h2><p className="text-blue-600 font-bold text-[8px] uppercase tracking-widest">{user?.position}</p></div>
              </div>
              <button onClick={() => setView('new')} className="bg-blue-600 text-white p-2.5 rounded-lg active:scale-90 transition-all shadow-lg shadow-blue-100"><PlusCircle size={20} /></button>
            </section>

            <div className="grid grid-cols-3 gap-2">
              {balances.length > 0 ? balances.map(b => <DashboardCard key={b.type} type={b.type} used={b.used} remain={b.remain} />) : (
                <div className="col-span-3 py-6 text-center text-[10px] text-slate-400 font-bold uppercase">กำลังโหลดสิทธิ์การลา...</div>
              )}
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">คำขอลาล่าสุด</h3>
                <button onClick={() => setView('history')} className="text-[8px] font-black text-blue-500 uppercase">ทั้งหมด</button>
              </div>
              <div className="space-y-2">
                {myRequests.length > 0 ? (
                  myRequests.slice(0, 3).map(req => (
                    <RequestCard key={req.id} req={req} user={user} onViewImage={setZoomImg} onAction={handleAction} onResubmit={handleResubmit} />
                  ))
                ) : (
                  <div className="py-10 text-center border border-dashed rounded-2xl text-[9px] text-slate-300 font-black uppercase">ไม่พบรายการลา</div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'approval' && isEligibleManager && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
             <header className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl"><ShieldCheck size={20} /></div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">รายการรออนุมัติ</h2>
            </header>
            <section className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white space-y-5 min-h-[400px]">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-[9px] uppercase tracking-widest opacity-60">ทีมงานของคุณ</h3>
                <span className="px-2 py-0.5 bg-blue-600 rounded-full text-[8px] font-black uppercase">{teamPending.length}</span>
              </div>
              <div className="space-y-3">
                {teamPending.length > 0 ? (
                  teamPending.map(req => (
                    <RequestCard key={req.id} req={req} user={user} isManagerView onViewImage={setZoomImg} onAction={handleAction} />
                  ))
                ) : (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ไม่มีรายการค้างพิจารณา</p>
                    <button onClick={() => fetchData(user!)} className="mt-4 flex items-center gap-2 mx-auto text-[8px] font-black text-blue-400 uppercase"><RefreshCcw size={10} /> รีเฟรชข้อมูล</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="p-2 bg-white rounded-xl text-slate-400"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-black text-slate-800">ประวัติการลา</h2>
            </header>
            <div className="space-y-3">
              {myRequests.map(req => (
                <RequestCard key={req.id} req={req} user={user} onViewImage={setZoomImg} onAction={handleAction} onResubmit={handleResubmit} />
              ))}
            </div>
          </div>
        )}

        {view === 'new' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <header className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="p-2 bg-white rounded-xl text-slate-400"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-black text-slate-800">ยื่นใบลา</h2>
            </header>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ประเภทการลา</label>
                <select value={newReq.type} onChange={e => setNewReq({...newReq, type: e.target.value as LeaveType})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none text-[13px] text-slate-700 ring-1 ring-slate-100">
                  {Object.values(LeaveType).map(t => <option key={t} value={t}>{getLeaveTheme(t).label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={newReq.startDate} onChange={e => setNewReq({...newReq, startDate:e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none text-[11px] ring-1 ring-slate-100" />
                <input type="date" value={newReq.endDate} onChange={e => setNewReq({...newReq, endDate:e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none text-[11px] ring-1 ring-slate-100" />
              </div>
              <textarea value={newReq.reason} onChange={e => setNewReq({...newReq, reason:e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none text-xs h-24 resize-none ring-1 ring-slate-100" placeholder="เหตุผลการลา..." />
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                {newReq.attachment ? <img src={newReq.attachment} className="w-full h-full object-cover" /> : <div className="text-center"><Camera size={20} className="m-auto text-slate-400 mb-2" /><p className="text-[9px] font-bold text-slate-400 uppercase">แนบรูปภาพ</p></div>}
              </div>
              <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest">
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> ส่งใบลา</>}
              </button>
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 flex flex-col items-center animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl mb-4">{linePicture && <img src={linePicture} className="w-full h-full object-cover" />}</div>
            <h2 className="text-lg font-black text-slate-800">{user?.name}</h2>
            <p className="text-blue-600 text-[8px] font-black uppercase tracking-widest bg-blue-50 px-4 py-1 rounded-full mt-2 mb-8">{user?.position}</p>
            <div className="w-full space-y-2 border-t pt-6">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl"><span className="text-[9px] font-black text-slate-400">Employee ID</span><span className="font-bold text-slate-700 text-[11px]">{user?.staffId}</span></div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl"><span className="text-[9px] font-black text-slate-400">Site</span><span className="font-bold text-slate-700 text-[11px]">{user?.siteId}</span></div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl"><span className="text-[9px] font-black text-slate-400">Role Status</span><span className={`font-bold text-[11px] uppercase ${isEligibleManager ? 'text-emerald-500' : 'text-slate-400'}`}>{user?.roleType} {isEligibleManager ? '(MANAGER)' : ''}</span></div>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="w-full mt-8 bg-rose-50 text-rose-500 font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"><LogOut size={16} /> Logout</button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t px-4 py-4 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-lg">
        {[
          { icon: Home, label: 'Home', v: 'dashboard' }, 
          { icon: History, label: 'History', v: 'history' }, 
          ...(isEligibleManager ? [{ icon: CheckSquare, label: 'Approval', v: 'approval' }] : []), 
          { icon: User, label: 'Profile', v: 'profile' }
        ].map(item => (
          <button key={item.v} onClick={() => setView(item.v)} className={`flex flex-col items-center gap-1.5 transition-all px-4 ${view === item.v ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
            <item.icon size={20} strokeWidth={view === item.v ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {zoomImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setZoomImg(null)}>
          <button className="absolute top-6 right-6 text-white"><X size={24} /></button>
          <img src={zoomImg} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10" alt="Full view" />
        </div>
      )}
    </div>
  );
};

export default App;
