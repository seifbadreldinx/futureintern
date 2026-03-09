import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coins, ShoppingBag, History, ArrowLeft, Sparkles, Gift, Zap, Crown, Loader2, CheckCircle } from 'lucide-react';
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'store' | 'history' | 'pricing'>('store');
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [packages, setPackages] = useState<PointsPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balRes, storeRes, txnRes, pricingRes] = await Promise.all([
        api.points.getBalance(),
        api.points.getStore(),
        api.points.getTransactions(),
        api.points.getPricing(),
      ]);
      setBalance(balRes);
      setPackages(storeRes.packages || []);
      setTransactions(txnRes.transactions || []);
      setServices(pricingRes.services || []);
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
      setSuccessMsg(res.message || 'Purchase successful!');
      setBalance((prev) => prev ? { ...prev, balance: res.new_balance } : prev);
      // Refresh transactions
      const txnRes = await api.points.getTransactions();
      setTransactions(txnRes.transactions || []);
    } catch (err: any) {
      alert(err?.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
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
      default: return 'bg-gray-100 text-gray-700';
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-slate-400">Total Earned</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{balance?.total_earned ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-slate-400">Total Spent</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{balance?.total_spent ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-slate-400">Available</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{balance?.balance ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
          {([
            { id: 'store' as const, label: 'Buy Points', icon: ShoppingBag },
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{txn.description || txn.transaction_type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTxnBadgeColor(txn.transaction_type)}`}>
                        {txn.transaction_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${getTxnColor(txn.amount)}`}>
                      {txn.amount > 0 ? '+' : ''}{txn.amount}
                    </p>
                    <p className="text-xs text-gray-400">Bal: {txn.balance_after}</p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-slate-400">No transactions yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
