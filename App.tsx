
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Home, 
  PlusCircle, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  X, 
  ChevronLeft, 
  Info, 
  Palmtree, 
  Thermometer, 
  UserCheck, 
  Baby, 
  Flag, 
  Wallet, 
  MoreHorizontal,
  Loader2,
  RefreshCcw,
  History,
  Repeat,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  UserRole, 
  LeaveType, 
  LeaveStatus, 
  LeaveRequest, 
  LeaveBalance, 
  UserProfile 
} from './types';
import { SheetService } from './sheetService';

// --- Constants ---
const LIFF_ID = '2007509057-esMqbZzO';

// --- Helper Functions ---
const getLeaveTheme = (type: LeaveType) => {
  switch (type) {
    case LeaveType.SICK: 
      return { color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', icon: Thermometer, label: 'ลาป่วย' };
    case LeaveType.ANNUAL: 
      return { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Palmtree, label: 'ลาพักร้อน' };
    case LeaveType.PERSONAL: 
      return { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', icon: UserCheck, label: 'ลากิจ' };
    case LeaveType.PUBLIC_HOLIDAY: 
      return { color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Flag, label: 'วันหยุด' };
    case LeaveType.MATERNITY: 
      return { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', icon: Baby, label: 'ลาคลอด' };
    case LeaveType.LEAVE_WITHOUT_PAY: 
      return { color: 'bg-slate-600', bg: 'bg-slate-50', text: 'text-slate-700', icon: Wallet, label: 'ไม่รับค่าจ้าง' };
    case LeaveType.WEEKLY_HOLIDAY_SWITCH:
      return { color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600', icon: Repeat, label: 'สลับวันหยุด' };
    case LeaveType.OTHER: 
      return { color: 'bg-fuchsia-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', icon: MoreHorizontal, label: 'ลาอื่นๆ' };
    default: 
      return { color: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-600', icon: Info, label: 'อื่นๆ' };
  }
};

const calculateDays = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
};

// --- UI Components ---
const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const styles = {
    [LeaveStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [LeaveStatus.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [LeaveStatus.REJECTED]: 'bg-rose-100 text-rose-700 border-rose-200',
    [LeaveStatus.CANCELLED]: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
};

const DashboardCard: React.FC<{ type: LeaveType; value: number; total: number; onClick: () => void }> = ({ type, value, total, onClick }) => {
  const isSwitch = type === LeaveType.WEEKLY_HOLIDAY_SWITCH;
  const theme = getLeaveTheme(type);
  const Icon = theme.icon;
  const progress = (total + value) > 0 ? (value / (value + total)) * 100 : 0;

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all hover:border-slate-300 group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text}`}>
          <Icon size={20} />
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </div>

      <div>
        <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 truncate">
          {theme.label}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">{isSwitch ? value : total}</span>
          <span className="text-[10px] font-medium text-slate-400">
            {isSwitch ? 'รายการ' : 'วันคงเหลือ'}
          </span>
        </div>
      </div>

      {!isSwitch && (
        <div className="mt-4 space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full ${theme.color} transition-all duration-700`} style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <div className="text-[9px] font-bold text-slate-400 uppercase">
            ใช้ไป {value} วัน
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Application ---
const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('dashboard');
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [staffIdInput, setStaffIdInput] = useState('');
  const [lineUserId, setLineUserId] = useState('Wait for LIFF...');
  const [linePicture, setLinePicture] = useState('');

  // LIFF Initialization
  useEffect(() => {
    const initLiff = async () => {
      try {
        // @ts-ignore
        await liff.init({ liffId: LIFF_ID });
        // @ts-ignore
        if (liff.isLoggedIn()) {
          // @ts-ignore
          const profile = await liff.getProfile();
          setLineUserId(profile.userId);
          setLinePicture(profile.pictureUrl || '');
        } else {
          // @ts-ignore
          liff.login();
        }
      } catch (err) {
        console.error('LIFF Init failed', err);
        setLineUserId('LINE_MOCK_USER_ID');
      }
    };
    initLiff();
  }, []);

  const handleLogin = async () => {
    if (!staffIdInput) return;
    setLoading(true);
    try {
      const profile = await SheetService.getProfile(staffIdInput);
      if (profile) {
        setUser(profile);
        const rawBalances = await SheetService.getBalances(staffIdInput);
        if (rawBalances) setBalances(rawBalances.balances);
        const reqs = await SheetService.getRequests(staffIdInput, profile.roleType === UserRole.SUPERVISOR);
        setRequests(reqs);
        setIsLoggedIn(true);
      } else {
        alert('ไม่พบรหัสพนักงานในระบบ (Employee_DB)');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const syncData = async (staffId: string) => {
    setLoading(true);
    try {
      const rawBalances = await SheetService.getBalances(staffId);
      if (rawBalances) setBalances(rawBalances.balances);
      const reqs = await SheetService.getRequests(staffId, user?.roleType === UserRole.SUPERVISOR);
      setRequests(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: { type: LeaveType, startDate: string, endDate: string, reason: string }) => {
    if (!user) return;
    setLoading(true);
    const totalDays = calculateDays(data.startDate, data.endDate);
    const request: Partial<LeaveRequest> = {
      appliedDate: new Date().toISOString().split('T')[0],
      staffId: user.staffId,
      staffName: user.name,
      siteId: user.siteId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: totalDays,
      reason: data.reason,
      status: LeaveStatus.PENDING
    };

    try {
      const res = await SheetService.submitRequest(request);
      if (res.success) {
        alert('ส่งคำขอลาสำเร็จ');
        await syncData(user.staffId);
        setView('dashboard');
      } else {
        alert('ไม่สามารถส่งคำขอได้ กรุณาลองใหม่');
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, status: LeaveStatus) => {
    if (!user) return;
    setLoading(true);
    try {
      const approverName = user.roleType === UserRole.SUPERVISOR ? user.name : undefined;
      const success = await SheetService.updateRequestStatus(requestId, status, approverName);
      if (success) {
        await syncData(user.staffId);
      } else {
        alert('การดำเนินการไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4">
      {/* GeoClock Login Card */}
      <div className="w-full max-w-[400px] bg-white rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] px-10 py-12 relative flex flex-col items-center">
        
        {/* Profile Avatar Top Right */}
        <div className="absolute top-10 right-10 w-[54px] h-[54px] rounded-full border-[3.5px] border-[#d1fae5] p-[2px] overflow-hidden">
          {linePicture ? (
            <img src={linePicture} alt="LINE Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full bg-emerald-50 rounded-full flex items-center justify-center">
              <User className="text-emerald-300" size={24} />
            </div>
          )}
        </div>

        {/* Brand Icon */}
        <div className="mt-8 mb-8">
          <div className="w-[86px] h-[86px] bg-[#2563eb] rounded-[2.3rem] flex items-center justify-center shadow-2xl shadow-blue-100">
            <Clock size={42} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title Section */}
        <h1 className="text-[42px] font-bold text-[#1e293b] tracking-tight leading-none">GeoClock</h1>
        <p className="text-[#94a3b8] text-[15.5px] font-medium mt-1.5 mb-14">Secure Attendance System</p>

        {/* Form Fields */}
        <div className="w-full space-y-7">
          
          {/* USER ID (LINE ID) */}
          <div className="space-y-2">
            <label className="text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] ml-1">USER ID</label>
            <div className="w-full bg-[#f1f5f9] border-none px-6 py-[19px] rounded-2xl text-[13px] text-[#64748b] font-medium truncate">
              {lineUserId}
            </div>
          </div>

          {/* STAFF ID */}
          <div className="space-y-2">
            <label className="text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] ml-1">STAFF ID</label>
            <input 
              type="text"
              className="w-full bg-[#f1f5f9] border-none px-6 py-[19px] rounded-2xl text-[#1e293b] outline-none font-bold placeholder:text-[#cbd5e1] placeholder:font-medium text-[16px] transition-all focus:bg-[#ecf2ff]"
              placeholder="กรอกรหัสพนักงาน"
              value={staffIdInput}
              onChange={(e) => setStaffIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Log In Button */}
          <button 
            onClick={handleLogin}
            disabled={loading || !staffIdInput}
            className="w-full bg-[#2563eb] text-white font-bold py-[21px] rounded-[1.25rem] shadow-[0_16px_36px_-6px_rgba(37,99,235,0.4)] hover:bg-[#1d4ed8] active:scale-[0.97] transition-all mt-6 flex items-center justify-center text-[18px] tracking-wide"
          >
            {loading ? <Loader2 className="animate-spin" size={26} /> : 'Log In'}
          </button>
        </div>

        {/* Footer Brand */}
        <div className="mt-16 text-[10px] font-bold text-[#cbd5e1] uppercase tracking-[0.28em] text-center">
          MANAGEMENT BY SMC PROPERTY SOFT
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative flex flex-col">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-blue-600 font-bold text-xs uppercase tracking-widest animate-pulse">กำลังซิงค์ข้อมูล...</p>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white">
             <Clock size={20} />
           </div>
           <div>
              <span className="block font-bold text-slate-800 text-sm">LMS ONLINE</span>
              <span className="text-[10px] text-blue-500 font-bold">{user?.siteId}</span>
           </div>
        </div>
        <button onClick={() => syncData(user!.staffId)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {selectedLeaveType ? (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <header className="flex items-center gap-3">
              <button onClick={() => setSelectedLeaveType(null)} className="p-2 hover:bg-white rounded-full"><ChevronLeft size={24} /></button>
              <h1 className="text-xl font-bold">{getLeaveTheme(selectedLeaveType).label}</h1>
            </header>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">วันคงเหลือปัจจุบัน</p>
              <h2 className="text-6xl font-black text-slate-800 tracking-tighter">
                {balances.find(b => b.type === selectedLeaveType)?.remain || 0}
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-2">วัน</p>
            </div>
            <div className="space-y-3">
               <h3 className="text-xs font-bold text-slate-400 uppercase px-1">ประวัติรายการ</h3>
               {requests.filter(r => r.type === selectedLeaveType).map(req => (
                 <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-50 flex justify-between items-center shadow-sm">
                   <div>
                     <p className="text-sm font-bold text-slate-800">{req.startDate}</p>
                     <p className="text-[10px] text-slate-400">ลา {req.totalDays} วัน</p>
                   </div>
                   <StatusBadge status={req.status} />
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">สวัสดี, {user?.name.split(' ')[0]}</h1>
                    <p className="text-slate-500 text-xs">{user?.position}</p>
                  </div>
                  <button onClick={() => setView('new')} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all">
                    <PlusCircle size={28} />
                  </button>
                </header>

                <section className="grid grid-cols-2 gap-4">
                  {balances.map(b => (
                    <DashboardCard key={b.type} type={b.type} value={b.used} total={b.remain} onClick={() => setSelectedLeaveType(b.type)} />
                  ))}
                </section>

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">รายการล่าสุด</h2>
                    <button className="text-blue-600 text-xs font-bold" onClick={() => setView('history')}>ดูทั้งหมด</button>
                  </div>
                  <div className="space-y-3">
                    {requests.slice(0, 3).map(req => (
                      <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getLeaveTheme(req.type).bg} ${getLeaveTheme(req.type).text}`}>
                            <Calendar size={18} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{req.type.split(' (')[0]}</h4>
                            <p className="text-[10px] text-slate-400">{req.startDate}</p>
                          </div>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
            
            {view === 'new' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <header className="flex items-center gap-3">
                  <button onClick={() => setView('dashboard')} className="p-2 hover:bg-white rounded-full"><ChevronLeft size={24} /></button>
                  <h1 className="text-xl font-bold">ยื่นใบลาใหม่</h1>
                </header>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">ประเภทการลา</label>
                      <select id="leave-type-select" className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-blue-600">
                        {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">วันที่เริ่ม</label>
                        <input id="start-date" type="date" className="w-full bg-slate-50 p-4 rounded-xl font-bold text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">วันที่สิ้นสุด</label>
                        <input id="end-date" type="date" className="w-full bg-slate-50 p-4 rounded-xl font-bold text-xs" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">เหตุผลการลา</label>
                      <textarea id="leave-reason" className="w-full bg-slate-50 p-4 rounded-xl text-sm min-h-[100px]" placeholder="ระบุเหตุผลประกอบ..." />
                   </div>
                   <button 
                    onClick={() => {
                      const type = (document.getElementById('leave-type-select') as HTMLSelectElement).value as LeaveType;
                      const startDate = (document.getElementById('start-date') as HTMLInputElement).value;
                      const endDate = (document.getElementById('end-date') as HTMLInputElement).value;
                      const reason = (document.getElementById('leave-reason') as HTMLTextAreaElement).value;
                      if(startDate && endDate && reason) handleCreate({ type, startDate, endDate, reason });
                      else alert('กรุณากรอกข้อมูลให้ครบ');
                    }}
                    className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                  >
                    ยืนยันการส่งข้อมูล
                  </button>
                </div>
              </div>
            )}

            {view === 'history' && (
              <div className="space-y-6 animate-in fade-in">
                 <h1 className="text-xl font-bold">ประวัติรายการ</h1>
                 <div className="space-y-4">
                   {requests.map(req => (
                     <div key={req.id} className="bg-white p-5 rounded-3xl border border-slate-50 space-y-4 shadow-sm">
                       <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className={`p-2.5 rounded-xl ${getLeaveTheme(req.type).bg} ${getLeaveTheme(req.type).text}`}>
                               <Calendar size={22} />
                            </div>
                            <div>
                               <h3 className="font-bold text-slate-800 text-sm">{req.type.split(' (')[0]}</h3>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.startDate} — {req.totalDays} วัน</p>
                            </div>
                          </div>
                          <StatusBadge status={req.status} />
                       </div>
                       <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">"{req.reason}"</p>
                       {req.status === LeaveStatus.PENDING && (
                         <button onClick={() => handleAction(req.id, LeaveStatus.CANCELLED)} className="w-full py-2.5 text-[10px] font-bold text-rose-500 uppercase border border-rose-50 rounded-xl hover:bg-rose-50">ยกเลิกคำขอ</button>
                       )}
                       {req.approverReason && (
                          <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                             <p className="text-[9px] font-bold text-indigo-600 uppercase mb-1">ความเห็นหัวหน้า: {req.approver}</p>
                             <p className="text-xs text-slate-700">{req.approverReason}</p>
                          </div>
                       )}
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {view === 'manager' && (
              <div className="space-y-6 animate-in fade-in">
                <h1 className="text-xl font-bold flex items-center gap-2">รอการอนุมัติ ({requests.filter(r => r.status === LeaveStatus.PENDING).length})</h1>
                <div className="space-y-4">
                  {requests.filter(r => r.status === LeaveStatus.PENDING).map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.staffId}`} alt="avatar" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 text-sm">{req.staffName}</h3>
                              <p className="text-[10px] text-blue-500 font-bold">{req.siteId}</p>
                            </div>
                         </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{req.type.split(' (')[0]}</span>
                           <span className="text-sm font-bold text-blue-600">{req.totalDays} วัน</span>
                         </div>
                         <p className="text-[10px] text-slate-500 font-medium">{req.startDate} — {req.endDate}</p>
                      </div>
                      <p className="text-xs text-slate-500 italic">"{req.reason}"</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(req.id, LeaveStatus.REJECTED)} className="flex-1 p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">ปฏิเสธ</button>
                        <button onClick={() => handleAction(req.id, LeaveStatus.APPROVED)} className="flex-[2] bg-blue-600 text-white p-3 rounded-xl text-xs font-bold shadow-lg">อนุมัติ</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'profile' && (
              <div className="space-y-8 text-center pt-4">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <div className="w-28 h-28 bg-slate-50 rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-inner overflow-hidden border-2 border-white">
                    <img src={linePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.staffId}`} alt="avatar" className="rounded-full" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">{user?.name}</h2>
                  <p className="text-blue-600 font-bold text-xs uppercase tracking-wider mt-2 bg-blue-50 px-4 py-1.5 rounded-full inline-block">{user?.position}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8 text-left">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">รหัสพนักงาน</p>
                      <p className="font-bold text-slate-800 text-xs">{user?.staffId}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">หน่วยงาน</p>
                      <p className="font-bold text-slate-800 text-xs">{user?.siteId}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsLoggedIn(false)} className="w-full py-4 text-rose-500 font-bold text-sm bg-white border border-rose-100 rounded-[1.5rem] shadow-sm active:scale-95 transition-all">ออกจากระบบ</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 px-8 py-4 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        {[
          { icon: Home, label: 'หน้าหลัก', view: 'dashboard' },
          { icon: History, label: 'ประวัติ', view: 'history' },
          ...(user?.roleType === UserRole.SUPERVISOR ? [{ icon: ShieldCheck, label: 'อนุมัติ', view: 'manager' }] : []),
          { icon: User, label: 'บัญชี', view: 'profile' }
        ].map((item) => (
          <button 
            key={item.view}
            className={`flex flex-col items-center gap-1 transition-all ${view === item.view ? 'text-blue-600' : 'text-[#cbd5e1]'}`}
            onClick={() => { setView(item.view); setSelectedLeaveType(null); }}
          >
            <item.icon size={22} strokeWidth={view === item.view ? 2.5 : 2} />
            <span className={`text-[9px] font-bold uppercase tracking-wider ${view === item.view ? 'text-blue-600' : 'text-[#cbd5e1]'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
