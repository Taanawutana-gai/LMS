
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Home, PlusCircle, User, ShieldCheck, Clock, X, 
  ChevronLeft, Loader2, RefreshCcw, History, AlertCircle, 
  CheckCircle2, FileText, LogOut, Fingerprint, Search, MapPin, Hash, UserCircle,
  MoreHorizontal, Key, ScanFace, AlertTriangle
} from 'lucide-react';
import { 
  UserRole, LeaveType, LeaveStatus, LeaveRequest, LeaveBalance, UserProfile 
} from './types.ts';
import { SheetService } from './sheetService.ts';

const LIFF_ID = '2007509057-esMqbZzO';

const SLA_CONFIG: Record<string, number> = {
  [LeaveType.ANNUAL]: 5,
  [LeaveType.PERSONAL]: 5,
  [LeaveType.OTHER]: 5,
  [LeaveType.SICK]: 0,
  [LeaveType.MATERNITY]: 0,
  [LeaveType.PUBLIC_HOLIDAY]: 0,
  [LeaveType.WEEKLY_HOLIDAY_SWITCH]: 0,
  [LeaveType.LEAVE_WITHOUT_PAY]: 0,
};

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
  return <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest ${styles[status]}`}>{status}</span>;
};

const DashboardCard: React.FC<{ type: LeaveType; used: number; remain: number }> = ({ type, used, remain }) => {
  const theme = getLeaveTheme(type);
  const total = used + remain;
  const progress = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className={`relative overflow-hidden bg-white rounded-xl border-l-4 ${theme.border} shadow-sm transition-all active:scale-95 group h-[100px] flex flex-col justify-between p-3`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${theme.color}`} />
      <div className={`absolute inset-0 ${theme.bg} opacity-20 pointer-events-none`} />
      <div className="relative z-10">
        <h3 className={`text-[10px] font-[800] uppercase tracking-tight ${theme.text} leading-none mb-1 truncate`}>
          {theme.label}
        </h3>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[24px] font-[900] text-slate-800 leading-none">{remain}</span>
          <span className="text-[9px] font-[600] text-slate-400 uppercase">วัน</span>
        </div>
      </div>
      <div className="relative z-10 mt-auto">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[9px] font-[600] text-slate-400 uppercase leading-none">ใช้ {used}</span>
          <span className="text-[9px] font-[600] text-slate-300 uppercase leading-none">/ {total}</span>
        </div>
        <div className="w-full bg-slate-100/50 rounded-full h-1 overflow-hidden">
          <div className={`h-full ${theme.color} transition-all duration-1000 ease-out`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

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
  const [lineUserId, setLineUserId] = useState('');
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [newReq, setNewReq] = useState({
    type: LeaveType.ANNUAL, startDate: '', endDate: '', reason: '', attachment: ''
  });

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
            setLineUserId(profile.userId);
            setUserIdInput(profile.userId);
            const u = await SheetService.checkUserStatus(profile.userId);
            if (u) { setUser(u); fetchData(u); setIsLoggedIn(true); }
          }
        } catch (e) { console.error(e); }
      }
    };
    init();
  }, []);

  const fetchData = async (p: UserProfile) => {
    setLoading(true);
    try {
      const [b, r] = await Promise.all([
        SheetService.getBalances(p.staffId),
        SheetService.getRequests(p.staffId, p.roleType === UserRole.SUPERVISOR)
      ]);
      if (b) setBalances(b.balances);
      setRequests(r);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoginError(null);
    if (!staffIdInput.trim() || !userIdInput.trim()) {
      setLoginError('กรุณากรอกรหัสพนักงานให้ครบถ้วน');
      return;
    }
    
    setLoading(true);
    try {
      // 1. ตรวจสอบข้อมูลพนักงานจาก Staff ID
      const p = await SheetService.getProfile(staffIdInput);
      
      if (!p) {
        setLoginError('ไม่พบรหัสพนักงานนี้ในระบบฐานข้อมูล');
        setLoading(false);
        return;
      }

      // 2. ตรวจสอบว่ารหัสพนักงานนี้ถูกผูกไว้กับ LINE ID อื่นหรือไม่ (Security Check)
      // กรณี p.lineUserId มีค่า และไม่ตรงกับ LINE ID ปัจจุบัน
      if (p.lineUserId && p.lineUserId !== userIdInput) {
        setLoginError('รหัสพนักงานนี้ถูกลงทะเบียนด้วยบัญชี LINE อื่นไปแล้ว โปรดติดต่อ HR');
        setLoading(false);
        return;
      }

      // 3. หากผ่านการตรวจสอบ ให้ทำการผูก ID และเข้าสู่ระบบ
      await SheetService.linkLineId(staffIdInput, userIdInput);
      setUser({ ...p, lineUserId: userIdInput });
      fetchData(p);
      setIsLoggedIn(true);
    } catch (e) { 
      setLoginError('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
    }
    setLoading(false);
  };

  const getBalance = (type: LeaveType) => balances.find(b => b.type === type)?.remain || 0;
  const daysRequested = calculateDays(newReq.startDate, newReq.endDate);
  const balanceOk = daysRequested <= getBalance(newReq.type);
  const slaDays = SLA_CONFIG[newReq.type] || 0;
  const diffSla = newReq.startDate ? Math.ceil((new Date(newReq.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const slaOk = diffSla >= slaDays;

  const handleSubmit = async () => {
    if (!balanceOk || !slaOk || !newReq.reason) return;
    setLoading(true);
    const res = await SheetService.submitRequest({
      ...newReq, staffId: user!.staffId, staffName: user!.name, siteId: user!.siteId, totalDays: daysRequested, appliedDate: new Date().toISOString().split('T')[0]
    });
    if (res.success) { 
      alert('ส่งคำขอสำเร็จ'); 
      fetchData(user!); 
      setView('dashboard'); 
      setNewReq({type: LeaveType.ANNUAL, startDate: '', endDate: '', reason: '', attachment: ''}); 
    }
    setLoading(false);
  };

  const handleAction = async (id: string, status: LeaveStatus) => {
    setLoading(true);
    await SheetService.updateRequestStatus(id, status, user?.name);
    fetchData(user!);
    setLoading(false);
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm glass-card rounded-[3rem] shadow-2xl p-8">
        <div className="bg-white/50 rounded-[2.5rem] p-8 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100">
            {linePicture ? <img src={linePicture} className="w-full h-full object-cover" alt="Profile" /> : <UserCircle size={80} className="text-slate-200 m-auto mt-2" />}
          </div>
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Leave Management System</p>
            <h2 className="text-xl font-black text-slate-800">{lineName || 'LINE User'}</h2>
          </div>
          <div className="w-full space-y-4 text-left">
            <div className="relative group">
              <ScanFace className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                value={userIdInput} 
                readOnly
                className="w-full bg-slate-50/80 cursor-not-allowed text-slate-400 pl-12 pr-4 py-4 rounded-2xl font-bold border-none ring-1 ring-slate-100 outline-none transition-all text-[11px]" 
                placeholder="LINE User ID" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">MATCHED</span>
            </div>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                value={staffIdInput} 
                onChange={e=>{ setStaffIdInput(e.target.value); setLoginError(null); }} 
                className={`w-full bg-white/80 pl-12 pr-4 py-4 rounded-2xl font-bold border-none ring-1 ${loginError ? 'ring-rose-200 focus:ring-rose-500' : 'ring-slate-100 focus:ring-blue-500'} outline-none transition-all text-sm`} 
                placeholder="Staff ID (รหัสพนักงาน)" 
              />
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-rose-600 leading-tight">{loginError}</p>
              </div>
            )}

            <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-2">
              {loading ? <Loader2 className="animate-spin" /> : 'LOGIN'}
            </button>
            <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">SMC Property Soft</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl flex flex-col pb-24 relative overflow-hidden">
      <header className="bg-white/90 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Calendar size={16} strokeWidth={3} />
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-sm leading-none">LMS</h1>
            <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Cloud System</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {loading && <Loader2 className="animate-spin text-blue-600" size={16} />}
          <button onClick={()=>fetchData(user!)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
            <RefreshCcw size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md bg-slate-50">
                    {linePicture ? <img src={linePicture} className="w-full h-full object-cover" alt="Profile" /> : <UserCircle size={48} className="text-slate-100" />}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 leading-tight">{user?.name}</h2>
                    <p className="text-blue-600 font-bold text-[8px] uppercase tracking-widest mt-0.5">{user?.position}</p>
                  </div>
                </div>
                <button onClick={()=>setView('new')} className="bg-blue-600 text-white p-2.5 rounded-lg shadow-lg shadow-blue-100 active:scale-90 transition-all">
                  <PlusCircle size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-slate-300" />
                  <div><p className="text-[7px] font-black text-slate-300 uppercase leading-none mb-0.5">Site</p><p className="text-[10px] font-bold text-slate-600 leading-none">{user?.siteId}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-slate-300" />
                  <div><p className="text-[7px] font-black text-slate-300 uppercase leading-none mb-0.5">ID</p><p className="text-[10px] font-bold text-slate-600 leading-none">{user?.staffId}</p></div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">สิทธิการลาคงเหลือ</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {balances.map(b => (
                  <DashboardCard key={b.type} type={b.type} used={b.used} remain={b.remain} />
                ))}
              </div>
            </section>

            {user?.roleType === UserRole.SUPERVISOR && requests.some(r => r.status === LeaveStatus.PENDING && r.staffId !== user.staffId) && (
              <section className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white space-y-4 overflow-hidden relative">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-400" />
                    <h3 className="font-black text-[9px] uppercase tracking-widest">คำขอรออนุมัติ</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-600 rounded-full text-[8px] font-black uppercase">
                    {requests.filter(r => r.status === LeaveStatus.PENDING && r.staffId !== user.staffId).length} รายการ
                  </span>
                </div>
                <div className="space-y-2.5 relative z-10">
                  {requests.filter(r => r.status === LeaveStatus.PENDING && r.staffId !== user.staffId).map(req => (
                    <div key={req.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">{req.staffName}</p>
                          <h4 className="font-bold text-xs">{getLeaveTheme(req.type).label}</h4>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-medium">{req.startDate} - {req.endDate}</p>
                        </div>
                        {req.attachmentUrl && (
                          <button onClick={()=>setZoomImg(req.attachmentUrl!)} className="p-1.5 bg-white/5 rounded-lg text-slate-400">
                            <Search size={12} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>handleAction(req.id, LeaveStatus.APPROVED)} className="flex-1 bg-blue-600 text-white font-black py-2 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all">Approve</button>
                        <button onClick={()=>handleAction(req.id, LeaveStatus.REJECTED)} className="flex-1 bg-slate-800 text-white font-black py-2 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-3 bg-slate-200 rounded-full" />
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ประวัติย้อนหลัง</h3>
                </div>
                <button onClick={()=>setView('history')} className="text-[8px] font-black text-blue-500 uppercase tracking-widest">ดูทั้งหมด</button>
              </div>
              <div className="space-y-2">
                {requests.filter(r => r.staffId === user?.staffId).length > 0 ? (
                  requests.filter(r => r.staffId === user?.staffId).slice(0, 3).map(req => (
                    <div key={req.id} className="bg-white p-3.5 rounded-2xl border border-slate-50 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${getLeaveTheme(req.type).color}`} />
                        <div>
                          <h5 className="font-black text-[11px] text-slate-800">{getLeaveTheme(req.type).label}</h5>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{req.startDate}</p>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-[2rem] border border-dashed border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ยังไม่มีรายการ</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'new' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <header className="flex items-center gap-3">
              <button onClick={()=>setView('dashboard')} className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-black text-slate-800">ยื่นใบลา</h2>
            </header>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 space-y-5">
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">เลือกประเภท</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(LeaveType).map(t => (
                    <button key={t} onClick={()=>setNewReq({...newReq, type: t})} className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2.5 ${newReq.type === t ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50'}`}>
                      <div className={`w-2 h-2 rounded-full ${getLeaveTheme(t).color}`} />
                      <span className={`text-[9px] font-black text-left leading-tight ${newReq.type === t ? 'text-blue-700' : 'text-slate-400'}`}>{getLeaveTheme(t).label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">เริ่ม</label>
                  <input type="date" value={newReq.startDate} onChange={e=>setNewReq({...newReq, startDate:e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl font-bold border-none ring-1 ring-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-[11px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ถึง</label>
                  <input type="date" value={newReq.endDate} onChange={e=>setNewReq({...newReq, endDate:e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl font-bold border-none ring-1 ring-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-[11px]" />
                </div>
              </div>

              {daysRequested > 0 && (
                <div className={`p-3 rounded-xl border flex justify-between items-center ${balanceOk && slaOk ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-widest opacity-60">สรุปคำขอ</span>
                    <p className="font-black text-[10px]">ใช้ {daysRequested} วัน (เหลือ {getBalance(newReq.type)})</p>
                  </div>
                  {(!balanceOk || !slaOk) && <AlertCircle size={14} />}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ระบุเหตุผล</label>
                <textarea value={newReq.reason} onChange={e=>setNewReq({...newReq, reason:e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl font-bold border-none ring-1 ring-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-xs h-20 resize-none" placeholder="..." />
              </div>

              <button onClick={handleSubmit} disabled={!balanceOk || !slaOk || !newReq.reason || loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-100 disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px]">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> ส่งใบลา</>}
              </button>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="flex items-center gap-3">
              <button onClick={()=>setView('dashboard')} className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-black text-slate-800">ประวัติการลา</h2>
            </header>
            <div className="space-y-2.5">
              {requests.filter(r => r.staffId === user?.staffId).map(req => (
                <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${getLeaveTheme(req.type).color}`} />
                       <h4 className="font-black text-[11px]">{getLeaveTheme(req.type).label}</h4>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                     <span>{req.startDate} - {req.endDate}</span>
                     <span className="bg-slate-50 px-2 py-0.5 rounded-md font-black">{req.totalDays} วัน</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl mb-4">
                 {linePicture ? <img src={linePicture} className="w-full h-full object-cover" alt="Profile" /> : <UserCircle size={96} className="text-slate-100" />}
              </div>
              <h2 className="text-lg font-black text-slate-800">{user?.name}</h2>
              <p className="text-blue-600 text-[8px] font-black uppercase tracking-[0.2em] bg-blue-50 px-4 py-1 rounded-full mt-2 mb-8">{user?.position}</p>
              
              <div className="w-full space-y-2 border-t border-slate-50 pt-6">
                <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee ID</span>
                  <span className="font-bold text-slate-700 text-[11px]">{user?.staffId}</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Office Site</span>
                  <span className="font-bold text-slate-700 text-[11px]">{user?.siteId}</span>
                </div>
              </div>

              <button onClick={()=>setIsLoggedIn(false)} className="w-full mt-8 bg-rose-50 text-rose-500 font-black py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-around items-center z-50 rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        {[
          { icon: Home, label: 'หน้าแรก', v: 'dashboard' },
          { icon: History, label: 'ประวัติ', v: 'history' },
          { icon: User, label: 'โปรไฟล์', v: 'profile' }
        ].map(item => (
          <button key={item.v} onClick={()=>setView(item.v)} className={`flex flex-col items-center gap-1 transition-all ${view === item.v ? 'text-blue-600 scale-105' : 'text-slate-300'}`}>
            <item.icon size={22} strokeWidth={view === item.v ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {zoomImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={()=>setZoomImg(null)}>
          <button className="absolute top-6 right-6 text-white"><X size={24} /></button>
          <img src={zoomImg} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10" alt="Attachment" />
        </div>
      )}
    </div>
  );
};

export default App;
