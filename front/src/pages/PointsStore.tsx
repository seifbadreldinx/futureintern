import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coins, ShoppingBag, History, ArrowLeft, Sparkles, Gift, Zap, Crown, Loader2, CheckCircle, Flame, Target, FileText, UserCheck, LogIn, Award, Star, Settings, ArrowUpRight, ArrowDownRight, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface PointsBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface PointsPackage {
  id: number;
  name: string;
  points: number;
  price: number;
  discount_percent: number;
  effective_price: number;
  description: string | null;
  is_active: boolean;
}

interface Transaction {
  id: number;
  amount: number;
  balance_after: number;
  transaction_type: string;
  service_name: string | null;
  description: string | null;
  created_at: string;
}

interface ServicePrice {
  id: number;
  service_key: string;
  display_name: string;
  points_cost: number;
  first_time_free: boolean;
  description: string | null;
}

export function PointsStore() {
  const { user, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'store' | 'earn' | 'history' | 'pricing' | 'purchases'>('store');
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [packages, setPackages] = useState<PointsPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [activities, setActivities] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [myPurchases, setMyPurchases] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balRes, storeRes, txnRes, pricingRes, earnRes, purchasesRes] = await Promise.all([
        api.points.getBalance(),
        api.points.getStore(),
        api.points.getTransactions(),
        api.points.getPricing(),
        api.points.getEarningActivities().catch(() => ({ activities: null })),
        api.points.getMyPurchases().catch(() => ({ requests: [] })),
      ]);
      setBalance(balRes);
      setPackages(storeRes.packages || []);
      setTransactions(txnRes.transactions || []);
      setServices(pricingRes.services || []);
      setActivities(earnRes.activities || null);
      setMyPurchases(purchasesRes.requests || []);
      // Sync navbar points badge with real balance
      refreshUserData();
    } catch (err) {
      console.error('Failed to load points data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (pkgId: number) => {
    setPurchasing(pkgId);
    setSuccessMsg(null);
    try {
      const res = await api.points.purchase(pkgId);
      setSuccessMsg(res.message || 'Purchase request submitted! Awaiting admin approval.');
      // Refresh purchases list
      const purchasesRes = await api.points.getMyPurchases().catch(() => ({ requests: [] }));
      setMyPurchases(purchasesRes.requests || []);
    } catch (err: any) {
      alert(err?.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const handleClaimDaily = async () => {
    setClaiming(true);
    setSuccessMsg(null);
    try {
      const res = await api.points.claimDaily();
      if (res.already_claimed) {
        setSuccessMsg('You already claimed your daily reward today! Come back tomorrow.');
      } else {
        const info = res.daily_reward;
        let msg = `+${info.daily_reward} daily login points!`;
        if (info.streak_bonus > 0) {
          msg += ` +${info.streak_bonus} streak bonus (${info.streak}-day streak)!`;
        }
        setSuccessMsg(msg);
        setBalance((prev) => prev ? { ...prev, balance: res.new_balance } : prev);
      }
      // Refresh activities and transactions
      const [earnRes, txnRes] = await Promise.all([
        api.points.getEarningActivities().catch(() => ({ activities: null })),
        api.points.getTransactions(),
      ]);
      setActivities(earnRes.activities || null);
      setTransactions(txnRes.transactions || []);
      refreshUserData();
    } catch (err: any) {
      alert(err?.message || 'Failed to claim daily reward');
    } finally {
      setClaiming(false);
    }
  };

  const getPackageIcon = (index: number) => {
    const icons = [Gift, Zap, Sparkles, Crown];
    const Icon = icons[index % icons.length];
    return <Icon className="w-8 h-8" />;
  };

  const getPackageColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-purple-500 to-purple-600',
      'from-amber-500 to-amber-600',
    ];
    return colors[index % colors.length];
  };

  const getTxnColor = (amount: number) => {
    return amount >= 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const getTxnBadgeColor = (type: string) => {
    switch (type) {
      case 'signup_bonus': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'purchase': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'service_charge': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'admin_grant': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'refund': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'daily_login': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'streak_bonus': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'application_reward': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
      case 'profile_completion': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTxnSourceInfo = (type: string) => {
    switch (type) {
      case 'signup_bonus': return { label: 'Sign-Up Bonus', tag: 'Bonus', icon: Gift, bg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' };
      case 'purchase': return { label: 'Points Purchase', tag: 'Purchase', icon: ShoppingBag, bg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' };
      case 'service_charge': return { label: 'Service Used', tag: 'Spent', icon: Settings, bg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' };
      case 'admin_grant': return { label: 'Admin Grant', tag: 'Granted', icon: Award, bg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' };
      case 'refund': return { label: 'Refund', tag: 'Refund', icon: ArrowUpRight, bg: 'bg-gray-100 dark:bg-slate-800', iconColor: 'text-gray-600 dark:text-gray-400' };
      case 'daily_login': return { label: 'Daily Login Reward', tag: 'Login', icon: LogIn, bg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' };
      case 'streak_bonus': return { label: 'Login Streak Bonus', tag: 'Streak', icon: Flame, bg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' };
      case 'application_reward': return { label: 'Application Reward', tag: 'Applied', icon: FileText, bg: 'bg-cyan-100 dark:bg-cyan-900/30', iconColor: 'text-cyan-600 dark:text-cyan-400' };
      case 'profile_completion': return { label: 'Profile Completed', tag: 'Profile', icon: UserCheck, bg: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' };
      default: return { label: type.replace(/_/g, ' '), tag: type, icon: Star, bg: 'bg-gray-100 dark:bg-slate-800', iconColor: 'text-gray-600 dark:text-gray-400' };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Please log in to access the Points Store</h2>
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Log In</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-gray-50 dark:bg-slate-950 transition-colors">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-8 h-8 text-amber-500" />
                  Points Store
                </h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Purchase points to unlock premium features</p>
              </div>
            </div>
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl px-6 py-4 text-white shadow-lg">
              <p className="text-sm opacity-80">Your Balance</p>
              <p className="text-3xl font-bold">{balance?.balance ?? 0} <span className="text-lg font-normal opacity-80">pts</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-slate-400">Total Earned</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{balance?.total_earned ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-slate-400">Total Spent</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{balance?.total_spent ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
          {([
            { id: 'store' as const, label: 'Buy Points', icon: ShoppingBag },
            { id: 'purchases' as const, label: 'My Purchases', icon: Clock },
            { id: 'earn' as const, label: 'Earn Points', icon: Target },
            { id: 'pricing' as const, label: 'Service Costs', icon: Coins },
            { id: 'history' as const, label: 'History', icon: History },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success message */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Store Tab */}
        {activeTab === 'store' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className={`bg-gradient-to-br ${getPackageColor(index)} p-6 text-white text-center`}>
                  {getPackageIcon(index)}
                  <h3 className="text-xl font-bold mt-2">{pkg.name}</h3>
                  <p className="text-4xl font-black mt-2">{pkg.points}<span className="text-lg font-normal opacity-80"> pts</span></p>
                </div>
                <div className="p-5">
                  {pkg.description && (
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{pkg.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    {pkg.discount_percent > 0 ? (
                      <div>
                        <span className="text-sm text-gray-400 line-through">${pkg.price.toFixed(2)}</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white ml-2">${pkg.effective_price.toFixed(2)}</span>
                        <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">-{pkg.discount_percent}%</span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-gray-900 dark:text-white">${pkg.price.toFixed(2)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing === pkg.id}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {purchasing === pkg.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><ShoppingBag className="w-4 h-4" /> Buy Now</>
                    )}
                  </button>
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <div className="col-span-4 text-center py-12 text-gray-500 dark:text-slate-400">
                No packages available right now. Check back later!
              </div>
            )}
          </div>
        )}

        {/* My Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Purchase Requests</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">When you buy a package, it goes to admin for approval. Points are credited once approved.</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {myPurchases.map((req) => (
                  <div key={req.id} className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={`flex-shrink-0 p-3 rounded-xl ${
                      req.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : req.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {req.status === 'pending' ? <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                       : req.status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                       : <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">{req.package_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{req.status}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(req.created_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {req.status === 'pending' && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Awaiting admin approval</p>
                      )}
                      {req.admin_note && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Note: {req.admin_note}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{req.points} pts</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">${req.price}</p>
                    </div>
                  </div>
                ))}
                {myPurchases.length === 0 && (
                  <div className="p-12 text-center text-gray-500 dark:text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No purchase requests yet</p>
                    <p className="text-sm mt-1">Buy a package from the store to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Earn Points Tab */}
        {activeTab === 'earn' && activities && (
          <div className="space-y-6">
            {/* Daily Login Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Flame className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activities.daily_login.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{activities.daily_login.description}</p>
                  </div>
                </div>
                <button
                  onClick={handleClaimDaily}
                  disabled={claiming || activities.daily_login.claimed_today}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    activities.daily_login.claimed_today
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20'
                  }`}
                >
                  {claiming ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</>
                  ) : activities.daily_login.claimed_today ? (
                    <><CheckCircle className="w-4 h-4" /> Claimed Today</>
                  ) : (
                    <>Claim +{activities.daily_login.points} pts</>
                  )}
                </button>
              </div>

              {/* Streak Info */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{activities.daily_login.streak}</span>
                    <span className="text-sm text-gray-500 dark:text-slate-400">day streak</span>
                  </div>
                  {activities.daily_login.next_streak_bonus && (
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                      Next bonus: <span className="font-bold text-amber-600 dark:text-amber-400">+{activities.daily_login.next_streak_bonus.bonus} pts</span> in {activities.daily_login.next_streak_bonus.days_remaining} day{activities.daily_login.next_streak_bonus.days_remaining !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Streak Milestones */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(activities.streak_milestones.milestones).map(([days, bonus]) => {
                    const reached = activities.daily_login.streak >= Number(days);
                    return (
                      <div key={days} className={`rounded-xl p-4 text-center border transition-all ${
                        reached
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'
                      }`}>
                        <p className={`text-2xl font-black ${reached ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                          {reached ? '✓' : String(days)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{String(days)}-day streak</p>
                        <p className={`text-sm font-bold mt-1 ${reached ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-slate-300'}`}>
                          +{String(bonus)} pts
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Profile Completion Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                    <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activities.profile_completion.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{activities.profile_completion.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{activities.profile_completion.percentage}%</p>
                    <p className="text-xs text-gray-500">{activities.profile_completion.filled}/{activities.profile_completion.total_fields} fields</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${activities.profile_completion.percentage}%` }}
                  />
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(activities.profile_completion.fields as Record<string, boolean>).map(([field, filled]) => (
                    <div key={field} className={`flex items-center gap-2 p-3 rounded-lg border ${
                      filled
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'
                    }`}>
                      {filled ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-slate-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium capitalize ${filled ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'}`}>
                        {field}
                      </span>
                      {!filled && (
                        <span className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400">+{activities.profile_completion.points_per_field}</span>
                      )}
                    </div>
                  ))}
                </div>
                {activities.profile_completion.percentage < 100 && (
                  <Link to="/dashboard" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                    Complete your profile →
                  </Link>
                )}
              </div>
            </div>

            {/* Applications Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                  <FileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activities.applications.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{activities.applications.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{activities.applications.total_applications}</p>
                  <p className="text-xs text-gray-500">applications rewarded</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/browse" className="inline-block text-cyan-600 dark:text-cyan-400 text-sm font-medium hover:underline">
                  Browse internships to apply →
                </Link>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'earn' && !activities && (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Unable to load earning activities. Please try again later.
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Service Point Costs</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">How many points each service costs</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {services.map((svc) => (
                <div key={svc.id} className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{svc.display_name}</h3>
                    {svc.description && <p className="text-sm text-gray-500 dark:text-slate-400">{svc.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {svc.first_time_free && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                        1st time free
                      </span>
                    )}
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{svc.points_cost} <span className="text-sm font-normal text-gray-500">pts</span></span>
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-slate-400">No service pricing configured yet.</div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Points Activity Log</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Every point earned and spent, with its source</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {transactions.map((txn) => {
                  const source = getTxnSourceInfo(txn.transaction_type);
                  const SourceIcon = source.icon;
                  return (
                    <div key={txn.id} className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-3 rounded-xl ${source.bg}`}>
                        <SourceIcon className={`w-5 h-5 ${source.iconColor}`} />
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{source.label}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTxnBadgeColor(txn.transaction_type)}`}>
                            {source.tag}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 truncate">{txn.description || '—'}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                          {new Date(txn.created_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}{' '}
                          at {new Date(txn.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          {txn.amount >= 0 ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                          <p className={`text-lg font-bold ${getTxnColor(txn.amount)}`}>
                            {txn.amount > 0 ? '+' : ''}{txn.amount} pts
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500">Balance: {txn.balance_after} pts</p>
                      </div>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <div className="p-12 text-center text-gray-500 dark:text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No transactions yet</p>
                    <p className="text-sm mt-1">Your points activity will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
