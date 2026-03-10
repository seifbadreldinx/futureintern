import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  LogOut,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  UserPlus,
  Building2,
  Activity,
  Download,
  Plus,
  X,
  Shield,
  History,
  Lock,
  ShieldCheck,
  Terminal,
  Coins,
  Gift,
  DollarSign,
  Package,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

type AdminSection = 'dashboard' | 'users' | 'internships' | 'applications' | 'points' | 'logs_security';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

export function Admin() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchType, setUserSearchType] = useState('all'); // 'all', 'name', 'id'
  const [internshipSearchQuery, setInternshipSearchQuery] = useState('');
  const [applicationSearchQuery, setApplicationSearchQuery] = useState('');
  const [statsData, setStatsData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const navigate = useNavigate();

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    company_name: '',
    industry: ''
  });
  const [showEditInternshipModal, setShowEditInternshipModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState<any>(null);
  const [editInternshipForm, setEditInternshipForm] = useState<any>({});

  // Points management state
  const [pointsStats, setPointsStats] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [servicePricing, setServicePricing] = useState<any[]>([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageForm, setPackageForm] = useState({ name: '', points: 0, price: 0, discount_percent: 0, description: '', is_active: true });
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({ user_id: '', amount: 0, reason: '' });
  const [pointsSubTab, setPointsSubTab] = useState<'stats' | 'packages' | 'pricing' | 'grant'>('stats');

  const handleUpdateApplicationStatus = async (id: number, status: string) => {
    try {
      await api.applications.updateStatus(id, status);
      // Refresh applications list
      const appsList = await api.admin.listApplications();
      setApplications(Array.isArray(appsList) ? appsList : appsList?.applications || []);
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.admin.createUser(newUserForm);
      // Refresh user list
      const usersList = await api.admin.listUsers();
      setUsers(Array.isArray(usersList) ? usersList : usersList?.users || []);
      setShowAddUserModal(false);
      setNewUserForm({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        company_name: '',
        industry: ''
      });
      alert('User created successfully!');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.admin.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleDeleteInternship = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) return;
    try {
      await api.admin.deleteInternship(id);
      setInternships(internships.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to delete internship:', error);
    }
  };

  const handleEditInternship = (internship: any) => {
    setEditingInternship(internship);
    setEditInternshipForm({
      title: internship.title,
      description: internship.description,
      location: internship.location,
      type: internship.type,
      duration: internship.duration,
      salary_range: internship.salary_range || '',
      deadline: internship.deadline ? new Date(internship.deadline).toISOString().split('T')[0] : '',
      status: internship.status || 'active',
      is_open: internship.is_open ?? true,
      skills_required: internship.skills_required || [],
      responsibilities: internship.responsibilities || [],
      requirements: internship.requirements || [],
      benefits: internship.benefits || [],
      interests_matched: internship.interests_matched || []
    });
    setShowEditInternshipModal(true);
  };

  const handleUpdateInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await api.admin.updateInternship(editingInternship.id, editInternshipForm);
      setInternships(internships.map(i => i.id === updated.id ? updated : i));
      setShowEditInternshipModal(false);
      alert('Internship updated successfully!');
    } catch (error: any) {
      console.error('Failed to update internship:', error);
      alert(error.message || 'Failed to update internship');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== Points Handlers ==========
  const openCreatePackage = () => {
    setEditingPackage(null);
    setPackageForm({ name: '', points: 0, price: 0, discount_percent: 0, description: '', is_active: true });
    setShowPackageModal(true);
  };

  const openEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      points: pkg.points,
      price: pkg.price,
      discount_percent: pkg.discount_percent || 0,
      description: pkg.description || '',
      is_active: pkg.is_active,
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPackage) {
        const res = await api.points.adminUpdatePackage(editingPackage.id, packageForm);
        setPackages(packages.map(p => p.id === editingPackage.id ? res.package : p));
      } else {
        const res = await api.points.adminCreatePackage(packageForm);
        setPackages([...packages, res.package]);
      }
      setShowPackageModal(false);
      alert(editingPackage ? 'Package updated!' : 'Package created!');
    } catch (error: any) {
      alert(error.message || 'Failed to save package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await api.points.adminDeletePackage(id);
      setPackages(packages.filter(p => p.id !== id));
    } catch (error: any) {
      alert(error.message || 'Failed to delete package');
    }
  };

  const handleTogglePricing = async (pricing: any, field: string, value: any) => {
    try {
      const res = await api.points.adminUpdatePricing(pricing.id, { [field]: value });
      setServicePricing(servicePricing.map(s => s.id === pricing.id ? res.service : s));
    } catch (error: any) {
      alert(error.message || 'Failed to update pricing');
    }
  };

  const handleGrantPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.points.adminGrantPoints(Number(grantForm.user_id), grantForm.amount, grantForm.reason);
      alert(res.message || 'Points granted!');
      setShowGrantModal(false);
      setGrantForm({ user_id: '', amount: 0, reason: '' });
      // Refresh stats
      const statsRes = await api.points.adminGetStats().catch(() => null);
      if (statsRes) setPointsStats(statsRes);
    } catch (error: any) {
      alert(error.message || 'Failed to grant points');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchBaseData = async () => {
      setIsLoading(true);
      try {
        // Fetch stats, interns, apps
        const [stats, internsList, appsList] = await Promise.all([
          api.admin.getStats().catch(err => { console.error('Stats error:', err); return null; }),
          api.admin.listInternships().catch(err => { console.error('Internships error:', err); return []; }),
          api.admin.listApplications().catch(err => { console.error('Applications error:', err); return []; }),
        ]);

        setStatsData(stats);
        setInternships(Array.isArray(internsList) ? internsList : internsList?.internships || []);
        setApplications(Array.isArray(appsList) ? appsList : appsList?.applications || []);

        // Fetch logs and sec stats separately to not block main data
        api.admin.listAuditLogs()
          .then(setAuditLogs)
          .catch(err => console.error('Audit logs error:', err));

        api.admin.getSecurityStats()
          .then(setSecurityStats)
          .catch(err => console.error('Security stats error:', err));

      } catch (error) {
        console.error('Failed to fetch base admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBaseData();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsFetchingUsers(true);
      try {
        const usersList = await api.admin.listUsers(userSearchQuery, userSearchType);
        setUsers(Array.isArray(usersList) ? usersList : usersList?.users || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsFetchingUsers(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300); // Simple debounce

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, userSearchType]);

  // Fetch points data when Points section is active
  useEffect(() => {
    if (activeSection !== 'points') return;
    const fetchPointsData = async () => {
      try {
        const [statsRes, pkgRes, pricingRes] = await Promise.all([
          api.points.adminGetStats().catch(() => null),
          api.points.adminGetPackages().catch(() => ({ packages: [] })),
          api.points.adminGetPricing().catch(() => ({ services: [] })),
        ]);
        if (statsRes) setPointsStats(statsRes);
        setPackages(pkgRes?.packages || []);
        setServicePricing(pricingRes?.services || []);
      } catch (err) {
        console.error('Failed to fetch points data:', err);
      }
    };
    fetchPointsData();
  }, [activeSection]);

  const stats: StatCard[] = [
    {
      title: 'Total Users',
      value: statsData?.total_users || 0,
      change: '+0%',
      trend: 'up',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Internships',
      value: statsData?.total_internships || 0,
      change: '+0%',
      trend: 'up',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      title: 'Applications',
      value: statsData?.total_applications || 0,
      change: '+0%',
      trend: 'up',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Verify',
      value: statsData?.pending_verifications || 0,
      change: 'Pending',
      trend: 'up',
      icon: <Building2 className="w-6 h-6" />,
      color: 'bg-orange-500',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Under Review': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      Inactive: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400',
    };
    return styles[status] || styles.Inactive;
  };

  const menuItems = [
    { id: 'dashboard' as AdminSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as AdminSection, label: 'Users', icon: Users },
    { id: 'internships' as AdminSection, label: 'Internships', icon: Briefcase },
    { id: 'applications' as AdminSection, label: 'Applications', icon: FileText },
    { id: 'points' as AdminSection, label: 'Points System', icon: Coins },
    { id: 'logs_security' as AdminSection, label: 'Logs & Security', icon: Shield },
  ];


  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-slate-800 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-slate-700 transition-colors shadow-lg">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-950/20 border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md dark:hover:shadow-slate-950/40 transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} p-3 rounded-lg text-white shadow-lg`}>
                      {stat.icon}
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                      <TrendingUp className="w-4 h-4" />
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Dashboard data grid */}

            {/* Recent Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-950/20 border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Users</h3>
                  <Link to="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
                </div>
                <div className="space-y-3">
                  {users.slice(0, 4).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/30 rounded-lg border border-transparent dark:border-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-200">{user.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.is_active ? 'Active' : 'Inactive')}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Internships */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-950/20 border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Internships</h3>
                  <Link to="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
                </div>
                <div className="space-y-3">
                  {internships.slice(0, 4).map((internship) => (
                    <div key={internship.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/30 rounded-lg border border-transparent dark:border-slate-800/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-200">{internship.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">{internship.company_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(internship.status || 'Active')}`}>
                        {internship.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
              <div className="flex flex-1 max-w-2xl gap-3">
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isFetchingUsers ? (
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    )}
                  </div>
                  <input
                    id="admin-user-search"
                    name="admin_user_search"
                    type="text"
                    placeholder={`Search users by ${userSearchType === 'all' ? 'name, email, or ID' : userSearchType}...`}
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'name', label: 'Name' },
                    { id: 'id', label: 'ID' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setUserSearchType(type.id)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${userSearchType === type.id
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden md:inline">Add User</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-950/20 border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                          #{user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.is_active ? 'Active' : 'Inactive')}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'internships':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Internship Management</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <input
                    id="admin-internship-search"
                    name="admin_internship_search"
                    type="text"
                    placeholder="Search internships..."
                    value={internshipSearchQuery}
                    onChange={(e) => setInternshipSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  />
                </div>
                <button
                  onClick={() => navigate('/create-internship')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Internship
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map((internship) => (
                <div key={internship.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-950/20 border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md dark:hover:shadow-slate-950/40 transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{internship.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">{internship.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(internship.status || 'Active')}`}>
                      {internship.status || 'Active'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-slate-400 font-medium">Live Posting</span>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-800">
                    <button
                      onClick={() => navigate(`/internship/${internship.id}`)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditInternship(internship)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInternship(internship.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'applications':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Application Management</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <input
                    id="admin-application-search"
                    name="admin_application_search"
                    type="text"
                    placeholder="Search applications..."
                    value={applicationSearchQuery}
                    onChange={(e) => setApplicationSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-950/20 border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Internship</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{app.student_name}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{app.student_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-slate-200">{app.internship_title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-slate-400">{app.company_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{new Date(app.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors" title="Accept">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'points':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Points System Management</h2>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 w-fit">
              {([
                { id: 'stats' as const, label: 'Statistics', icon: TrendingUp },
                { id: 'packages' as const, label: 'Packages', icon: Package },
                { id: 'pricing' as const, label: 'Service Pricing', icon: DollarSign },
                { id: 'grant' as const, label: 'Grant Points', icon: Gift },
              ]).map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPointsSubTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      pointsSubTab === tab.id
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Stats Sub-tab */}
            {pointsSubTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Points in Circulation', value: pointsStats?.total_points_in_circulation ?? '—', icon: <Coins className="w-6 h-6" />, color: 'bg-amber-500' },
                    { title: 'Total Purchases', value: pointsStats?.total_purchases ?? '—', icon: <DollarSign className="w-6 h-6" />, color: 'bg-green-500' },
                    { title: 'Total Purchased Points', value: pointsStats?.total_purchased_points ?? '—', icon: <TrendingUp className="w-6 h-6" />, color: 'bg-blue-500' },
                    { title: 'Active Packages', value: pointsStats?.active_packages ?? '—', icon: <Package className="w-6 h-6" />, color: 'bg-purple-500' },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`${stat.color} p-3 rounded-lg text-white`}>{stat.icon}</div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{stat.title}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: 'Service Charges', value: pointsStats?.total_service_charges ?? '—', sub: `${pointsStats?.total_spent_points ?? 0} pts spent` },
                    { title: 'Admin Grants', value: pointsStats?.total_admin_grants ?? '—', sub: 'Total grant operations' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                      <p className="text-sm text-gray-500 dark:text-slate-400">{item.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Packages Sub-tab */}
            {pointsSubTab === 'packages' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={openCreatePackage}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    New Package
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Price ($)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Discount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {packages.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{pkg.name}</div>
                            {pkg.description && <div className="text-xs text-gray-500 dark:text-slate-400">{pkg.description}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-600 dark:text-amber-400">{pkg.points}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${pkg.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{pkg.discount_percent > 0 ? `${pkg.discount_percent}%` : '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pkg.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-500'}`}>
                              {pkg.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEditPackage(pkg)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeletePackage(pkg.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {packages.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">No packages found. Create one to get started.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pricing Sub-tab */}
            {pointsSubTab === 'pricing' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Cost (pts)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">First Free</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Active</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Update Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {servicePricing.map((svc) => (
                        <tr key={svc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{svc.display_name || svc.service_key}</div>
                            {svc.description && <div className="text-xs text-gray-500 dark:text-slate-400">{svc.description}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min={0}
                              value={svc.points_cost}
                              onChange={(e) => {
                                const newVal = parseInt(e.target.value) || 0;
                                setServicePricing(servicePricing.map(s => s.id === svc.id ? { ...s, points_cost: newVal } : s));
                              }}
                              onBlur={(e) => handleTogglePricing(svc, 'points_cost', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={() => handleTogglePricing(svc, 'first_time_free', !svc.first_time_free)} className="transition-colors">
                              {svc.first_time_free
                                ? <ToggleRight className="w-8 h-8 text-green-500" />
                                : <ToggleLeft className="w-8 h-8 text-gray-400 dark:text-slate-600" />}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={() => handleTogglePricing(svc, 'is_active', !svc.is_active)} className="transition-colors">
                              {svc.is_active
                                ? <ToggleRight className="w-8 h-8 text-green-500" />
                                : <ToggleLeft className="w-8 h-8 text-gray-400 dark:text-slate-600" />}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleTogglePricing(svc, 'points_cost', svc.points_cost)}
                              className="px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                      {servicePricing.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">No service pricing configured.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Grant Points Sub-tab */}
            {pointsSubTab === 'grant' && (
              <div className="space-y-6">
                <div className="max-w-lg">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-500" />
                      Grant Points to User
                    </h3>
                    <form onSubmit={handleGrantPoints} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">User ID</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={grantForm.user_id}
                          onChange={(e) => setGrantForm({ ...grantForm, user_id: e.target.value })}
                          placeholder="Enter user ID"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Points Amount</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={grantForm.amount || ''}
                          onChange={(e) => setGrantForm({ ...grantForm, amount: parseInt(e.target.value) || 0 })}
                          placeholder="e.g. 100"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Reason (optional)</label>
                        <input
                          type="text"
                          value={grantForm.reason}
                          onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}
                          placeholder="e.g. Contest reward"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Coins className="w-4 h-4" />
                            Grant Points
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'logs_security':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logs & Security Monitoring</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-100 dark:border-green-900/30">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-bold">System Secure</span>
              </div>
            </div>

            {/* Security Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Active Sessions', value: securityStats?.active_sessions || 0, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
                { title: 'Login Failures (24h)', value: securityStats?.login_failures_24h || 0, icon: <Lock className="w-6 h-6" />, color: 'bg-red-500' },
                { title: 'System Health', value: securityStats?.system_health || 'N/A', icon: <Activity className="w-6 h-6" />, color: 'bg-green-500' },
                { title: 'System Uptime', value: securityStats?.system_uptime || '99.9%', icon: <TrendingUp className="w-6 h-6" />, color: 'bg-indigo-500' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`${item.color} p-3 rounded-lg text-white`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{item.title}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Audit Logs Table */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    System Audit Logs
                  </h3>
                  <button className="text-sm text-blue-600 hover:underline">Refresh</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Admin ID</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3">Target</th>
                        <th className="px-6 py-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">#{log.admin_id}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-200">{log.action}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-500">{log.target_type}:{log.target_id}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No audit logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Security Insights */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-gray-400" />
                    Top Admin Actions
                  </h3>
                  <div className="space-y-4">
                    {securityStats?.top_admin_actions?.map((action: any, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-200">{action.admin}</p>
                          <p className="text-xs text-gray-500">{action.action}</p>
                        </div>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">
                          {action.count} ops
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl p-6 text-white border border-slate-800">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    Security Tip
                  </h4>
                  <p className="text-sm text-blue-100/80">
                    Always review audit logs after high-privilege operations. Ensure Super Admin roles are limited to essential personnel only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-center py-20 text-gray-500">Section coming soon...</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                View Site
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                User Dashboard
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeSection === item.id
                    ? 'bg-gray-900 dark:bg-slate-800 text-white shadow-lg'
                    : 'text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add New User
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  User Role
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                >
                  <option value="student">Student</option>
                  <option value="company">Company</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {newUserForm.role === 'company' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required={newUserForm.role === 'company'}
                      value={newUserForm.company_name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, company_name: e.target.value })}
                      placeholder="TechCorp Inc."
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      required={newUserForm.role === 'company'}
                      value={newUserForm.industry}
                      onChange={(e) => setNewUserForm({ ...newUserForm, industry: e.target.value })}
                      placeholder="Software, Finance, etc."
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Internship Modal */}
      {showEditInternshipModal && editingInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Internship
              </h3>
              <button
                onClick={() => setShowEditInternshipModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateInternship} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editInternshipForm.title}
                    onChange={(e) => setEditInternshipForm({ ...editInternshipForm, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={editInternshipForm.type}
                    onChange={(e) => setEditInternshipForm({ ...editInternshipForm, type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={editInternshipForm.description}
                  onChange={(e) => setEditInternshipForm({ ...editInternshipForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={editInternshipForm.location}
                    onChange={(e) => setEditInternshipForm({ ...editInternshipForm, location: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={editInternshipForm.duration}
                    onChange={(e) => setEditInternshipForm({ ...editInternshipForm, duration: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={editInternshipForm.salary_range}
                    onChange={(e) => setEditInternshipForm({ ...editInternshipForm, salary_range: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    required
                    value={editInternshipForm.deadline}
                    onChange={(e) => setEditInternshipForm({ ...editInternshipForm, deadline: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={editInternshipForm.status}
                    onChange={(e) => setEditInternshipForm({ ...editInternshipForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editInternshipForm.is_open}
                      onChange={(e) => setEditInternshipForm({ ...editInternshipForm, is_open: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Is Open</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditInternshipModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Create/Edit Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {editingPackage ? 'Edit Package' : 'New Package'}
              </h3>
              <button onClick={() => setShowPackageModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSavePackage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="e.g. Starter Pack"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Points</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={packageForm.points || ''}
                    onChange={(e) => setPackageForm({ ...packageForm, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={packageForm.price || ''}
                    onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Discount %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={packageForm.discount_percent || ''}
                  onChange={(e) => setPackageForm({ ...packageForm, discount_percent: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="Short description"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={packageForm.is_active}
                  onChange={(e) => setPackageForm({ ...packageForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Active</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingPackage ? 'Save Changes' : 'Create Package'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

