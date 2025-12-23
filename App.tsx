
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
  TableProperties
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
  const [view, setView] = useState('dashboard');
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [staffIdInput, setStaffIdInput] = useState('');
  
  const [lineUserId, setLineUserId] = useState('Checking...');
  const [linePicture, setLinePicture] = useState('');
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);

  useEffect(() => {
    console.log("React: Effect triggered");
    const initLiff = async () => {
      try {
        const liff = (window as any).liff;
        if (liff) {
          console.log("LIFF: Initializing with ID:", LIFF_ID);
          await liff.init({ liffId: LIFF_ID });
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineUserId(profile.userId);
            setLinePicture(profile.pictureUrl || '');
          } else {
            setLineUserId('BROWSER_MODE');
          }
        } else {
          console.warn("LIFF: SDK not found on window");
          setLineUserId('LIFF_SDK_MISSING');
        }
      } catch (err) {
        console.error('LIFF: Init Error:', err);
        setLineUserId('INIT_ERROR');
      } finally {
        setIsLiffReady(true);
      }
    };

    // Force transition after 3 seconds if LIFF hangs
    const timer = setTimeout(() => {
      if (!isLiffReady) {
        console.log("LIFF: Initialization timeout, forcing transition");
        setIsLiffReady(true);
      }
    }, 3000);

    initLiff();
    return () => clearTimeout(timer);
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
        alert('ไม่พบรหัสพนักงาน: ' + staffIdInput);
      }
    } catch (err: any) {
      alert('Login Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    const result = await SheetService.testConnection();
    setDiagnosticInfo(result);
    setIsDiagnosticOpen(true);
    setLoading(false);
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

  // While waiting for LIFF, show a React-based loader to confirm JS is working
  if (!isLiffReady) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <div className="text-center">
          <p className="text-slate-800 font-bold">React Loaded</p>
          <p className="text-slate-400 text-xs uppercase tracking-widest">Configuring Environment...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 py-10">
      {isDiagnosticOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 max-h-[90vh] overflow-hidden flex flex-col relative">
            <button onClick={() => setIsDiagnosticOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-600 text-white rounded-[1.25rem]"><TableProperties size={28} /></div>
              <h2 className="text-2xl font-bold">ฐานข้อมูลพนักงาน</h2>
            </div>
            {diagnosticInfo?.success ? (
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100"><p className="text-lg font-bold text-emerald-700">เชื่อมต่อแล้ว</p></div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-lg font-bold">{diagnosticInfo.rowCount - 1} รายการ</p></div>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-[12px]">
                    <thead className="bg-slate-50">
                      <tr>{diagnosticInfo.headers.map((h:any, i:number)=><th key={i} className="p-3 text-left">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {diagnosticInfo.sampleData.map((row:any[], i:number)=>(
                        <tr key={i} className="border-t">
                          {row.map((c:any, j:number)=><td key={j} className="p-3">{String(c)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-rose-50 rounded-3xl text-center">
                <AlertCircle size={40} className="mx-auto text-rose-500 mb-4" />
                <p className="font-bold text-rose-800">Connection Error</p>
                <code className="block mt-4 text-[10px] bg-white p-4 rounded-xl text-left">{diagnosticInfo?.message}</code>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-[400px] bg-white rounded-[40px] shadow-2xl px-10 py-12 flex flex-col items-center">
        <div className="absolute top-10 right-10 w-12 h-12 rounded-full border-2 border-emerald-100 overflow-hidden">
          {linePicture ? <img src={linePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><User size={20} className="text-slate-300"/></div>}
        </div>
        <div className="mt-8 mb-8 w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100">
          <Clock size={36} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800">GeoClock</h1>
        <p className="text-slate-400 font-medium mb-10">LMS Online Portal</p>
        
        <div className="w-full space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">LINE ID</label>
            <div className="w-full bg-slate-50 px-5 py-4 rounded-2xl text-[10px] text-slate-400 font-mono truncate">{lineUserId}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">STAFF ID</label>
            <input 
              type="text" 
              className="w-full bg-slate-100 px-5 py-4 rounded-2xl text-slate-800 font-bold outline-none focus:ring-2 ring-blue-500 transition-all"
              placeholder="กรอกรหัสพนักงาน"
              value={staffIdInput}
              onChange={(e)=>setStaffIdInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Log In'}
          </button>
          <button onClick={handleTestConnection} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase hover:text-blue-500 transition-colors">
            <Database size={14} /> ตรวจสอบฐานข้อมูลพนักงาน
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative flex flex-col">
      <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Clock size={20} /></div>
           <div><span className="block font-bold text-slate-800 text-sm">LMS ONLINE</span><span className="text-[10px] text-blue-500 font-bold uppercase">{user?.siteId}</span></div>
        </div>
        <button onClick={() => syncData(user!.staffId)} className={`p-2 transition-all ${loading ? 'animate-spin text-blue-600' : 'text-slate-300'}`}><RefreshCcw size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {selectedLeaveType ? (
          <div className="space-y-6">
            <header className="flex items-center gap-3">
              <button onClick={() => setSelectedLeaveType(null)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={24} /></button>
              <h1 className="text-xl font-bold">{getLeaveTheme(selectedLeaveType).label}</h1>
            </header>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">คงเหลือปัจจุบัน</p>
              <h2 className="text-6xl font-black text-slate-800 my-2">{balances.find(b=>b.type===selectedLeaveType)?.remain || 0}</h2>
              <p className="text-xs font-bold text-slate-400">วัน</p>
            </div>
          </div>
        ) : view === 'dashboard' ? (
          <div className="space-y-8">
            <header className="flex justify-between items-end">
              <div><h1 className="text-2xl font-bold text-slate-800 truncate max-w-[200px]">สวัสดี, {user?.name.split(' ')[0]}</h1><p className="text-slate-500 text-xs">{user?.position}</p></div>
              <button onClick={()=>setView('new')} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all hover:bg-blue-700"><PlusCircle size={28} /></button>
            </header>
            <section className="grid grid-cols-2 gap-4">
              {balances.map(b => <DashboardCard key={b.type} type={b.type} value={b.used} total={b.remain} onClick={() => setSelectedLeaveType(b.type)} />)}
            </section>
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">รายการลาล่าสุด</h2>
              <div className="space-y-3">
                {requests.length > 0 ? requests.slice(0, 3).map(req => (
                  <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getLeaveTheme(req.type).bg} ${getLeaveTheme(req.type).text}`}><Calendar size={18} /></div>
                      <div><h4 className="font-bold text-xs">{req.type.split(' (')[0]}</h4><p className="text-[10px] text-slate-400">{req.startDate}</p></div>
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
        ) : null}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 px-8 py-4 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-lg">
        {[{ icon: Home, label: 'หน้าหลัก', view: 'dashboard' }, { icon: History, label: 'ประวัติ', view: 'history' }, { icon: User, label: 'บัญชี', view: 'profile' }].map(item => (
          <button key={item.view} className={`flex flex-col items-center gap-1 transition-colors ${view === item.view ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`} onClick={()=>setView(item.view)}>
            <item.icon size={22} /><span className="text-[9px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
