import { useState } from 'react';
import { api } from '../services/api';
import { X } from 'lucide-react';

interface CreateInternshipProps {
  isDashboardTab?: boolean;
  onCancel?: () => void;
}

export function CreateInternship({ isDashboardTab, onCancel }: CreateInternshipProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await api.internships.create({
        title: formData.get('title'),
        description: formData.get('description'),
        requirements: formData.get('requirements'),
        location: formData.get('location'),
        duration: formData.get('duration'),
        stipend: formData.get('stipend'),
        major: formData.get('major'),
        application_deadline: formData.get('application_deadline') || undefined,
        start_date: formData.get('start_date') || undefined,
      });
      alert('Internship created successfully!');
      onCancel?.();
    } catch (err: any) {
      alert(err.message || 'Failed to create internship');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isDashboardTab ? 'p-6' : 'max-w-2xl mx-auto p-6'}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Post New Internship</h2>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Title *</label>
          <input name="title" type="text" required placeholder="e.g. Frontend Developer Intern"
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Description *</label>
          <textarea name="description" rows={4} required placeholder="Describe the internship responsibilities..."
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Requirements</label>
          <textarea name="requirements" rows={3} placeholder="List the requirements..."
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Location</label>
            <input name="location" type="text" placeholder="Cairo, Remote, etc."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Duration</label>
            <input name="duration" type="text" placeholder="3 months"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Stipend</label>
            <input name="stipend" type="text" placeholder="5000 EGP/month"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Required Major</label>
            <input name="major" type="text" placeholder="Computer Science"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Application Deadline</label>
            <input name="application_deadline" type="date"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
            <input name="start_date" type="date"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all">
            {isSubmitting ? 'Publishing...' : 'Publish Internship'}
          </button>
        </div>
      </form>
    </div>
  );
}
