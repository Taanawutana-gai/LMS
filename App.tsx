
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Home, PlusCircle, User, ChevronRight, ShieldCheck, Clock, X, 
  ChevronLeft, Info, Palmtree, Thermometer, UserCheck, Baby, Flag, Wallet, 
  MoreHorizontal, Loader2, RefreshCcw, History, Repeat, AlertCircle, 
  CheckCircle2, XCircle, FileText, LogOut, Fingerprint, Camera, Search, ZoomIn,
  MapPin, Hash
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
    case LeaveType.SICK: return { color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', icon: Thermometer, label: 'ลาป่วย' };
    case LeaveType.ANNUAL: return { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Palmtree, label: 'ลาพักร้อน' };
    case LeaveType.PERSONAL: return { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', icon: UserCheck, label: 'ลากิจ' };
    case LeaveType.PUBLIC_HOLIDAY: return { color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Flag, label: 'นักขัตฯ' };
    case LeaveType.MATERNITY: return { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', icon: Baby, label: 'ลาคลอด' };
    case LeaveType.LEAVE_WITHOUT_PAY: return { color: 'bg-slate-600', bg: 'bg-slate-50', text: 'text-slate-700', icon: Wallet, label: 'ไม่รับเงิน' };
    case LeaveType.WEEKLY_HOLIDAY_SWITCH: return { color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600', icon: Repeat, label: 'สลับหยุด' };
    case LeaveType.OTHER: return { color: 'bg-fuchsia-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', icon: MoreHorizontal, label: 'ลาอื่นๆ' };
    default: return { color: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-600', icon: MoreHorizontal, label: 'ลาอื่นๆ' };
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

const DashboardCard: React.FC<{ type: LeaveType; value: number; total: number; onClick: () => void }> = ({ type, value, total, onClick }) => {
  const theme = getLeaveTheme(type);
  const Icon = theme.icon;
  const progress = (total + value) > 0 ? (value / (value + total)) * 100 : 0;

  return (
    <div onClick={onClick} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all hover:border-blue-200 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-12 h-12 ${theme.bg} rounded-bl-full opacity-30 group-hover:scale-110 transition-transform`} />
      <div className="flex flex-col h-full justify-between gap-3">
        <div className={`w-8 h-8 rounded-lg ${theme.bg} ${theme.text} flex items-center justify-center shrink-0`}>
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-slate-400 text-[8px] font-black uppercase tracking-wider mb-1 truncate leading-tight">{theme.label}</h3>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-black text-slate-800 leading-none">{total}</span>
            <span className="text-[8px] font-bold text-slate-300 uppercase">วัน</span>
          </div>
        </div>
        <div className="w-full bg-slate-50 rounded-full h-1 overflow-hidden">
          <div className={`h-full ${theme.color}`} style={{ width: `${Math.min(100, progress)}%` }} />
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
  const [linePicture, setLinePicture] = useState('');
  const [lineName, setLineName] = useState('');
  const [lineUserId, setLineUserId] = useState('');
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  
  const [newReq, setNewReq] = useState({
    type: LeaveType.ANNUAL, startDate: '', endDate: '', reason: '', attachment: ''
  });

  useEffect(() => {
    const init = async () => {
      const liff = (window as any).liff;
      if (liff) {
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineName(profile.displayName);
          setLinePicture(profile.pictureUrl);
          setLineUserId(profile.userId);
          const u = await SheetService.checkUserStatus(profile.userId);
          if (u) { setUser(u); fetchData(u); setIsLoggedIn(true); }
        }
      }
    };
    init();
  }, []);

  const fetchData = async (p: UserProfile) => {
    setLoading(true);
    const [b, r] = await Promise.all([
      SheetService.getBalances(p.staffId),
      SheetService.getRequests(p.staffId, p.roleType === UserRole.SUPERVISOR)
    ]);
    if (b) setBalances(b.balances);
    setRequests(r);
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    const p = await SheetService.getProfile(staffIdInput);
    if (p) {
      await SheetService.linkLineId(staffIdInput, lineUserId);
      setUser(p); fetchData(p); setIsLoggedIn(true);
    } else alert('ไม่พบรหัสพนักงาน');
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

  const resubmit = (req: LeaveRequest) => {
    setNewReq({ type: req.type, startDate: req.startDate, endDate: req.endDate, reason: req.reason, attachment: '' });
    setView('new');
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white">
        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
              {linePicture ? <img src={linePicture} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-full h-full p-6 text-slate-300" />}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-60 mb-1">Identity Confirmation</p>
            <h2 className="text-xl font-bold text-slate-800">{lineName || 'LINE User'}</h2>
          </div>
          <div className="w-full space-y-4">
            <div className="relative">
              <Fingerprint className="absolute left-4 top-4 text-slate-300" size={20} />
              <input value={staffIdInput} onChange={e=>setStaffIdInput(e.target.value)} className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl font-bold border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" placeholder="รหัสพนักงาน" />
            </div>
            <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl flex flex-col pb-20 relative">
      {/* Floating Action Button */}
      {view === 'dashboard' && (
        <button 
          onClick={()=>setView('new')} 
          className="fixed right-6 bottom-24 bg-blue-600 text-white p-5 rounded-full shadow-2xl shadow-blue-400 active:scale-90 transition-all z-50 hover:bg-blue-700"
        >
          <PlusCircle size={32} />
        </button>
      )}

      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm"><Clock size={20} /></div>
          <div><h1 className="font-black text-slate-800 text-lg leading-none">LMS</h1><p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">Management System</p></div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
          <button onClick={()=>fetchData(user!)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><RefreshCcw size={20} /></button>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-y-auto overflow-x-hidden">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. ส่วนหัว (Greeting & Header) */}
            <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-50">
                  {linePicture ? <img src={linePicture} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full bg-slate-100" />}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-slate-800 leading-tight">สวัสดี, {user?.name}</h2>
                  <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">{user?.position}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center"><MapPin size={14} /></div>
                  <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-tight">Site ID</p><p className="text-xs font-bold text-slate-600">{user?.siteId}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center"><Hash size={14} /></div>
                  <div><p className="text-[8px] font-black text-slate-300 uppercase tracking-tight">Staff ID</p><p className="text-xs font-bold text-slate-600">{user?.staffId}</p></div>
                </div>
              </div>
            </section>

            {/* 2. สิทธิการลาคงเหลือ (Grid 3 Columns) */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">สิทธิการลาคงเหลือ</h3>
              <div className="grid grid-cols-3 gap-3">
                {balances.map(b => (
                  <DashboardCard 
                    key={b.type} 
                    type={b.type} 
                    value={b.used} 
                    total={b.remain} 
                    onClick={() => {}} 
                  />
                ))}
              </div>
            </section>

            {/* 3. ส่วนการอนุมัติ (Manager Section) */}
            {user?.roleType === UserRole.SUPERVISOR && requests.some(r => r.status === LeaveStatus.PENDING && r.staffId !== user.staffId) && (
              <section className="bg-blue-600 p-6 rounded-[2.5rem] shadow-xl text-white space-y-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} />
                  <h3 className="font-black text-sm uppercase tracking-widest">คำขอรออนุมัติ ({requests.filter(r => r.status === LeaveStatus.PENDING && r.staffId !== user.staffId).length} รายการ)</h3>
                </div>
                <div className="space-y-4">
                  {requests.filter(r => r.status === LeaveStatus.PENDING && r.staffId !== user.staffId).map(req => (
                    <div key={req.id} className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">{req.staffName}</p>
                          <h4 className="font-bold text-sm">{getLeaveTheme(req.type).label}</h4>
                          <p className="text-[10px] text-blue-200">{req.startDate} - {req.endDate} ({req.totalDays} วัน)</p>
                        </div>
                        {req.attachmentUrl && (
                          <button onClick={()=>setZoomImg(req.attachmentUrl!)} className="bg-white/20 p-2 rounded-xl text-white hover:bg-white/30 transition-colors">
                            <Search size={16} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={()=>handleAction(req.id, LeaveStatus.APPROVED)} className="flex-1 bg-white text-blue-600 font-black py-2.5 rounded-xl text-[10px] uppercase shadow-lg shadow-black/10 active:scale-95 transition-all">Approve</button>
                        <button onClick={()=>handleAction(req.id, LeaveStatus.REJECTED)} className="flex-1 bg-rose-500 text-white font-black py-2.5 rounded-xl text-[10px] uppercase shadow-lg shadow-black/10 active:scale-95 transition-all">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. รายการลาล่าสุด */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">รายการลาล่าสุด</h3>
              <div className="space-y-3">
                {requests.filter(r => r.staffId === user?.staffId).length > 0 ? (
                  requests.filter(r => r.staffId === user?.staffId).slice(0, 3).map(req => (
                    <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:border-blue-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${getLeaveTheme(req.type).bg} ${getLeaveTheme(req.type).text}`}>
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs">{getLeaveTheme(req.type).label}</h5>
                          <p className="text-[10px] text-slate-400">{req.startDate}</p>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase italic">ไม่มีข้อมูลการลาล่าสุด</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'new' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <header className="flex items-center gap-4">
              <button onClick={()=>setView('dashboard')} className="p-2 bg-white rounded-full shadow-sm text-slate-400">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-black text-slate-800">ยื่นใบลาใหม่</h2>
            </header>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ประเภทการลา</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(LeaveType).map(t => (
                    <button key={t} onClick={()=>setNewReq({...newReq, type: t})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newReq.type === t ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50'}`}>
                      <div className={`p-2 rounded-xl ${getLeaveTheme(t).bg} ${getLeaveTheme(t).text}`}><MoreHorizontal size={18} /></div>
                      <span className={`text-[9px] font-bold text-center leading-tight ${newReq.type === t ? 'text-blue-700' : 'text-slate-400'}`}>{getLeaveTheme(t).label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">เริ่ม</label><input type="date" value={newReq.startDate} onChange={e=>setNewReq({...newReq, startDate:e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 text-xs" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ถึง</label><input type="date" value={newReq.endDate} onChange={e=>setNewReq({...newReq, endDate:e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 text-xs" /></div>
              </div>

              {newReq.startDate && (
                <div className={`p-4 rounded-2xl border flex justify-between items-center ${slaOk ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                  <div className="flex items-center gap-2"><Clock size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{slaOk ? `แจ้งล่วงหน้า ${diffSla} วัน` : `ต้องแจ้งล่วงหน้าอย่างน้อย ${slaDays} วัน`}</span></div>
                  {slaOk && <CheckCircle2 size={20} />}
                </div>
              )}

              {daysRequested > 0 && (
                <div className={`p-4 rounded-2xl border flex justify-between items-center ${balanceOk ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                  <div className="flex flex-col"><span className="text-[9px] font-black uppercase tracking-widest opacity-60">สรุปวันลา</span><p className="font-bold text-sm">ขอใช้ {daysRequested} วัน / คงเหลือ {getBalance(newReq.type)} วัน</p></div>
                  {!balanceOk && <AlertCircle size={20} />}
                </div>
              )}

              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">เหตุผล</label><textarea value={newReq.reason} onChange={e=>setNewReq({...newReq, reason:e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none" placeholder="ระบุเหตุผลความจำเป็น..." /></div>

              <button onClick={handleSubmit} disabled={!balanceOk || !slaOk || !newReq.reason || loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> ยืนยันคำขอ</>}
              </button>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-slate-800">ประวัติการลา</h2>
            <div className="space-y-4">
              {requests.filter(r => r.staffId === user?.staffId).length > 0 ? (
                requests.filter(r => r.staffId === user?.staffId).map(req => (
                  <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${getLeaveTheme(req.type).bg} ${getLeaveTheme(req.type).text}`}><Calendar size={20} /></div>
                        <div><h4 className="font-bold text-sm">{getLeaveTheme(req.type).label}</h4><p className="text-[10px] text-slate-400">{req.appliedDate}</p></div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5"><Clock size={14} />{req.startDate} - {req.endDate}</div>
                      <span className="text-slate-800">{req.totalDays} วัน</span>
                    </div>
                    {req.status === LeaveStatus.PENDING && (
                      <button onClick={()=>handleAction(req.id, LeaveStatus.CANCELLED)} className="w-full bg-rose-50 text-rose-600 font-black py-3 rounded-xl text-[10px] uppercase active:scale-95 transition-all">ยกเลิกคำขอ</button>
                    )}
                    {req.status === LeaveStatus.REJECTED && (
                      <button onClick={()=>resubmit(req)} className="w-full bg-blue-50 text-blue-600 font-black py-3 rounded-xl text-[10px] uppercase active:scale-95 transition-all">ยื่นใหมีกครั้ง</button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <FileText size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase mt-4">ไม่มีประวัติการลา</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-white flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl">
                  {linePicture ? <img src={linePicture} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-full h-full p-8 text-slate-100" />}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white"><ShieldCheck size={20} /></div>
              </div>
              <h2 className="text-xl font-black text-slate-800">{user?.name}</h2>
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] bg-blue-50 px-5 py-1.5 rounded-full mt-2 mb-10">{user?.position}</p>
              
              <div className="w-full space-y-3 pt-8 border-t border-slate-50">
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Staff ID</span><span className="font-bold text-slate-700">{user?.staffId}</span></div>
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Site ID</span><span className="font-bold text-slate-700">{user?.siteId}</span></div>
              </div>

              <button onClick={()=>setIsLoggedIn(false)} className="w-full mt-10 bg-rose-50 text-rose-500 font-black py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-rose-100">
                <LogOut size={20} /> ออกจากระบบ
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-5 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          { icon: Home, label: 'หน้าแรก', v: 'dashboard' },
          { icon: History, label: 'ประวัติ', v: 'history' },
          { icon: User, label: 'โปรไฟล์', v: 'profile' }
        ].map(item => (
          <button key={item.v} onClick={()=>setView(item.v)} className={`flex flex-col items-center gap-1 transition-all ${view === item.v ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
            <item.icon size={24} strokeWidth={view === item.v ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Zoom Modal */}
      {zoomImg && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={()=>setZoomImg(null)}>
          <button className="absolute top-8 right-8 text-white"><X size={32} /></button>
          <img src={zoomImg} className="max-w-full max-h-full rounded-2xl shadow-2xl" alt="Attachment" />
        </div>
      )}
    </div>
  );
};

export default App;
