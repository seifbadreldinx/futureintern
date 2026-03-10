import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
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
  ShoppingCart,
  Clock,
  Star,
  MapPin,
} from 'lucide-react';

type AdminSection = 'dashboard' | 'users' | 'companies' | 'internships' | 'applications' | 'points' | 'logs_security';

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
  const [pointsSubTab, setPointsSubTab] = useState<'stats' | 'packages' | 'pricing' | 'grant' | 'requests'>('stats');
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [purchaseFilter, setPurchaseFilter] = useState('pending');

  // Companies management
  const [companies, setCompanies] = useState<any[]>([]);

  // Edit user modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState<any>({ full_name: '', email: '', role: '', company_name: '', university: '', major: '', phone: '' });

  // View user detail
  const [viewingUser, setViewingUser] = useState<any>(null);

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

  const handleViewUser = (user: any) => {
    setViewingUser(user);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserForm({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'student',
      company_name: user.company_name || '',
      university: user.university || '',
      major: user.major || '',
      phone: user.phone || '',
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await api.admin.updateUser(editingUser.id, editUserForm);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
      setShowEditUserModal(false);
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCompany = async (companyId: number) => {
    try {
      await api.admin.verifyCompany(companyId);
      setCompanies(companies.map(c => c.id === companyId ? { ...c, is_verified: true } : c));
      // Also update stats
      const stats = await api.admin.getStats().catch(() => null);
      if (stats) setStatsData(stats);
      alert('Company verified successfully!');
    } catch (error: any) {
      console.error('Failed to verify company:', error);
      alert(error.message || 'Failed to verify company');
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
        // Fetch stats, interns, apps, companies
        const [stats, internsList, appsList, companiesList] = await Promise.all([
          api.admin.getStats().catch(err => { console.error('Stats error:', err); return null; }),
          api.admin.listInternships().catch(err => { console.error('Internships error:', err); return []; }),
          api.admin.listApplications().catch(err => { console.error('Applications error:', err); return []; }),
          api.admin.listCompanies().catch(err => { console.error('Companies error:', err); return []; }),
        ]);

        setStatsData(stats);
        setInternships(Array.isArray(internsList) ? internsList : internsList?.internships || []);
        setApplications(Array.isArray(appsList) ? appsList : appsList?.applications || []);
        setCompanies(Array.isArray(companiesList) ? companiesList : []);

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
        const [statsRes, pkgRes, pricingRes, reqsRes] = await Promise.all([
          api.points.adminGetStats().catch(() => null),
          api.points.adminGetPackages().catch(() => ({ packages: [] })),
          api.points.adminGetPricing().catch(() => ({ services: [] })),
          api.points.adminGetPurchaseRequests('pending').catch(() => ({ requests: [] })),
        ]);
        if (statsRes) setPointsStats(statsRes);
        setPackages(pkgRes?.packages || []);
        setServicePricing(pricingRes?.services || []);
        setPurchaseRequests(reqsRes?.requests || []);
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
    { id: 'companies' as AdminSection, label: 'Companies', icon: Building2 },
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dashboard Overview</h2>
              <button
                onClick={() => {
                  const rows = [
                    ['FutureIntern Admin Report'],
                    ['Generated', new Date().toLocaleString()],
                    [],
                    ['Metric', 'Value'],
                    ['Total Users', statsData?.total_users ?? 0],
                    ['Active Internships', statsData?.total_internships ?? 0],
                    ['Applications', statsData?.total_applications ?? 0],
                    ['Pending Verifications', statsData?.pending_verifications ?? 0],
                    [],
                    ['Users'],
                    ['Name', 'Email', 'Role', 'Joined'],
                    ...users.map((u: any) => [u.name, u.email, u.role, u.created_at ? new Date(u.created_at).toLocaleDateString() : '']),
                    [],
                    ['Internships'],
                    ['Title', 'Company', 'Location', 'Status'],
                    ...internships.map((i: any) => [i.title, i.company_name || '', i.location || '', i.status || '']),
                    [],
                    ['Applications'],
                    ['Applicant', 'Internship', 'Status', 'Date'],
                    ...applications.map((a: any) => [a.user_name || a.applicant_name || '', a.internship_title || '', a.status || '', a.created_at ? new Date(a.created_at).toLocaleDateString() : '']),
                  ];
                  const csvContent = rows.map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
                  link.click();
                  URL.revokeObjectURL(link.href);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all cursor-pointer font-bold"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} p-3 rounded-xl border-[3px] border-slate-900 dark:border-white text-white shadow-[3px_3px_0px_0px_#0f172a]`}>
                      {stat.icon}
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                      <TrendingUp className="w-4 h-4" />
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</h3>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Featured Internships */}
            {internships.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Featured Internships
                  </h3>
                  <button onClick={() => setActiveSection('internships')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {internships.slice(0, 4).map((internship) => (
                    <div
                      key={internship.id}
                      onClick={() => navigate(`/internship/${internship.id}`)}
                      className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#f43f5e] group-hover:rotate-3 transition-transform">
                        <span className="text-white font-black text-lg">{(internship.company_name || 'C').charAt(0)}</span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mb-1 line-clamp-1 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                        {internship.title}
                      </h4>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2">{internship.company_name}</p>
                      <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-bold mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        {internship.location || 'Remote'}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${getStatusBadge(internship.status || 'Active')}`}>
                        {internship.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Users</h3>
                  <button onClick={() => setActiveSection('users')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all</button>
                </div>
                <div className="space-y-3">
                  {users.slice(0, 4).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]">
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Internships</h3>
                  <button onClick={() => setActiveSection('internships')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all</button>
                </div>
                <div className="space-y-3">
                  {internships.slice(0, 4).map((internship) => (
                    <div key={internship.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]">
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">User Management</h2>
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
                    className="block w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-white rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
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

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a]">
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden md:inline">Add User</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-white">
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
                            <button onClick={() => handleViewUser(user)} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEditUser(user)} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Internship Management</h2>
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
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold"
                >
                  <Plus className="w-4 h-4" />
                  Add Internship
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map((internship) => (
                <div key={internship.id} className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all">
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

      case 'companies':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Company Management</h2>
              <span className="text-sm text-gray-500 dark:text-slate-400">{companies.length} companies</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Industry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                    {companies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">#{company.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{company.company_name}</div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">{company.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{company.industry || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{company.location || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${company.is_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                            {company.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                          {company.created_at ? new Date(company.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {!company.is_verified && (
                              <button
                                onClick={() => handleVerifyCompany(company.id)}
                                className="px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Verify
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(company.id)}
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

      case 'applications':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Application Management</h2>
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

            <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-white">
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Points System Management</h2>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] w-fit">
              {([
                { id: 'stats' as const, label: 'Statistics', icon: TrendingUp },
                { id: 'packages' as const, label: 'Packages', icon: Package },
                { id: 'pricing' as const, label: 'Service Pricing', icon: DollarSign },
                { id: 'requests' as const, label: 'Purchase Requests', icon: ShoppingCart },
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
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
                      <div className="flex items-center gap-4">
                        <div className={`${stat.color} p-3 rounded-xl border-[3px] border-slate-900 dark:border-white text-white shadow-[3px_3px_0px_0px_#0f172a]`}>{stat.icon}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
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
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.title}</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{item.value}</p>
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
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    New Package
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-white">
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-white">
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

            {/* Purchase Requests Sub-tab */}
            {pointsSubTab === 'requests' && (
              <div className="space-y-6">
                {/* Filter tabs */}
                <div className="flex gap-2">
                  {['pending', 'approved', 'rejected', 'all'].map((f) => (
                    <button
                      key={f}
                      onClick={async () => {
                        setPurchaseFilter(f);
                        try {
                          const res = await api.points.adminGetPurchaseRequests(f);
                          setPurchaseRequests(res?.requests || []);
                        } catch { /* ignore */ }
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                        purchaseFilter === f
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Package</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {purchaseRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">#{req.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{req.user_name}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">{req.user_email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{req.package_name}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-amber-600 dark:text-amber-400">{req.points}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">${req.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{new Date(req.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {req.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(`Approve ${req.points} pts for ${req.user_name}?`)) return;
                                    try {
                                      await api.points.adminApprovePurchase(req.id);
                                      setPurchaseRequests(purchaseRequests.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
                                      alert(`Approved! ${req.points} points credited.`);
                                    } catch (err: any) { alert(err.message || 'Failed'); }
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4 inline mr-1" />Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(`Reject purchase request from ${req.user_name}?`)) return;
                                    try {
                                      await api.points.adminRejectPurchase(req.id);
                                      setPurchaseRequests(purchaseRequests.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                                    } catch (err: any) { alert(err.message || 'Failed'); }
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                  <XCircle className="w-4 h-4 inline mr-1" />Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-slate-500">
                                {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {purchaseRequests.length === 0 && (
                        <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">No {purchaseFilter} purchase requests.</td></tr>
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
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
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
                        className="w-full px-4 py-2 bg-amber-400 text-slate-900 font-black rounded-xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50 transition-all flex items-center justify-center gap-2 uppercase tracking-tight"
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Logs & Security Monitoring</h2>
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
                <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
                  <div className="flex items-center gap-4">
                    <div className={`${item.color} p-3 rounded-xl border-[3px] border-slate-900 dark:border-white text-white shadow-[3px_3px_0px_0px_#0f172a]`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.title}</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Audit Logs Table */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    System Audit Logs
                  </h3>
                  <button onClick={() => api.admin.listAuditLogs().then(setAuditLogs).catch(() => {})} className="text-sm text-blue-600 hover:underline">Refresh</button>
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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
                    <Terminal className="w-5 h-5 text-slate-400" />
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

                <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a]">
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
    <div className="min-h-screen pt-24">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r-4 border-slate-900 dark:border-white min-h-screen sticky top-24">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeSection === item.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] font-bold'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-[3px] border-transparent font-medium'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
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
      {showAddUserModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b-[3px] border-slate-900 dark:border-white flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
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
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl border-[3px] border-slate-900 dark:border-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
      , document.body)}

      {/* Edit Internship Modal */}
      {showEditInternshipModal && editingInternship && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b-[3px] border-slate-900 dark:border-white flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
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
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl border-[3px] border-slate-900 dark:border-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
      , document.body)}

      {/* Package Create/Edit Modal */}
      {showPackageModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
            <div className="p-6 border-b-[3px] border-slate-900 dark:border-white flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
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
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl border-[3px] border-slate-900 dark:border-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
      , document.body)}

      {/* View User Detail Modal */}
      {viewingUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
            <div className="p-6 border-b-[3px] border-slate-900 dark:border-white flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                User Details
              </h3>
              <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">ID</span><span className="text-sm font-medium text-gray-900 dark:text-white">#{viewingUser.id}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">Name</span><span className="text-sm font-medium text-gray-900 dark:text-white">{viewingUser.full_name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">Email</span><span className="text-sm font-medium text-gray-900 dark:text-white">{viewingUser.email}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">Role</span><span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">{viewingUser.role}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">Status</span><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(viewingUser.is_active ? 'Active' : 'Inactive')}`}>{viewingUser.is_active ? 'Active' : 'Inactive'}</span></div>
              {viewingUser.company_name && <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">Company</span><span className="text-sm font-medium text-gray-900 dark:text-white">{viewingUser.company_name}</span></div>}
              {viewingUser.is_verified !== null && viewingUser.role === 'company' && <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">Verified</span><span className="text-sm font-medium text-gray-900 dark:text-white">{viewingUser.is_verified ? 'Yes' : 'No'}</span></div>}
              <div className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">Joined</span><span className="text-sm font-medium text-gray-900 dark:text-white">{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString() : '—'}</span></div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => { setViewingUser(null); handleEditUser(viewingUser); }} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit User
                </button>
                <button onClick={() => setViewingUser(null)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl border-[3px] border-slate-900 dark:border-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
            <div className="p-6 border-b-[3px] border-slate-900 dark:border-white flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit User
              </h3>
              <button onClick={() => setShowEditUserModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Full Name</label>
                <input type="text" required value={editUserForm.full_name} onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" required value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Role</label>
                <select value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="student">Student</option>
                  <option value="company">Company</option>
                </select>
              </div>
              {editUserForm.role === 'company' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Company Name</label>
                  <input type="text" value={editUserForm.company_name} onChange={(e) => setEditUserForm({ ...editUserForm, company_name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
              )}
              {editUserForm.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">University</label>
                    <input type="text" value={editUserForm.university} onChange={(e) => setEditUserForm({ ...editUserForm, university: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Major</label>
                    <input type="text" value={editUserForm.major} onChange={(e) => setEditUserForm({ ...editUserForm, major: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Phone</label>
                <input type="text" value={editUserForm.phone} onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditUserModal(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl border-[3px] border-slate-900 dark:border-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" />Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

