import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Search, Filter, X } from 'lucide-react';
import { api } from '../services/api';

export function BrowseInternships() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
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
    if (q) setSearchQuery(q);
    if (loc) setLocationFilter(loc);
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
      const matchesType = !typeFilter || (internship.type || '') === typeFilter;

      return matchesSearch && matchesLocation && matchesType;
    });
  }, [internships, searchQuery, locationFilter, typeFilter]);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Full-time':
        return 'bg-blue-100 text-blue-700';
      case 'Part-time':
        return 'bg-green-100 text-green-700';
      case 'Remote':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setTypeFilter('');
  };

  const hasActiveFilters = searchQuery || locationFilter || typeFilter;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Browse Internships
          </h1>
          {loadingData && (
            <div className="text-sm text-gray-600 mb-4">Loading internships...</div>
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
                  placeholder="Search by title or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="City, State or Remote"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {hasActiveFilters && !loadError && (
            <div className="mt-4 text-sm text-gray-600">
              Found {filteredInternships.length} internship{filteredInternships.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loadingData && !loadError && filteredInternships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No internships found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters and try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map((internship) => {
              const companyName = internship.company?.name || internship.company || internship.company_name || 'Company';
              return (
                <Link
                  key={internship.id}
                  to={`/internship/${internship.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all"
                >
                  <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm border border-gray-100 overflow-hidden">
                    {internship.company?.profile_image ? (
                      <img
                        src={internship.company.profile_image}
                        alt={companyName}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${companyName}&background=eff6ff&color=2563eb&size=128&font-size=0.5`;
                        }}
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${companyName}&background=eff6ff&color=2563eb&size=128&font-size=0.5`}
                        alt={companyName}
                        className="w-full h-full object-contain p-1"
                      />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {internship.title}
                  </h3>

                  <div className="flex items-center text-gray-600 mb-3">
                    <span className="font-medium">{companyName}</span>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    {internship.location}
                  </div>

                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(internship.type || '')}`}>
                    {internship.type || 'N/A'}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
