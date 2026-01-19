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
} from 'lucide-react';

type AdminSection = 'dashboard' | 'users' | 'internships' | 'applications';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statsData, setStatsData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleUpdateApplicationStatus = async (id: number, status: string) => {
    try {
      await api.applications.updateStatus(id, status);
      // Refresh applications list
      const appsList = await api.admin.listApplications();
      setApplications(appsList);
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
      setUsers(usersList);
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

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const [stats, usersList, internsList, appsList] = await Promise.all([
          api.admin.getStats(),
          api.admin.listUsers(),
          api.admin.listInternships(),
          api.admin.listApplications(),
        ]);
        setStatsData(stats);
        setUsers(usersList);
        setInternships(internsList);
        setApplications(appsList);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

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

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Chart Placeholder */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-950/20 border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-transparent dark:border-slate-800">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-slate-400">Chart visualization would go here</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-slate-950/20 border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'New user registered', user: 'John Doe', time: '2 minutes ago' },
                    { action: 'New internship posted', user: 'TechCorp', time: '15 minutes ago' },
                    { action: 'Application submitted', user: 'Jane Smith', time: '1 hour ago' },
                    { action: 'Company verified', user: 'DesignHub', time: '2 hours ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-slate-800 last:border-0">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-200">{activity.action}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  />
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
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
                    type="text"
                    placeholder="Search internships..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    type="text"
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
    </div>
  );
}

