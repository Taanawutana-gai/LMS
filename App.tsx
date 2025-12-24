
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
    <div className={`relative overflow-hidden p-4 rounded-2xl border transition-all ${isManagerView ? 'bg-white/5 border-white/5 shadow-inner' : 'bg-white border-slate-50 shadow-sm'} space-y-3`}>
      {isManagerView && <div className={`absolute top-0 left-0 w-1 h-full ${theme.color}`} />}
      
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${theme.color}`} />
          <div>
            {isManagerView && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">{req.staffName}</span>
                <span className="text-[7px] font-bold text-slate-500 bg-white/5 px-1 rounded uppercase">{req.siteId}</span>
              </div>
            )}
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
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
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
                       Confirm Reject
                     </button>
                     <button onClick={() => setShowRejectInput(false)} className="px-3 bg-white/10 text-white rounded-lg active:scale-95 transition-all"><X size={14}/></button>
                   </div>
                </div>
              ) : (
                <div className="flex gap-2 animate-in fade-in duration-300">
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

  const checkIsManager = (role?: string) => {
    if (!role) return false;
    const r = role.toLowerCase().trim();
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
        } catch (e) { console.error('LIFF Init Error:', e); }
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
    else { alert('ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง'); }
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
  const mySiteId = String(user?.siteId || '').trim().toLowerCase();
  
  const myRequests = requests.filter(r => 
    String(r.staffId || '').trim().toLowerCase() === myStaffId
  );
  
  const teamPending = requests.filter(r => {
    const rStatus = String(r.status || '').toLowerCase().trim();
    const rStaffId = String(r.staffId || '').trim().toLowerCase();
    const rSiteId = String(r.siteId || '').trim().toLowerCase();
    return rStatus === 'pending' && rStaffId !== myStaffId && rSiteId === mySiteId;
  });

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-sm glass-card rounded-[3rem] shadow-2xl p-8 border border-white/40">
        <div className="bg-white/50 rounded-[2.5rem] p-8 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
            {linePicture ? <img src={linePicture} className="w-full h-full object-cover" /> : <UserCircle size={64} className="text-slate-200" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">LMS</p>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{lineName || 'LINE User'}</h2>
          </div>
          
          <div className="w-full space-y-4 text-left">
            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-slate-400 uppercase ml-1">User ID</label>
               <div className="flex items-center gap-2 w-full bg-slate-50/80 text-slate-400 px-4 py-3 rounded-2xl font-bold text-[9px] ring-1 ring-slate-100/50">
                  <Key size={12} className="text-blue-400" />
                  <span className="truncate">{userIdInput}</span>
               </div>
            </div>
            
            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Staff ID</label>
               <div className="relative">
                 <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                 <input 
                  value={staffIdInput} 
                  onChange={e => setStaffIdInput(e.target.value)} 
                  className="w-full bg-white pl-10 pr-4 py-4 rounded-2xl font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all" 
                  placeholder="ป้อนรหัสพนักงาน" 
                 />
               </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 justify-center bg-rose-50 p-2 rounded-xl">
                <AlertCircle size={12} className="text-rose-500" />
                <p className="text-[9px] font-bold text-rose-600">{loginError}</p>
              </div>
            )}

            <button 
              onClick={handleLogin} 
              disabled={loading} 
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><ScanFace size={16} /> Login to System</>}
            </button>
          </div>
          
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">SMC Property Soft</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col pb-24 relative overflow-hidden font-sans">
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg"><Calendar size={16} strokeWidth={3} /></div>
          <div><h1 className="font-black text-slate-800 text-sm leading-none tracking-tight">LMS</h1><p className="text-[7px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Workflow Online</p></div>
        </div>
        <div className="flex items-center gap-2">
           {isEligibleManager && (
             <div className="px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100 animate-in fade-in zoom-in duration-500">
               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Manager Mode</span>
             </div>
           )}
           <button onClick={() => fetchData(user!)} className={`p-2 rounded-xl transition-all ${loading ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:text-blue-600 hover:bg-slate-50'}`}>
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-y-auto space-y-6">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <section className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-50">
                  {linePicture && <img src={linePicture} className="w-full h-full object-cover" />}
                </div>
                <div><h2 className="text-base font-black text-slate-800 leading-tight tracking-tight">{user?.name}</h2><p className="text-blue-600 font-bold text-[8px] uppercase tracking-widest mt-0.5">{user?.position}</p></div>
              </div>
              <button onClick={() => setView('new')} className="bg-blue-600 text-white p-3 rounded-xl active:scale-90 transition-all shadow-lg shadow-blue-100 flex items-center justify-center" title="ยื่นใบลาส่วนตัว">
                <PlusCircle size={20} />
              </button>
            </section>

            <div className="grid grid-cols-3 gap-2.5">
              {balances.length > 0 ? balances.map(b => <DashboardCard key={b.type} type={b.type} used={b.used} remain={b.remain} />) : (
                <div className="col-span-3 py-8 text-center bg-white/50 border border-dashed rounded-3xl text-[9px] text-slate-300 font-black uppercase tracking-widest">กำลังดึงข้อมูลสิทธิ์การลา...</div>
              )}
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">รายการลาล่าสุด</h3>
                <button onClick={() => setView('history')} className="text-[8px] font-black text-blue-500 uppercase tracking-widest hover:underline">ดูทั้งหมด</button>
              </div>
              <div className="space-y-3">
                {myRequests.length > 0 ? (
                  myRequests.slice(0, 3).map(req => (
                    <RequestCard key={req.id} req={req} user={user} onViewImage={setZoomImg} onAction={handleAction} onResubmit={handleResubmit} />
                  ))
                ) : (
                  <div className="py-12 text-center bg-white/40 border border-dashed rounded-[2.5rem] flex flex-col items-center gap-3">
                    <History size={24} className="text-slate-200" />
                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">ไม่พบประวัติการลา</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'approval' && isEligibleManager && (
          <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
             <header className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl"><ShieldCheck size={20} /></div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">รายการรออนุมัติ</h2>
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">Site Scope: {user?.siteId}</p>
              </div>
            </header>
            <section className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl text-white space-y-6 min-h-[450px] relative border border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-[9px] uppercase tracking-[0.3em] text-slate-400">Team Pending</h3>
                <span className="px-2.5 py-1 bg-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">{teamPending.length} รายการ</span>
              </div>
              <div className="space-y-4">
                {teamPending.length > 0 ? (
                  teamPending.map(req => (
                    <RequestCard key={req.id} req={req} user={user} isManagerView onViewImage={setZoomImg} onAction={handleAction} />
                  ))
                ) : (
                  <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-500"><CheckCircle2 size={24} /></div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ไม่มีรายการค้างพิจารณา</p>
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter italic">ในสาขา {user?.siteId} ของคุณ</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="p-2 bg-white rounded-xl text-slate-400 shadow-sm active:scale-90 transition-all"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">ประวัติการลาทั้งหมด</h2>
            </header>
            <div className="space-y-3">
              {myRequests.length > 0 ? (
                myRequests.map(req => (
                  <RequestCard key={req.id} req={req} user={user} onViewImage={setZoomImg} onAction={handleAction} onResubmit={handleResubmit} />
                ))
              ) : (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed text-[10px] font-black text-slate-300 uppercase">ไม่พบข้อมูล</div>
              )}
            </div>
          </div>
        )}

        {view === 'new' && (
          <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
            <header className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="p-2 bg-white rounded-xl text-slate-400 shadow-sm"><ChevronLeft size={20} /></button>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">ยื่นใบลาใหม่</h2>
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Personal Leave Request</p>
              </div>
            </header>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                 <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                   บันทึกการลาสำหรับ: <span className="font-black">{user?.name}</span> ({user?.staffId})
                 </p>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">ประเภทการลา</label>
                <select value={newReq.type} onChange={e => setNewReq({...newReq, type: e.target.value as LeaveType})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-[12px] text-slate-700 ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                  {Object.values(LeaveType).map(t => <option key={t} value={t}>{getLeaveTheme(t).label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">วันเริ่ม</label>
                  <input type="date" value={newReq.startDate} onChange={e => setNewReq({...newReq, startDate:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-[11px] ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">วันสิ้นสุด</label>
                  <input type="date" value={newReq.endDate} onChange={e => setNewReq({...newReq, endDate:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-[11px] ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">เหตุผลการลา</label>
                <textarea value={newReq.reason} onChange={e => setNewReq({...newReq, reason:e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-xs h-24 resize-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500" placeholder="ระบุเหตุผลในการลาครั้งนี้..." />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">แนบรูปภาพ / หลักฐาน</label>
                 <div onClick={() => fileInputRef.current?.click()} className="w-full h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:bg-slate-100 transition-all group">
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                   {newReq.attachment ? (
                     <div className="relative w-full h-full animate-in zoom-in duration-300">
                        <img src={newReq.attachment} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase">เปลี่ยนรูปภาพ</div>
                     </div>
                   ) : (
                     <div className="text-center">
                       <Camera size={24} className="m-auto text-slate-300 mb-2 group-hover:scale-110 transition-transform" />
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ถ่ายรูปหรือเลือกหลักฐาน</p>
                     </div>
                   )}
                 </div>
              </div>
              <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest disabled:opacity-50 mt-4">
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> ส่งใบลาเข้าสู่ระบบ</>}
              </button>
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl mb-6 relative">
              {linePicture ? <img src={linePicture} className="w-full h-full object-cover" /> : <UserCircle size={112} className="text-slate-100" />}
              {isEligibleManager && <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[7px] font-black uppercase py-1 text-center tracking-widest">Manager</div>}
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{user?.name}</h2>
            <p className="text-blue-600 text-[9px] font-black uppercase tracking-widest bg-blue-50 px-5 py-1.5 rounded-full mt-3 mb-10">{user?.position}</p>
            
            <div className="w-full space-y-3 border-t border-slate-50 pt-8">
              <div className="flex justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50 group hover:border-blue-100 transition-colors">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</span>
                <span className="font-black text-slate-700 text-[12px]">{user?.staffId}</span>
              </div>
              <div className="flex justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office Site</span>
                <span className="font-black text-slate-700 text-[12px] uppercase">{user?.siteId}</span>
              </div>
              <div className="flex justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role</span>
                <span className={`font-black text-[10px] uppercase tracking-tighter ${isEligibleManager ? 'text-emerald-500' : 'text-slate-500'}`}>
                   {user?.roleType} {isEligibleManager && '• Authorized'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="w-full mt-10 bg-rose-50 text-rose-500 font-black py-4.5 rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest hover:bg-rose-100 transition-all active:scale-95"><LogOut size={16} /> Logout System</button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-4 py-5 flex justify-around items-center z-50 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        {[
          { icon: Home, label: 'หน้าแรก', v: 'dashboard' }, 
          { icon: History, label: 'ประวัติ', v: 'history' }, 
          ...(isEligibleManager ? [{ icon: CheckSquare, label: 'อนุมัติ', v: 'approval' }] : []), 
          { icon: User, label: 'ฉัน', v: 'profile' }
        ].map(item => (
          <button key={item.v} onClick={() => setView(item.v)} className={`flex flex-col items-center gap-1.5 transition-all px-4 group relative ${view === item.v ? 'text-blue-600' : 'text-slate-300 hover:text-blue-600 hover:bg-slate-50'}`}>
            {view === item.v && <div className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full animate-bounce" />}
            <item.icon size={22} strokeWidth={view === item.v ? 3 : 2} className={`transition-transform duration-300 ${view === item.v ? 'scale-110' : 'group-active:scale-90'}`} />
            <span className={`text-[8px] font-black uppercase tracking-[0.15em] transition-opacity ${view === item.v ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {zoomImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setZoomImg(null)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2 bg-white/10 rounded-full"><X size={24} /></button>
          <img src={zoomImg} className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl border border-white/10 animate-in zoom-in duration-300" alt="Full view" />
          <div className="absolute bottom-12 text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">แตะเพื่อย้อนกลับ</div>
        </div>
      )}
    </div>
  );
};

export default App;
