import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Search, Filter, X } from 'lucide-react';
import { api } from '../services/api';
import { SaveButton } from '../components/SaveButton';
import { resolveLogoUrl } from '../utils/logoUrl';

export function BrowseInternships() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [companyFilter, setCompanyFilter] = useState(searchParams.get('company') || '');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Internships data (live API only)
  const [internships, setInternships] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  // Update search query from URL params on mount
  useEffect(() => {
    const q = searchParams.get('q');
    const loc = searchParams.get('location');
    const comp = searchParams.get('company');
    if (q) setSearchQuery(q);
    if (loc) setLocationFilter(loc);
    if (comp) setCompanyFilter(comp);
  }, [searchParams]);

  // Fetch internships from backend
  const fetchInternships = async () => {
    try {
      setLoadingData(true);
      setLoadError('');
      const res = await api.internships.getAll();
      const list = res?.internships || (Array.isArray(res) ? res : []);
      setInternships(list);
    } catch (err) {
      console.error('Failed to fetch internships from API', err);
      setLoadError('Failed to load internships. Please try again later.');
      setInternships([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const filteredInternships = useMemo(() => {
    return internships.filter((internship) => {
      const title = (internship.title || '').toString().toLowerCase();
      const companyName = (internship.company?.name || internship.company || internship.company_name || '').toString().toLowerCase();
      const matchesSearch =
        title.includes(searchQuery.toLowerCase()) ||
        companyName.includes(searchQuery.toLowerCase());
      const loc = (internship.location || '').toString().toLowerCase();
      const matchesLocation = !locationFilter || loc.includes(locationFilter.toLowerCase());
      const matchesCompany = !companyFilter || companyName.includes(companyFilter.toLowerCase());
      const matchesType = !typeFilter || (internship.type || '') === typeFilter;

      return matchesSearch && matchesLocation && matchesCompany && matchesType;
    });
  }, [internships, searchQuery, locationFilter, companyFilter, typeFilter]);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Full-time':
        return 'bg-blue-600 text-white border-[2px] border-slate-900';
      case 'Part-time':
        return 'bg-amber-400 text-slate-900 border-[2px] border-slate-900';
      case 'Remote':
        return 'bg-rose-500 text-white border-[2px] border-slate-900';
      default:
        return 'bg-slate-200 text-slate-700 border-[2px] border-slate-900';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setCompanyFilter('');
    setTypeFilter('');
  };

  const hasActiveFilters = searchQuery || locationFilter || typeFilter;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24">
      <div className="border-b-4 border-slate-900 dark:border-white bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="inline-block px-4 py-1 bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-full border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] mb-4">BROWSE</div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6">
            Browse Internships
          </h1>
          {loadingData && (
            <div className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">Loading internships...</div>
          )}
          {loadError && (
            <div className="text-sm text-red-600 mb-4 flex items-center gap-3">
              <span>{loadError}</span>
              <button onClick={() => fetchInternships()} className="text-sm text-blue-600 underline">Retry</button>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="internship-search"
                  name="internship_search"
                  placeholder="Search by title or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-[3px] border-slate-900 dark:border-white rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 border-[3px] border-slate-900 dark:border-white rounded-2xl bg-amber-400 dark:bg-amber-500 font-bold uppercase text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all flex items-center justify-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-[3px] border-slate-900 dark:border-white space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bi-location" className="block text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="bi-location"
                        type="text"
                        placeholder="City, State or Remote"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-[3px] border-slate-900 dark:border-white rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bi-type" className="block text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Type
                    </label>
                    <select
                      id="bi-type"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-4 py-2 border-[3px] border-slate-900 dark:border-white rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {hasActiveFilters && !loadError && (
            <div className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-400">
              Found {filteredInternships.length} internship{filteredInternships.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loadingData && !loadError && filteredInternships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">No internships found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="text-rose-600 hover:text-rose-700 font-bold"
            >
              Clear filters and try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map((internship) => {
              const companyName = internship.company?.name || internship.company || internship.company_name || 'Company';
              return (
                <div key={internship.id} className="relative bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0px_0px_#0f172a] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.2)] transition-all">
                  <div className="absolute top-4 right-4 z-10">
                    <SaveButton internshipId={internship.id} />
                  </div>
                  <Link to={`/internship/${internship.id}`} className="block">
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border-[3px] border-slate-900 dark:border-white overflow-hidden">
                      {internship.company?.profile_image ? (
                        <img
                          src={resolveLogoUrl(internship.company.profile_image)}
                          alt={companyName}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=eff6ff&color=2563eb&size=128`;
                          }}
                        />
                      ) : (
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=eff6ff&color=2563eb&size=128`}
                          alt={companyName}
                          className="w-full h-full object-contain p-2"
                        />
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      {internship.title}
                    </h3>

                    <div className="flex items-center text-slate-600 dark:text-slate-400 mb-3">
                      <span className="font-bold">{companyName}</span>
                    </div>

                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      {internship.location}
                    </div>

                    {(() => {
                      const badge = (internship.type && internship.type.toLowerCase() !== (internship.location || '').toLowerCase())
                        ? internship.type
                        : 'Full-time';
                      return (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(badge)}`}>
                          {badge}
                        </span>
                      );
                    })()}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
