import { Link } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';

const companies = [
  {
    id: 1,
    name: 'TechCorp',
    industry: 'Technology',
    location: 'San Francisco, CA',
    employees: '5000+',
    internships: 5,
    logo: 'TC',
    description: 'Leading technology company focused on innovation and cutting-edge solutions.',
  },
  {
    id: 2,
    name: 'DesignHub',
    industry: 'Design',
    location: 'New York, NY',
    employees: '200-500',
    internships: 3,
    logo: 'DH',
    description: 'Creative design agency specializing in user experience and digital products.',
  },
  {
    id: 3,
    name: 'GrowthLabs',
    industry: 'Marketing',
    location: 'Remote',
    employees: '50-200',
    internships: 2,
    logo: 'GL',
    description: 'Digital marketing agency helping startups scale their growth.',
  },
  {
    id: 4,
    name: 'DataWorks',
    industry: 'Data & Analytics',
    location: 'Austin, TX',
    employees: '200-500',
    internships: 4,
    logo: 'DW',
    description: 'Data analytics company providing insights for businesses worldwide.',
  },
  {
    id: 5,
    name: 'WebFlow',
    industry: 'Technology',
    location: 'Seattle, WA',
    employees: '500-1000',
    internships: 3,
    logo: 'WF',
    description: 'Web development company building modern applications and platforms.',
  },
  {
    id: 6,
    name: 'UserFirst',
    industry: 'UX Research',
    location: 'Remote',
    employees: '50-200',
    internships: 2,
    logo: 'UF',
    description: 'User experience research firm focused on human-centered design.',
  },
];

export function Companies() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Top Companies
          </h1>
          <p className="text-lg text-gray-600">
            Discover opportunities at leading companies across various industries.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">{company.logo}</span>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {company.industry}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{company.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{company.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  {company.location}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  {company.employees} employees
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {company.internships} open internship{company.internships !== 1 ? 's' : ''}
                  </span>
                  <Link
                    to={`/browse?company=${company.name}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View Openings →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

