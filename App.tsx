
import React, { useState } from 'react';
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
  LogIn
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

// --- Sub-components ---

const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const styles = {
    [LeaveStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [LeaveStatus.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [LeaveStatus.REJECTED]: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};

interface DashboardCardProps {
  title: string;
  value: number;
  total: number;
  colorClass: string;
}

const DashboardCard = ({ title, value, total, colorClass }: DashboardCardProps) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <span className="text-slate-900 font-bold">{total - value} <span className="text-xs text-slate-400 font-normal">left</span></span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
        <div 
          className={`h-2 rounded-full ${colorClass}`} 
          style={{ width: `${Math.min(100, ( (total-value) / total) * 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 text-right">{value} days used of {total}</p>
    </div>
  );
};

// --- Login View (Updated to match provided image) ---

const LoginView = ({ onLogin }: { onLogin: (staffId: string) => void }) => {
  const [staffId, setStaffId] = useState('');
  const dummyLineId = "Ufd0e0827bd454c6fb7024fe9e47b"; // Truncated as per UI visual

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffId.trim()) {
      onLogin(staffId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-300/50 text-center border border-slate-50 relative">
        
        {/* Profile Avatar Top Right */}
        <div className="absolute top-8 right-8">
           <div className="w-12 h-12 rounded-full border-2 border-emerald-100 p-0.5 bg-emerald-50">
              <div className="w-full h-full rounded-full bg-slate-200 overflow-hidden">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="profile" />
              </div>
           </div>
        </div>

        {/* Top Clock Icon */}
        <div className="flex justify-center mb-6">
           <div className="bg-blue-600 p-5 rounded-[1.5rem] shadow-lg shadow-blue-200">
              <Clock className="text-white" size={40} strokeWidth={2.5} />
           </div>
        </div>

        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">LMS</h1>
        <p className="text-slate-400 mt-2 mb-12 font-medium italic text-sm">Leave Management System</p>

        <form onSubmit={handleSubmit} className="space-y-8 text-left">
          <div className="space-y-3">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest px-2">User ID</label>
            <div className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-slate-500 text-sm overflow-hidden text-ellipsis whitespace-nowrap font-medium">
              {dummyLineId}...
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest px-2">Staff ID</label>
            <input 
              type="text"
              placeholder="กรอกรหัสพนักงาน"
              className="w-full bg-white border border-slate-200 p-5 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300 font-medium"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-blue-300 hover:bg-blue-700 transition-all active:scale-[0.97] text-lg"
          >
            Log In
          </button>
        </form>

        <p className="mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Management by SMC Property Soft
        </p>
      </div>
    </div>
  );
};

// --- Main Views ---

const DashboardView = ({ 
  user, 
  balances, 
  requests, 
  onNavigate 
}: { 
  user: UserProfile, 
  balances: LeaveBalance[], 
  requests: LeaveRequest[],
  onNavigate: (view: string) => void
}) => {
  const recentRequests = requests.slice(0, 3);
  
  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sawatdee, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 text-sm">{user.position}</p>
        </div>
        <div className="bg-indigo-600 p-2 rounded-full text-white shadow-lg shadow-indigo-200 cursor-pointer" onClick={() => onNavigate('new')}>
          <PlusCircle size={24} />
        </div>
      </header>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">My Leave Balances</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {balances.map((b) => (
            <DashboardCard 
              key={b.type} 
              title={b.type} 
              value={b.used} 
              total={b.total} 
              colorClass={b.type === LeaveType.SICK ? 'bg-rose-500' : b.type === LeaveType.ANNUAL ? 'bg-indigo-500' : 'bg-amber-500'}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Requests</h2>
          <button 
            className="text-indigo-600 text-sm font-medium flex items-center gap-1"
            onClick={() => onNavigate('history')}
          >
            View all <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {recentRequests.map((req) => (
            <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${req.status === LeaveStatus.APPROVED ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  <Calendar size={20} className={req.status === LeaveStatus.APPROVED ? 'text-emerald-600' : 'text-slate-600'} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{req.type}</h4>
                  <p className="text-xs text-slate-500">{req.startDate} to {req.endDate}</p>
                </div>
              </div>
              <StatusBadge status={req.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 p-6 rounded-2xl border border-slate-200 text-center">
        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
           <AlertCircle size={24} className="text-slate-400" />
        </div>
        <h4 className="text-sm font-bold text-slate-700">Need Help?</h4>
        <p className="text-xs text-slate-500 mt-1">Please contact the HR Department directly for policy inquiries.</p>
      </section>
    </div>
  );
};

const NewRequestView = ({ 
  onSubmit 
}: { 
  onSubmit: (data: Partial<LeaveRequest>) => void 
}) => {
  const [formData, setFormData] = useState({
    type: LeaveType.ANNUAL,
    startDate: '',
    endDate: '',
    reason: '',
    delegate: '',
  });

  const [error, setError] = useState('');

  const handleSumbit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setError('Please fill in all required fields.');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      setError('End date cannot be before start date.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">New Request</h1>
        <p className="text-slate-500 text-sm">Fill in details for your leave application.</p>
      </header>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-rose-100">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSumbit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</label>
          <select 
            className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as LeaveType})}
          >
            {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
            <input 
              type="date"
              className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
            <input 
              type="date"
              className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</label>
          <textarea 
            rows={3}
            className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Please specify the reason for your leave..."
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delegate Work To (Optional)</label>
          <input 
            type="text"
            className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Team member name"
            value={formData.delegate}
            onChange={(e) => setFormData({...formData, delegate: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex justify-center items-center gap-2"
        >
          <PlusCircle size={20} />
          Submit Application
        </button>
      </form>
    </div>
  );
};

const HistoryView = ({ requests }: { requests: LeaveRequest[] }) => {
  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Leave History</h1>
        <p className="text-slate-500 text-sm">Review your past and pending applications.</p>
      </header>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
            <p>No leave applications found.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{req.type}</h3>
                  <p className="text-xs text-slate-400">Applied on {req.appliedDate}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-500" />
                  <span>{req.startDate} — {req.endDate}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 italic">"{req.reason}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ManagerView = ({ 
  requests, 
  onAction 
}: { 
  requests: LeaveRequest[], 
  onAction: (id: string, status: LeaveStatus, reason?: string) => void 
}) => {
  const pending = requests.filter(r => r.status === LeaveStatus.PENDING);

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Approval Queue</h1>
        <p className="text-slate-500 text-sm">Review applications from your team members.</p>
      </header>

      <div className="space-y-4">
        {pending.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20 text-emerald-500" />
            <p>Your queue is clear. Good job!</p>
          </div>
        ) : (
          pending.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    {req.staffName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{req.staffName}</h3>
                    <p className="text-xs text-slate-400">Staff ID: {req.staffId}</p>
                  </div>
                </div>
                <div className="text-right">
                   <h3 className="font-bold text-indigo-600 text-sm">{req.type}</h3>
                   <p className="text-[10px] text-slate-400 italic">24h SLA</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold">Period</span>
                    <span className="text-slate-900 font-bold">{req.startDate} to {req.endDate}</span>
                 </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    const r = prompt("Enter rejection reason:");
                    if (r) onAction(req.id, LeaveStatus.REJECTED, r);
                  }}
                  className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all text-sm"
                >
                  Decline
                </button>
                <button 
                  onClick={() => onAction(req.id, LeaveStatus.APPROVED)}
                  className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Approve
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
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [balances] = useState<LeaveBalance[]>(INITIAL_BALANCES);
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);

  const handleLogin = (staffId: string) => {
    setIsLoggedIn(true);
  };

  const toggleRole = () => {
    if (user.roleType === UserRole.EMPLOYEE) {
      setUser(MOCK_MANAGER);
    } else {
      setUser(MOCK_USER);
    }
    setView('dashboard');
  };

  const handleCreateRequest = (data: Partial<LeaveRequest>) => {
    const newRequest: LeaveRequest = {
      id: `REQ-${Math.floor(Math.random() * 1000)}`,
      staffId: user.staffId,
      staffName: user.name,
      type: data.type || LeaveType.ANNUAL,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      reason: data.reason || '',
      delegate: data.delegate || '',
      status: LeaveStatus.PENDING,
      appliedDate: new Date().toISOString().split('T')[0],
    };

    setRequests([newRequest, ...requests]);
    setView('history');
  };

  const handleApprovalAction = (id: string, status: LeaveStatus, reason?: string) => {
    setRequests(requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          approverId: user.staffId,
          approverReason: reason,
          approvalDate: new Date().toISOString().split('T')[0]
        };
      }
      return r;
    }));
  };

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
             <ClipboardList size={20} />
           </div>
           <span className="font-black text-slate-800 tracking-tight">LeaveFlow</span>
        </div>
        <button 
          onClick={toggleRole}
          className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 px-2 py-1 rounded hover:bg-white transition-all"
        >
          {user.roleType} mode
        </button>
      </div>

      <div className="px-6 pt-2 h-full overflow-y-auto">
        {view === 'dashboard' && <DashboardView user={user} balances={balances} requests={requests} onNavigate={setView} />}
        {view === 'new' && <NewRequestView onSubmit={handleCreateRequest} />}
        {view === 'history' && <HistoryView requests={requests} />}
        {view === 'manager' && <ManagerView requests={requests} onAction={handleApprovalAction} />}
        {view === 'profile' && (
           <div className="space-y-6">
             <header>
                <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
             </header>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full mx-auto flex items-center justify-center text-indigo-600 mb-4 border-2 border-indigo-100">
                   <User size={48} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                <p className="text-slate-500 mb-6">{user.position}</p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Staff ID</p>
                    <p className="text-sm font-semibold text-slate-700">{user.staffId}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Site ID</p>
                    <p className="text-sm font-semibold text-slate-700">{user.siteId}</p>
                  </div>
                </div>
             </div>
             <button 
              className="w-full text-center text-rose-500 font-bold py-2"
              onClick={() => setIsLoggedIn(false)}
             >
              Sign Out
             </button>
           </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex justify-around items-center z-50">
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
          onClick={() => setView('dashboard')}
        >
          <Home size={24} />
          <span className="text-[10px] font-bold">HOME</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${view === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}
          onClick={() => setView('history')}
        >
          <ClipboardList size={24} />
          <span className="text-[10px] font-bold">HISTORY</span>
        </button>
        {user.roleType === UserRole.MANAGER && (
          <button 
            className={`flex flex-col items-center gap-1 transition-all ${view === 'manager' ? 'text-indigo-600' : 'text-slate-400'}`}
            onClick={() => setView('manager')}
          >
            <ShieldCheck size={24} />
            <span className="text-[10px] font-bold">APPROVE</span>
          </button>
        )}
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${view === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}
          onClick={() => setView('profile')}
        >
          <User size={24} />
          <span className="text-[10px] font-bold">PROFILE</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
