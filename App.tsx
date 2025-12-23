
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
  Database,
  TableProperties,
  CheckCircle2,
  XCircle,
  FileText,
  LogOut,
  Fingerprint
} from 'lucide-react';
import { 
  UserRole, 
  LeaveType, 
  LeaveStatus, 
  LeaveRequest, 
  LeaveBalance, 
  UserProfile 
} from './types.ts';
import { SheetService } from './sheetService.ts';

const LIFF_ID = '2007509057-esMqbZzO';

const getLeaveTheme = (type: LeaveType) => {
  switch (type) {
    case LeaveType.SICK: return { color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', icon: Thermometer, label: 'ลาป่วย' };
    case LeaveType.ANNUAL: return { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Palmtree, label: 'ลาพักร้อน' };
    case LeaveType.PERSONAL: return { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', icon: UserCheck, label: 'ลากิจ' };
    case LeaveType.PUBLIC_HOLIDAY: return { color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Flag, label: 'วันหยุด' };
    case LeaveType.MATERNITY: return { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', icon: Baby, label: 'ลาคลอด' };
    case LeaveType.LEAVE_WITHOUT_PAY: return { color: 'bg-slate-600', bg: 'bg-slate-50', text: 'text-slate-700', icon: Wallet, label: 'ไม่รับค่าจ้าง' };
    case LeaveType.WEEKLY_HOLIDAY_SWITCH: return { color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600', icon: Repeat, label: 'สลับวันหยุด' };
    default: return { color: 'bg-fuchsia-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', icon: MoreHorizontal, label: 'ลาอื่นๆ' };
  }
};

const calculateDays = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const styles = {
    [LeaveStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [LeaveStatus.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [LeaveStatus.REJECTED]: 'bg-rose-100 text-rose-700 border-rose-200',
    [LeaveStatus.CANCELLED]: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${styles[status]}`}>{status}</span>;
};

const DashboardCard: React.FC<{ type: LeaveType; value: number; total: number; onClick: () => void }> = ({ type, value, total, onClick }) => {
  const isSwitch = type === LeaveType.WEEKLY_HOLIDAY_SWITCH;
  const theme = getLeaveTheme(type);
  const Icon = theme.icon;
  const progress = (total + value) > 0 ? (value / (value + total)) * 100 : 0;

  return (
    <div onClick={onClick} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all hover:border-slate-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text}`}><Icon size={20} /></div>
        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </div>
      <div>
        <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 truncate">{theme.label}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">{isSwitch ? value : total}</span>
          <span className="text-[10px] font-medium text-slate-400">{isSwitch ? 'รายการ' : 'วันคงเหลือ'}</span>
        </div>
      </div>
      {!isSwitch && (
        <div className="mt-4 space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full ${theme.color} transition-all duration-700`} style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ใช้ไป {value} วัน</div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [view, setView] = useState('dashboard');
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [staffIdInput, setStaffIdInput] = useState('');
  
  const [lineUserId, setLineUserId] = useState('');
  const [linePicture, setLinePicture] = useState('');
  const [lineName, setLineName] = useState('');
  const [isLiffReady, setIsLiffReady] = useState(false);

  const [newRequest, setNewRequest] = useState({
    type: LeaveType.ANNUAL,
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liff = (window as any).liff;
        if (liff) {
          await liff.init({ liffId: LIFF_ID });
          setIsLiffReady(true);

          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineUserId(profile.userId);
            setLinePicture(profile.pictureUrl || '');
            setLineName(profile.displayName || '');
            
            setCheckingStatus(true);
            try {
              const userProfile = await SheetService.checkUserStatus(profile.userId);
              if (userProfile) {
                setUser(userProfile);
                await fetchUserData(userProfile);
                setIsLoggedIn(true);
              }
            } catch (err) {
              console.error("Auto-check failed:", err);
            } finally {
              setCheckingStatus(false);
            }
          } else {
            setIsLiffReady(true);
          }
        }
      } catch (err) {
        console.error('LIFF Init Error:', err);
        setIsLiffReady(true);
      }
    };
    initLiff();
  }, []);

  const fetchUserData = async (profile: UserProfile) => {
    setLoading(true);
    try {
      const [rawBalances, reqs] = await Promise.all([
        SheetService.getBalances(profile.staffId),
        SheetService.getRequests(profile.staffId, profile.roleType === UserRole.SUPERVISOR)
      ]);
      if (rawBalances) setBalances(rawBalances.balances);
      setRequests(reqs);
    } catch (err) {
      console.error("Fetch User Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!staffIdInput) return;
    setLoading(true);
    try {
      const profile = await SheetService.getProfile(staffIdInput);
      if (profile) {
        setUser(profile);
        await fetchUserData(profile);
        setIsLoggedIn(true);
      } else {
        alert('ไม่พบรหัสพนักงาน: ' + staffIdInput);
      }
    } catch (err: any) {
      alert('Login Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    if (!user) return;
    await fetchUserData(user);
  };

  const handleSubmitLeave = async () => {
    if (!newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const totalDays = calculateDays(newRequest.startDate, newRequest.endDate);
    if (totalDays <= 0) {
      alert('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
      return;
    }

    setLoading(true);
    try {
      const result = await SheetService.submitRequest({
        staffId: user!.staffId,
        staffName: user!.name,
        siteId: user!.siteId,
        type: newRequest.type,
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        totalDays: totalDays,
        reason: newRequest.reason,
        appliedDate: new Date().toISOString().split('T')[0]
      });

      if (result.success) {
        alert('ส่งใบลาเรียบร้อยแล้ว');
        setNewRequest({ type: LeaveType.ANNUAL, startDate: '', endDate: '', reason: '' });
        await syncData();
        setView('dashboard');
      } else {
        alert('เกิดข้อผิดพลาดในการส่งใบลา');
      }
    } catch (err) {
      console.error(err);
      alert('Submit error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, approve: boolean) => {
    if (!user) return;
    const comment = prompt(approve ? 'ระบุหมายเหตุการอนุมัติ (ถ้ามี)' : 'ระบุเหตุผลการปฏิเสธ');
    if (approve === false && !comment) return;

    setLoading(true);
    try {
      const success = await SheetService.updateRequestStatus(
        requestId, 
        approve ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
        user.name
      );
      if (success) {
        await syncData();
        alert('ดำเนินการเรียบร้อย');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setStaffIdInput('');
    setView('dashboard');
  };

  if (!isLiffReady) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <div className="text-center">
          <p className="text-slate-800 font-bold tracking-tight">GeoClock Online</p>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (checkingStatus) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
        <div className="relative">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
            <Fingerprint className="text-blue-600" size={40} />
          </div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-slate-800">กำลังยืนยันตัวตน</h2>
          <p className="text-slate-400 text-xs font-medium px-10">ระบบกำลังตรวจสอบข้อมูลผู้ใช้งานผ่านบัญชี LINE ของคุณ...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] px-4 py-10">
      <div className="w-full max-w-[400px] bg-white rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] px-8 py-10 flex flex-col items-center border border-white">
        
        {/* Integrated Identity Container */}
        <div className="w-full bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col items-center space-y-8">
          {/* Top User Icon/Profile */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl mb-4">
                {linePicture ? (
                  <img src={linePicture} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-300">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm"></div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1 opacity-60">Connected LINE</p>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{lineName || 'LINE User'}</h2>
            </div>
          </div>

          {/* Input Area within the same frame */}
          <div className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Identity (Staff ID)</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                  <Fingerprint size={18} />
                </div>
                <input 
                  type="text" 
                  className="w-full bg-white pl-12 pr-5 py-4 rounded-2xl text-slate-800 font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all placeholder:text-slate-200 border border-slate-100"
                  placeholder="รหัสพนักงาน"
                  value={staffIdInput}
                  onChange={(e)=>setStaffIdInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>
            
            <button 
              onClick={handleLogin} 
              disabled={loading} 
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> เข้าสู่ระบบ</>}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center space-y-1">
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">
            ระบบความปลอดภัยขั้นสูง (Secure Login)<br/>ยืนยันข้อมูลเพื่อผูกบัญชีการลางาน
          </p>
        </div>
      </div>
      
      {/* Footer Version */}
      <div className="mt-8 flex items-center justify-center gap-2 text-slate-300">
        <ShieldCheck size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Powered by GeoClock v2.5</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm"><Clock size={20} /></div>
           <div><span className="block font-bold text-slate-800 text-sm leading-tight uppercase tracking-tight">GeoClock</span><span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{user?.siteId}</span></div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="animate-spin text-blue-600" size={18} />}
          <button onClick={syncData} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><RefreshCcw size={18} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {selectedLeaveType ? (
          <div className="space-y-6">
            <header className="flex items-center gap-3">
              <button onClick={() => setSelectedLeaveType(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronLeft size={24} /></button>
              <h1 className="text-xl font-bold">{getLeaveTheme(selectedLeaveType).label}</h1>
            </header>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">คงเหลือปัจจุบัน</p>
              <h2 className="text-6xl font-black text-slate-800 my-2">{balances.find(b=>b.type===selectedLeaveType)?.remain || 0}</h2>
              <p className="text-xs font-bold text-slate-400">วัน</p>
            </div>
            <div className="space-y-3">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">ประวัติการลาประเภทนี้</h3>
               {requests.filter(r => r.type === selectedLeaveType).length > 0 ? (
                 requests.filter(r => r.type === selectedLeaveType).map(req => (
                   <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex justify-between items-center">
                     <div><p className="font-bold text-xs">{req.startDate} - {req.endDate}</p><p className="text-[10px] text-slate-400">{req.totalDays} วัน</p></div>
                     <StatusBadge status={req.status} />
                   </div>
                 ))
               ) : (
                 <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">ไม่มีประวัติการลา</p>
                 </div>
               )}
            </div>
          </div>
        ) : view === 'dashboard' ? (
          <div className="space-y-8">
            <header className="flex justify-between items-end">
              <div><h1 className="text-2xl font-bold text-slate-800 truncate max-w-[200px]">สวัสดี, {user?.name.split(' ')[0]}</h1><p className="text-slate-500 text-xs font-medium">{user?.position}</p></div>
              <button onClick={()=>setView('new')} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-100 active:scale-90 transition-all hover:bg-blue-700"><PlusCircle size={24} /></button>
            </header>
            <section className="grid grid-cols-2 gap-4">
              {balances.map(b => <DashboardCard key={b.type} type={b.type} value={b.used} total={b.remain} onClick={() => setSelectedLeaveType(b.type)} />)}
            </section>
            
            {user?.roleType === UserRole.SUPERVISOR && requests.some(r => r.status === LeaveStatus.PENDING && r.staffId !== user.staffId) && (
              <section className="bg-blue-600 p-6 rounded-[2rem] shadow-xl shadow-blue-100 text-white">
                <div className="flex items-center gap-2 mb-4">
                   <ShieldCheck size={20} className="text-white" />
                   <h2 className="text-sm font-bold uppercase tracking-widest">รอการอนุมัติ</h2>
                </div>
                <div className="space-y-3">
                  {requests.filter(r => r.status === LeaveStatus.PENDING && r.staffId !== user.staffId).map(req => (
                    <div key={req.id} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                      <div className="flex justify-between items-start mb-2">
                        <div><p className="text-[10px] font-bold text-blue-100">{req.staffName}</p><p className="font-bold text-xs">{getLeaveTheme(req.type).label}</p></div>
                        <p className="text-[10px] font-bold text-blue-200">{req.totalDays} วัน</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleApprove(req.id, true)} className="flex-1 bg-white text-blue-600 py-2.5 rounded-xl text-[10px] font-bold active:scale-95 transition-all">อนุมัติ</button>
                        <button onClick={() => handleApprove(req.id, false)} className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl text-[10px] font-bold active:scale-95 transition-all">ปฏิเสธ</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest px-2">รายการลาล่าสุด</h2>
              <div className="space-y-3">
                {requests.filter(r => r.staffId === user?.staffId).length > 0 ? requests.filter(r => r.staffId === user?.staffId).slice(0, 3).map(req => (
                  <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getLeaveTheme(req.type).bg} ${getLeaveTheme(req.type).text}`}><Calendar size={18} /></div>
                      <div><h4 className="font-bold text-xs">{getLeaveTheme(req.type).label}</h4><p className="text-[10px] text-slate-400">{req.startDate}</p></div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                )) : (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400 font-medium italic">ไม่มีประวัติการลา</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : view === 'new' ? (
          <div className="space-y-6">
            <header className="flex items-center gap-3 mb-4">
              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ChevronLeft size={24} /></button>
              <h1 className="text-2xl font-bold">แบบฟอร์มการลา</h1>
            </header>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">เลือกประเภท</label>
                <div className="grid grid-cols-2 gap-2">
                  {[LeaveType.ANNUAL, LeaveType.SICK, LeaveType.PERSONAL, LeaveType.PUBLIC_HOLIDAY].map(type => {
                    const theme = getLeaveTheme(type);
                    const isActive = newRequest.type === type;
                    return (
                      <button 
                        key={type} 
                        onClick={() => setNewRequest({...newRequest, type})}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isActive ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                      >
                        <div className={`p-2 rounded-xl ${theme.bg} ${theme.text}`}><theme.icon size={20} /></div>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>{theme.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">เริ่ม</label>
                  <input type="date" className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500" value={newRequest.startDate} onChange={(e) => setNewRequest({...newRequest, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ถึง</label>
                  <input type="date" className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500" value={newRequest.endDate} onChange={(e) => setNewRequest({...newRequest, endDate: e.target.value})} />
                </div>
              </div>

              {newRequest.startDate && newRequest.endDate && (
                <div className="p-4 bg-emerald-50 rounded-2xl flex justify-between items-center border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700"><Calendar size={18} /><span className="text-[10px] font-bold uppercase">รวมวันลา</span></div>
                  <span className="text-xl font-black text-emerald-800">{calculateDays(newRequest.startDate, newRequest.endDate)} วัน</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">เหตุผล</label>
                <textarea className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-medium border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none" placeholder="ระบุเหตุผล..." value={newRequest.reason} onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})} />
              </div>

              <button onClick={handleSubmitLeave} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> ยืนยันคำขอ</>}
              </button>
            </div>
          </div>
        ) : view === 'history' ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold mb-6">ประวัติการลา</h1>
            <div className="space-y-4">
              {requests.filter(r => r.staffId === user?.staffId).length > 0 ? (
                requests.filter(r => r.staffId === user?.staffId).map(req => (
                  <div key={req.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${getLeaveTheme(req.type).bg} ${getLeaveTheme(req.type).text}`}><Calendar size={20} /></div>
                        <div><h4 className="font-bold text-sm">{getLeaveTheme(req.type).label}</h4><p className="text-[10px] text-slate-400">{req.appliedDate}</p></div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                       <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]"><Clock size={14} />{req.startDate} - {req.endDate}</div>
                       <span className="text-[11px] font-black text-slate-800">{req.totalDays} วัน</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                   <FileText size={40} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-slate-400 text-xs font-bold uppercase">ไม่มีข้อมูล</p>
                </div>
              )}
            </div>
          </div>
        ) : view === 'profile' ? (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold mb-6">โปรไฟล์</h1>
            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner">
                  {linePicture ? <img src={linePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><User size={48} /></div>}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-2xl shadow-lg border-4 border-white"><ShieldCheck size={20} /></div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">{user?.name}</h2>
              <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full mb-8">{user?.position}</p>
              
              <div className="w-full space-y-3 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff ID</span>
                   <span className="text-sm font-bold text-slate-700">{user?.staffId}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site ID</span>
                   <span className="text-sm font-bold text-slate-700">{user?.siteId}</span>
                </div>
              </div>

              <button onClick={handleLogout} className="w-full mt-10 bg-rose-50 text-rose-600 font-bold py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-rose-100">
                <LogOut size={20} /> ออกจากระบบ
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 px-8 py-4 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        {[
          { icon: Home, label: 'หน้าแรก', view: 'dashboard' }, 
          { icon: History, label: 'ประวัติ', view: 'history' }, 
          { icon: User, label: 'บัญชี', view: 'profile' }
        ].map(item => (
          <button key={item.view} className={`flex flex-col items-center gap-1.5 transition-all ${view === item.view ? 'text-blue-600 scale-110' : 'text-slate-300'}`} onClick={()=> { setView(item.view); setSelectedLeaveType(null); }}>
            <item.icon size={22} strokeWidth={view === item.view ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
