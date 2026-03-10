import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Company {
  id: number;
  name: string;
  email: string;
  company_name: string;
  company_location?: string;
  profile_image?: string;
  internship_count?: number;
}

export function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        // Fetch all internships to aggregate by company
        const response = await api.internships.getAll();
        const internships = response?.internships || [];

        // Group internships by company
        const companyMap = new Map<number, Company & { internship_count: number }>();

        internships.forEach((internship: any) => {
          const company = internship.company;
          if (company) {
            if (!companyMap.has(company.id)) {
              companyMap.set(company.id, {
                ...company,
                internship_count: 0
              });
            }
            const existing = companyMap.get(company.id)!;
            existing.internship_count += 1;
          }
        });

        // Convert to array and sort by internship count
        const companiesArray = Array.from(companyMap.values())
          .sort((a, b) => b.internship_count - a.internship_count);

        setCompanies(companiesArray);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-bold">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24">
      <div className="border-b-4 border-slate-900 dark:border-white bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-block px-4 py-1 bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-full border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] mb-4">COMPANIES</div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">
            Top Companies
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            Discover opportunities at leading companies across various industries.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {companies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 font-bold">No companies found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0px_0px_#0f172a] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border-[3px] border-slate-900 dark:border-white relative">
                    {company.profile_image ? (
                      <img
                        src={(() => {
                          const logoUrl = company.profile_image;
                          // Handle different URL formats
                          if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
                            return logoUrl;
                          } else if (logoUrl.startsWith('/uploads/')) {
                            // Use the configured API URL but strip '/api' since uploads are served from root
                            // Also corrected the fallback URL to match the actual production backend
                            const apiBase = (import.meta.env.VITE_API_BASE_URL || 'https://futureintern-production.up.railway.app/api').replace(/\/api\/?$/, '');
                            return `${apiBase}${logoUrl}`;
                          }
                          return logoUrl;
                        })()}
                        alt={`${company.company_name || company.name} logo`}
                        onError={(e) => {
                          // Fallback to avatar with company initials
                          const currentTarget = e.currentTarget;
                          currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name || company.name || 'C')}&background=random&bold=true&size=256`;
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-400">
                        <span className="text-2xl font-black text-slate-900">
                          {(company.company_name || company.name || 'C').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                  {company.company_name || company.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  Join our team and make an impact in the industry.
                </p>

                <div className="space-y-2 mb-4">
                  {company.company_location && (
                    <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {company.company_location}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t-[3px] border-slate-900 dark:border-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      {company.internship_count || 0} open internship{company.internship_count !== 1 ? 's' : ''}
                    </span>
                    <Link
                      to={`/browse?company=${encodeURIComponent(company.company_name || company.name)}`}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-black text-sm"
                    >
                      View Openings →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
