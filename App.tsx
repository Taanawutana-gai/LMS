
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  ClipboardList, 
  Home, 
  PlusCircle, 
  User, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Camera, 
  X, 
  Image as ImageIcon, 
  Eye, 
  ChevronLeft, 
  Info, 
  Sparkles, 
  Palmtree, 
  Thermometer, 
  UserCheck, 
  Baby, 
  Flag, 
  Wallet, 
  MoreHorizontal,
  CloudUpload,
  Loader2,
  Trash2,
  RefreshCcw,
  History,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { 
  UserRole, 
  LeaveType, 
  LeaveStatus, 
  LeaveRequest, 
  LeaveBalance, 
  UserProfile 
} from './types';
import { 
  MOCK_USER, 
  MOCK_MANAGER, 
  INITIAL_BALANCES, 
  INITIAL_REQUESTS 
} from './mockData';

// --- SLA Configuration ---
const SLA_DAYS_REQUIRED: Record<string, number> = {
  [LeaveType.ANNUAL]: 5,
  [LeaveType.PERSONAL]: 5,
  [LeaveType.OTHER]: 5,
  [LeaveType.SICK]: 0,
  [LeaveType.MATERNITY]: 0,
  [LeaveType.PUBLIC_HOLIDAY]: 0,
  [LeaveType.LEAVE_WITHOUT_PAY]: 0,
  [LeaveType.WEEKLY_HOLIDAY_SWITCH]: 0,
};

// --- Helper Functions ---
const getLeaveTheme = (type: LeaveType) => {
  switch (type) {
    case LeaveType.SICK: 
      return { color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', icon: Thermometer, label: 'ลาป่วย' };
    case LeaveType.ANNUAL: 
      return { color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Palmtree, label: 'ลาพักร้อน' };
    case LeaveType.PERSONAL: 
      return { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', icon: UserCheck, label: 'ลากิจ' };
    case LeaveType.PUBLIC_HOLIDAY: 
      return { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Flag, label: 'วันหยุด' };
    case LeaveType.MATERNITY: 
      return { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', icon: Baby, label: 'ลาคลอด' };
    case LeaveType.LEAVE_WITHOUT_PAY: 
      return { color: 'bg-orange-600', bg: 'bg-orange-50', text: 'text-orange-700', icon: Wallet, label: 'ไม่รับค่าจ้าง' };
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
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
};

const calculateAdvanceDays = (startDateStr: string): number => {
  if (!startDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);
  
  const diffTime = startDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- Sub-components ---

const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const styles = {
    [LeaveStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [LeaveStatus.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [LeaveStatus.REJECTED]: 'bg-rose-100 text-rose-700 border-rose-200',
    [LeaveStatus.CANCELLED]: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {status}
    </span>
  );
};

interface DashboardCardProps {
  type: LeaveType;
  value: number;
  total: number;
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ type, value, total, onClick }) => {
  const remaining = total - value;
  const progress = total > 0 ? (value / total) * 100 : 0;
  const theme = getLeaveTheme(type);
  const Icon = theme.icon;

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all hover:border-slate-300 group relative"
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-xl ${theme.bg} ${theme.text}`}>
          <Icon size={18} />
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>

      <div className="mb-3">
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider truncate mb-1">
          {theme.label}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">{remaining}</span>
          <span className="text-[10px] font-medium text-slate-400">วันคงเหลือ</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full ${theme.color} transition-all duration-700`} 
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
          <span>ใช้ไป {value}</span>
          <span>ทั้งหมด {total}</span>
        </div>
      </div>
    </div>
  );
};

const ImageModal = ({ src, onClose }: { src: string, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
        <X size={24} />
      </button>
      <img src={src} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

// --- Login View ---

const LoginView = ({ onLogin }: { onLogin: (staffId: string) => void }) => {
  const [staffId, setStaffId] = useState('');
  const dummyLineId = "Ufd0e0827bd454c6fb7024fe9e47b"; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffId.trim()) {
      onLogin(staffId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 text-center relative">
        <div className="flex justify-center mb-6">
           <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-100">
              <Clock className="text-white" size={40} />
           </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800">LMS Online</h1>
        <p className="text-slate-400 mt-1 mb-10 text-sm">Leave Management System</p>
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase px-1">LINE User ID</label>
            <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-500 text-xs overflow-hidden text-ellipsis whitespace-nowrap">
              {dummyLineId}...
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase px-1">Staff ID (รหัสพนักงาน)</label>
            <input 
              type="text"
              placeholder="กรอกรหัสพนักงาน"
              className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Detail View for Specific Leave Type ---

const LeaveTypeDetailView = ({ 
  type, 
  balance, 
  requests, 
  onBack 
}: { 
  type: LeaveType, 
  balance: LeaveBalance, 
  requests: LeaveRequest[], 
  onBack: () => void 
}) => {
  const filteredRequests = requests.filter(r => r.type === type && r.status !== LeaveStatus.CANCELLED);
  const theme = getLeaveTheme(type);
  
  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-4 duration-300">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{theme.label}</h1>
          <p className="text-xs text-slate-500">รายละเอียดและประวัติการทำรายการ</p>
        </div>
      </header>

      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-end mb-4">
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">วันคงเหลือ</p>
              <h2 className="text-4xl font-bold text-slate-800">
                {balance.total - balance.used} <span className="text-sm font-medium text-slate-400">วัน</span>
              </h2>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">สิทธิทั้งหมด</p>
              <p className="text-lg font-bold text-slate-800">{balance.total} วัน</p>
           </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full ${theme.color}`} 
            style={{ width: `${balance.total > 0 ? ((balance.total - balance.used) / balance.total) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
           <span>ใช้ไปแล้ว {balance.used} วัน</span>
           <span>รอบปี 2024</span>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase px-1">ประวัติการลา</h3>
        {filteredRequests.length === 0 ? (
          <div className="bg-white/50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
             ไม่มีประวัติสำหรับประเภทนี้
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-800">{req.startDate} — {req.endDate}</p>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-[10px] text-slate-500 italic">"{req.reason}"</p>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </div>
          ))
        )}
      </section>
    </div>
  );
};

// --- Main Views ---

const DashboardView = ({ 
  user, 
  balances, 
  requests, 
  onNavigate,
  onSelectType
}: { 
  user: UserProfile, 
  balances: LeaveBalance[], 
  requests: LeaveRequest[],
  onNavigate: (view: string) => void,
  onSelectType: (type: LeaveType) => void
}) => {
  const recentRequests = requests.filter(r => r.status !== LeaveStatus.CANCELLED).slice(0, 3);
  const dashboardBalances = balances.filter(b => b.type !== LeaveType.WEEKLY_HOLIDAY_SWITCH);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">สวัสดี, {user.name.split(' ')[0]}</h1>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <span className="font-medium">{user.position}</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-indigo-600">{user.siteId}</span>
          </div>
        </div>
        <button 
          className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95" 
          onClick={() => onNavigate('new')}
        >
          <PlusCircle size={24} />
        </button>
      </header>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">สิทธิการลาคงเหลือ</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {dashboardBalances.map((b) => (
            <DashboardCard 
              key={b.type} 
              type={b.type} 
              value={b.used} 
              total={b.total} 
              onClick={() => onSelectType(b.type)}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">รายการล่าสุด</h2>
          <button 
            className="text-indigo-600 text-xs font-bold hover:underline"
            onClick={() => onNavigate('history')}
          >
            ดูทั้งหมด
          </button>
        </div>
        <div className="space-y-3">
          {recentRequests.map((req) => (
            <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${req.status === LeaveStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{req.type.split(' (')[0]}</h4>
                  <p className="text-[10px] text-slate-400">{req.startDate} — {req.endDate}</p>
                </div>
              </div>
              <StatusBadge status={req.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const NewRequestView = ({ 
  onSubmit,
  balances,
  initialData 
}: { 
  onSubmit: (data: Partial<LeaveRequest>) => void,
  balances: LeaveBalance[],
  initialData?: Partial<LeaveRequest>
}) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || LeaveType.ANNUAL,
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    reason: initialData?.reason || '',
  });
  const [attachment, setAttachment] = useState<string | null>(initialData?.attachmentUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed Values
  const requestedDays = useMemo(() => calculateDays(formData.startDate, formData.endDate), [formData.startDate, formData.endDate]);
  const advanceDays = useMemo(() => calculateAdvanceDays(formData.startDate), [formData.startDate]);
  const requiredSLA = SLA_DAYS_REQUIRED[formData.type] || 0;
  
  const currentBalance = balances.find(b => b.type === formData.type);
  const remainingDays = currentBalance ? (currentBalance.total - currentBalance.used) : 0;
  
  // Validation Logic
  const isBalanceExceeded = requestedDays > remainingDays && formData.type !== LeaveType.WEEKLY_HOLIDAY_SWITCH && formData.type !== LeaveType.LEAVE_WITHOUT_PAY;
  const isSLAProblem = formData.startDate && advanceDays < requiredSLA;

  const isSwitchRequest = formData.type === LeaveType.WEEKLY_HOLIDAY_SWITCH;

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || LeaveType.ANNUAL,
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        reason: initialData.reason || '',
      });
      setAttachment(initialData.attachmentUrl || null);
    }
  }, [initialData]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setError('');
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const blobUrl = URL.createObjectURL(file);
        setAttachment(blobUrl);
      } catch (err) {
        setError('ไม่สามารถอัปโหลดรูปภาพได้');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (isBalanceExceeded) {
      setError('จำนวนวันลาเกินสิทธิคงเหลือ');
      return;
    }
    if (isSLAProblem) {
      setError(`ประเภทลานี้ต้องแจ้งล่วงหน้าอย่างน้อย ${requiredSLA} วัน`);
      return;
    }
    onSubmit({ ...formData, attachmentUrl: attachment || undefined });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{initialData ? 'ยื่นคำขอใหม่ (จากรายการเดิม)' : 'ยื่นคำขอใหม่'}</h1>
          <p className="text-slate-500 text-sm">สร้างคำขอลาหรือสลับวันหยุด</p>
        </div>
        {initialData && (
          <div className="bg-amber-50 text-amber-600 p-2 rounded-xl">
             <RefreshCcw size={20} className="animate-spin-slow" />
          </div>
        )}
      </header>

      {/* SLA Alert Banner */}
      {isSLAProblem && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
           <Timer className="text-orange-600 mt-1 shrink-0" size={18} />
           <div>
              <p className="text-xs font-bold text-orange-800 uppercase">ผิดเงื่อนไข SLA</p>
              <p className="text-[11px] text-orange-700 leading-relaxed">
                ประเภทการลา "{getLeaveTheme(formData.type).label}" ต้องแจ้งล่วงหน้าอย่างน้อย <b>{requiredSLA} วัน</b> 
                (คุณแจ้งล่วงหน้า {advanceDays < 0 ? 0 : advanceDays} วัน)
              </p>
           </div>
        </div>
      )}

      {/* Balance Validation Banner */}
      {isBalanceExceeded && !isSLAProblem && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
           <AlertTriangle className="text-rose-600 mt-1 shrink-0" size={18} />
           <div>
              <p className="text-xs font-bold text-rose-800 uppercase">สิทธิการลาไม่เพียงพอ</p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                คุณขอลา {requestedDays} วัน แต่มีสิทธิคงเหลือเพียง {remainingDays} วัน
              </p>
           </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase px-1 flex justify-between">
            ประเภทการลา
            {requiredSLA > 0 && (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1 normal-case font-medium">
                <Timer size={10} /> แจ้งล่วงหน้า {requiredSLA} วัน
              </span>
            )}
          </label>
          <select 
            className="w-full bg-white border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as LeaveType})}
          >
            {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase px-1">วันที่เริ่ม</label>
            <input 
              type="date"
              className={`w-full bg-white border ${isSLAProblem ? 'border-orange-300 ring-1 ring-orange-100' : 'border-slate-200'} p-4 rounded-xl font-medium outline-none transition-all`}
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase px-1">วันที่สิ้นสุด</label>
            <input 
              type="date"
              className="w-full bg-white border border-slate-200 p-4 rounded-xl font-medium outline-none"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            />
          </div>
        </div>

        {/* Counter Info */}
        {requestedDays > 0 && (
          <div className="px-1 flex justify-between items-center">
             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Calendar size={14} className="text-indigo-500" />
                ครั้งนี้ลา <span className={isBalanceExceeded ? "text-rose-600 underline" : "text-indigo-600"}>{requestedDays}</span> วัน
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase">
                สิทธิคงเหลือ <span className="text-slate-700">{remainingDays}</span> วัน
             </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">เหตุผล</label>
          <textarea 
            rows={3}
            className="w-full bg-white border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="ระบุเหตุผลการลา..."
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">หลักฐานการลา</label>
          <div className="flex flex-col gap-3">
            {!attachment && !isUploading ? (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <Camera size={24} />
                <span className="font-bold text-sm">อัปโหลดรูปภาพ</span>
              </button>
            ) : isUploading ? (
              <div className="w-full py-12 border-2 border-dashed border-indigo-100 rounded-2xl bg-indigo-50/30 flex flex-col items-center justify-center gap-3">
                <Loader2 className="text-indigo-600 animate-spin" size={32} />
              </div>
            ) : (
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-slate-100">
                <img src={attachment!} alt="Preview" className="w-full h-full object-contain" />
                <button 
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="absolute top-3 right-3 bg-rose-500 text-white p-2 rounded-full shadow-lg"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isUploading || isBalanceExceeded || isSLAProblem}
          className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 ${isUploading || isBalanceExceeded || isSLAProblem ? 'bg-slate-300 cursor-not-allowed opacity-70' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}
        >
          {isUploading ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
          {isUploading ? 'กรุณารอสักครู่...' : isSLAProblem ? 'ผิดเกณฑ์ SLA' : isBalanceExceeded ? 'สิทธิไม่เพียงพอ' : 'ยืนยันส่งคำขอ'}
        </button>
      </form>
    </div>
  );
};

const HistoryView = ({ 
  requests, 
  onCancel, 
  onResubmit 
}: { 
  requests: LeaveRequest[], 
  onCancel: (id: string) => void,
  onResubmit: (req: LeaveRequest) => void
}) => {
  const sortedRequests = [...requests].sort((a, b) => {
    if (a.status === LeaveStatus.PENDING && b.status !== LeaveStatus.PENDING) return -1;
    if (a.status !== LeaveStatus.PENDING && b.status === LeaveStatus.PENDING) return 1;
    return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">ประวัติรายการ</h1>
        <p className="text-slate-500 text-sm">ติดตามและจัดการคำขอย้อนหลัง</p>
      </header>
      <div className="space-y-4">
        {sortedRequests.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <ClipboardList size={64} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold text-xs uppercase tracking-widest">ยังไม่มีประวัติ</p>
          </div>
        ) : (
          sortedRequests.map((req) => (
            <div key={req.id} className={`bg-white p-5 rounded-2xl border ${req.status === LeaveStatus.CANCELLED ? 'border-slate-100 opacity-60' : 'border-slate-100'} shadow-sm space-y-4 transition-all`}>
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">{req.type.split(' (')[0]}</h3>
                    {req.attachmentUrl && <ImageIcon size={14} className="text-indigo-500" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{req.siteId}</span>
                    <p className="text-[10px] text-slate-400 font-medium">ยื่นเมื่อ {req.appliedDate}</p>
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" />
                  <span>{req.startDate} — {req.endDate}</span>
                </div>
              </div>

              {req.status === LeaveStatus.REJECTED && req.approverReason && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">เหตุผลที่ปฏิเสธ:</p>
                  <p className="text-[11px] text-rose-700 italic">"{req.approverReason}"</p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                {req.status === LeaveStatus.PENDING && (
                  <button 
                    onClick={() => {
                      if(confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอนี้?')) onCancel(req.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-[10px] font-bold uppercase hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={14} />
                    ยกเลิกคำขอ
                  </button>
                )}
                {req.status === LeaveStatus.REJECTED && (
                  <button 
                    onClick={() => onResubmit(req)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-bold uppercase hover:bg-indigo-100 transition-colors"
                  >
                    <RefreshCcw size={14} />
                    ยื่นใหม่อีกครั้ง
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ManagerView = ({ 
  requests, 
  onAction,
  onPreviewImage
}: { 
  requests: LeaveRequest[], 
  onAction: (id: string, status: LeaveStatus, reason?: string) => void,
  onPreviewImage: (src: string) => void
}) => {
  const pending = requests.filter(r => r.status === LeaveStatus.PENDING);
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">อนุมัติคำขอ</h1>
        <p className="text-slate-500 text-sm">รายการรอดำเนินการ</p>
      </header>
      <div className="space-y-4">
        {pending.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <CheckCircle2 size={64} className="mx-auto mb-4 opacity-10 text-emerald-500" />
            <p className="font-bold text-xs uppercase tracking-widest">ไม่มีรายการรออนุมัติ</p>
          </div>
        ) : (
          pending.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold">
                  {req.staffName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{req.staffName}</h3>
                  <p className="text-[10px] text-slate-400 font-bold">ID: {req.staffId}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                 <div className="flex justify-between font-bold">
                    <span className="text-slate-400 uppercase text-[9px]">ประเภท:</span>
                    <span className="text-indigo-600">{req.type.split(' (')[0]}</span>
                 </div>
                 <div className="flex justify-between font-bold">
                    <span className="text-slate-400 uppercase text-[9px]">ระยะเวลา:</span>
                    <span>{req.startDate} ถึง {req.endDate}</span>
                 </div>
                 <p className="text-slate-600 mt-2 italic">"{req.reason}"</p>
              </div>

              {req.attachmentUrl && (
                <div 
                  onClick={() => onPreviewImage(req.attachmentUrl!)}
                  className="w-full h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative cursor-pointer group"
                >
                  <img src={req.attachmentUrl} alt="Attachment" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="text-white" />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const r = prompt("ระบุเหตุผลที่ปฏิเสธ:");
                    if (r) onAction(req.id, LeaveStatus.REJECTED, r);
                  }}
                  className="flex-1 bg-white border border-slate-200 text-slate-400 font-bold py-3 rounded-xl text-[10px] uppercase hover:bg-slate-50"
                >
                  ปฏิเสธ
                </button>
                <button 
                  onClick={() => onAction(req.id, LeaveStatus.APPROVED)}
                  className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl text-[10px] uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                >
                  อนุมัติคำขอ
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState('dashboard');
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [balances, setBalances] = useState<LeaveBalance[]>(INITIAL_BALANCES);
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<LeaveRequest> | undefined>(undefined);

  const toggleRole = () => {
    setUser(user.roleType === UserRole.EMPLOYEE ? MOCK_MANAGER : MOCK_USER);
    setView('dashboard');
    setSelectedLeaveType(null);
  };

  const handleCreateRequest = (data: Partial<LeaveRequest>) => {
    const newRequest: LeaveRequest = {
      id: `REQ-${Math.floor(Math.random() * 1000)}`,
      staffId: user.staffId,
      staffName: user.name,
      siteId: user.siteId,
      type: data.type || LeaveType.ANNUAL,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      reason: data.reason || '',
      status: LeaveStatus.PENDING,
      attachmentUrl: data.attachmentUrl,
      appliedDate: new Date().toISOString().split('T')[0],
    };
    setRequests([newRequest, ...requests]);
    setPrefillData(undefined);
    setView('history');
  };

  const handleCancelRequest = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: LeaveStatus.CANCELLED } : r));
  };

  const handleResubmitRequest = (req: LeaveRequest) => {
    setPrefillData({
      type: req.type,
      startDate: req.startDate,
      endDate: req.endDate,
      reason: req.reason,
      attachmentUrl: req.attachmentUrl
    });
    setView('new');
  };

  const handleAction = (id: string, status: LeaveStatus, reason?: string) => {
    const target = requests.find(r => r.id === id);
    if (!target) return;

    if (status === LeaveStatus.APPROVED) {
      if (target.type === LeaveType.WEEKLY_HOLIDAY_SWITCH) {
        setBalances(prev => prev.map(b => b.type === LeaveType.WEEKLY_HOLIDAY_SWITCH ? { ...b, total: b.total + 1 } : b));
      } else {
        const days = calculateDays(target.startDate, target.endDate);
        setBalances(prev => prev.map(b => b.type === target.type ? { ...b, used: b.used + days } : b));
      }
    }

    setRequests(requests.map(r => r.id === id ? { ...r, status, approverReason: reason, approvalDate: new Date().toISOString().split('T')[0] } : r));
  };

  if (!isLoggedIn) return <LoginView onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative">
      <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
             <Clock size={18} />
           </div>
           <span className="font-bold text-slate-800 tracking-tight">LMS Online</span>
        </div>
        <button 
          onClick={toggleRole}
          className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg"
        >
          {user.roleType}
        </button>
      </div>

      <div className="px-6 pt-6 pb-24">
        {selectedLeaveType ? (
          <LeaveTypeDetailView 
            type={selectedLeaveType} 
            balance={balances.find(b => b.type === selectedLeaveType)!} 
            requests={requests} 
            onBack={() => setSelectedLeaveType(null)} 
          />
        ) : (
          <>
            {view === 'dashboard' && <DashboardView user={user} balances={balances} requests={requests} onNavigate={setView} onSelectType={setSelectedLeaveType} />}
            {view === 'new' && <NewRequestView onSubmit={handleCreateRequest} balances={balances} initialData={prefillData} />}
            {view === 'history' && <HistoryView requests={requests} onCancel={handleCancelRequest} onResubmit={handleResubmitRequest} />}
            {view === 'manager' && <ManagerView requests={requests} onAction={handleAction} onPreviewImage={setPreviewImage} />}
            {view === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-300 text-center">
                <header className="text-left"><h1 className="text-2xl font-bold text-slate-800">โปรไฟล์</h1></header>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-24 h-24 bg-indigo-50 rounded-2xl mx-auto flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="profile" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                  <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest mt-1 mb-6">{user.position}</p>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[9px] text-slate-400 font-bold uppercase">Staff ID</p><p className="font-bold text-slate-800">{user.staffId}</p></div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[9px] text-slate-400 font-bold uppercase">Site</p><p className="font-bold text-slate-800">{user.siteId}</p></div>
                  </div>
                </div>
                <button onClick={() => setIsLoggedIn(false)} className="w-full py-4 text-rose-500 font-bold bg-rose-50 rounded-2xl">ออกจากระบบ</button>
              </div>
            )}
          </>
        )}
      </div>

      {previewImage && <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 px-6 py-3 flex justify-around items-center z-50">
        {[
          { icon: Home, label: 'หน้าแรก', view: 'dashboard' },
          { icon: History, label: 'ประวัติ', view: 'history' },
          ...(user.roleType === UserRole.MANAGER ? [{ icon: ShieldCheck, label: 'อนุมัติ', view: 'manager' }] : []),
          { icon: User, label: 'โปรไฟล์', view: 'profile' }
        ].map((item) => (
          <button 
            key={item.view}
            className={`flex flex-col items-center gap-1 transition-all ${view === item.view ? 'text-indigo-600' : 'text-slate-400'}`}
            onClick={() => {
              setView(item.view);
              if (item.view !== 'new') setPrefillData(undefined);
            }}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
