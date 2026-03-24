import { useState, useEffect, useCallback, useRef, type FC, type ChangeEvent } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SectionType = 'education' | 'experience' | 'skills' | 'projects' | 'certifications';

export interface CVHeader {
  headline: string;
  summary: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface CVSection {
  id: number;
  section_type: SectionType;
  title: string;
  subtitle: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  order_index: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ActiveView = 'editor' | 'preview';

// ─── Section Config ───────────────────────────────────────────────────────────

interface SectionFieldConfig {
  title: string;
  subtitle: string;
  location: string;
  start_date: boolean;
  end_date: boolean;
  description: string;
}

interface SectionCfg {
  label: string;
  atsLabel: string;
  color: string;
  bg: string;
  icon: string;
  fields: SectionFieldConfig;
  atsTips: { title?: string; subtitle?: string; description?: string };
}

const SECTION_CONFIG: Record<SectionType, SectionCfg> = {
  education: {
    label: 'Education',
    atsLabel: 'Education',
    color: '#3B5BDB',
    bg: '#EEF2FF',
    icon: '🎓',
    fields: {
      title: 'Degree / Qualification',
      subtitle: 'Institution Name',
      location: 'City, Country',
      start_date: true,
      end_date: true,
      description: 'Achievements, relevant coursework, GPA',
    },
    atsTips: {
      title: 'Use the full official degree name, e.g. "Bachelor of Science in Computer Science"',
      description: 'List relevant modules, GPA if 3.5+, academic awards',
    },
  },
  experience: {
    label: 'Work Experience',
    atsLabel: 'Work Experience',
    color: '#2F9E44',
    bg: '#ECFDF5',
    icon: '💼',
    fields: {
      title: 'Job Title',
      subtitle: 'Company Name',
      location: 'City, Country',
      start_date: true,
      end_date: true,
      description: 'Key responsibilities and measurable achievements',
    },
    atsTips: {
      title: 'Use standard titles, e.g. "Software Engineer Intern" not "Code Ninja"',
      subtitle: 'Use the official company name',
      description: 'Start each point with an action verb. Include metrics: "Reduced load time by 40%", "Led a team of 3"',
    },
  },
  skills: {
    label: 'Skills',
    atsLabel: 'Skills',
    color: '#E8445A',
    bg: '#FFF1F2',
    icon: '⚡',
    fields: {
      title: 'Skill Category',
      subtitle: '',
      location: '',
      start_date: false,
      end_date: false,
      description: 'Comma-separated list of skills',
    },
    atsTips: {
      title: 'Use categories like "Programming Languages", "Frameworks & Tools", "Soft Skills"',
      description: 'List as comma-separated: Python, JavaScript, React, SQL, Git. Avoid rating bars — ATS cannot read them.',
    },
  },
  projects: {
    label: 'Projects',
    atsLabel: 'Projects',
    color: '#F59E0B',
    bg: '#FFFBEB',
    icon: '🚀',
    fields: {
      title: 'Project Name',
      subtitle: 'Technologies Used',
      location: '',
      start_date: true,
      end_date: true,
      description: 'What you built, your role, and measurable impact',
    },
    atsTips: {
      subtitle: 'List the main tech: React, Node.js, PostgreSQL',
      description: 'Describe the problem, your solution, and impact: "500+ users", "deployed to AWS", "open-source with 200 stars"',
    },
  },
  certifications: {
    label: 'Certifications',
    atsLabel: 'Certifications',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    icon: '🏆',
    fields: {
      title: 'Certification Name',
      subtitle: 'Issuing Organisation',
      location: '',
      start_date: false,
      end_date: true,
      description: 'Credential ID or relevant details (optional)',
    },
    atsTips: {
      title: 'Use the exact official certification name, e.g. "AWS Certified Solutions Architect"',
      subtitle: 'Issuing body, e.g. Amazon Web Services, Coursera, Google',
    },
  },
};

const SECTION_TYPES = Object.keys(SECTION_CONFIG) as SectionType[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

const SPECIAL_CHAR_RE = /[^\w\s.,\-–—()/:@+&#'"%$\u00C0-\u017E]/u;

function hasSpecialChars(text: string): boolean {
  return SPECIAL_CHAR_RE.test(text);
}

function formatDate(raw: string): string {
  if (!raw) return '';
  // Already formatted like "Jan 2024"
  if (/^[A-Z][a-z]+ \d{4}$/.test(raw)) return raw;
  // ISO format "2024-01"
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = parseInt(match[2], 10) - 1;
    return `${months[m] ?? match[2]} ${match[1]}`;
  }
  return raw;
}

const emptyHeader = (): CVHeader => ({
  headline: '', summary: '', phone: '', linkedin: '', github: '', website: '',
});

const emptySection = (type: SectionType): Omit<CVSection, 'id' | 'order_index'> => ({
  section_type: type, title: '', subtitle: '', location: '',
  start_date: '', end_date: '', description: '',
});

// ─── Auto-Save Indicator ──────────────────────────────────────────────────────

const AutoSaveIndicator: FC<{ status: SaveStatus }> = ({ status }) => {
  if (status === 'idle') return null;
  const map = {
    saving: { text: 'Saving…', cls: 'text-gray-400', dot: 'bg-amber-400 animate-pulse' },
    saved:  { text: 'All changes saved', cls: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
    error:  { text: 'Save failed — retrying', cls: 'text-red-500', dot: 'bg-red-500' },
  };
  const m = map[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${m.cls}`}>
      <span className={`w-2 h-2 rounded-full ${m.dot}`} />
      {m.text}
    </span>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; msg: string; type: 'error' | 'success' | 'info' }

const ToastContainer: FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
    {toasts.map(t => (
      <div key={t.id}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border
          ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
          : t.type === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300'
          : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300'}`}>
        <span className="flex-1">{t.msg}</span>
        <button onClick={() => onDismiss(t.id)} className="text-gray-400 hover:text-gray-600 ml-1 leading-none text-lg">×</button>
      </div>
    ))}
  </div>
);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const Skeleton: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg ${className}`} />
);

const LoadingSkeleton: FC = () => (
  <div className="space-y-4">
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10" />)}
      </div>
      <Skeleton className="h-24" />
    </div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    ))}
  </div>
);

// ─── ATS Field Input ──────────────────────────────────────────────────────────

interface ATSFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'month';
  placeholder?: string;
  required?: boolean;
  atsTip?: string;
  rows?: number;
}

const ATSField: FC<ATSFieldProps> = ({ label, value, onChange, type = 'text', placeholder, required, atsTip, rows = 4 }) => {
  const warn = value.length > 0 && hasSpecialChars(value);
  const base = 'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors';
  const borderCls = warn
    ? 'border-amber-400 focus:border-amber-400'
    : 'border-gray-300 dark:border-slate-600 focus:border-rose-500';

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-label={label}
          className={`${base} ${borderCls} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className={`${base} ${borderCls}`}
        />
      )}
      {warn && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          ⚠ Special characters or emojis may not parse correctly in ATS systems
        </p>
      )}
      {atsTip && (
        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>{atsTip}</span>
        </p>
      )}
    </div>
  );
};

// ─── Header Editor ────────────────────────────────────────────────────────────

interface HeaderEditorProps {
  header: CVHeader;
  onChange: (h: CVHeader) => void;
  userName: string;
  userEmail: string;
}

const HeaderEditor: FC<HeaderEditorProps> = ({ header, onChange, userName, userEmail }) => {
  const set = (k: keyof CVHeader) => (v: string) => onChange({ ...header, [k]: v });

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
        <span className="text-base">👤</span>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">Personal Info & Header</h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Read-only from profile */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Full Name</label>
            <div className="w-full rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>{userName || '—'}</span>
              <span className="ml-auto text-xs bg-gray-100 dark:bg-slate-700 text-gray-400 px-1.5 py-0.5 rounded">from profile</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Email</label>
            <div className="w-full rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="truncate">{userEmail || '—'}</span>
              <span className="ml-auto text-xs bg-gray-100 dark:bg-slate-700 text-gray-400 px-1.5 py-0.5 rounded shrink-0">from profile</span>
            </div>
          </div>
        </div>

        <ATSField
          label="Professional Headline"
          value={header.headline}
          onChange={set('headline')}
          placeholder="e.g. Computer Science Student | Seeking Software Engineering Internship"
          atsTip="Keep it under 120 characters. Include your target role and key skills."
        />

        <ATSField
          label="Professional Summary"
          value={header.summary}
          onChange={set('summary')}
          type="textarea"
          rows={3}
          placeholder="Write 2–3 sentences about your background, key skills, and career goals."
          atsTip="Use keywords from the job description. Avoid pronouns (I, me). Aim for 50–120 words."
        />

        <div className="grid grid-cols-2 gap-3">
          <ATSField label="Phone" value={header.phone} onChange={set('phone')} type="tel" placeholder="+20 1XX XXX XXXX" />
          <ATSField label="LinkedIn URL" value={header.linkedin} onChange={set('linkedin')} type="url" placeholder="linkedin.com/in/yourname" />
          <ATSField label="GitHub URL" value={header.github} onChange={set('github')} type="url" placeholder="github.com/yourname" />
          <ATSField label="Portfolio / Website" value={header.website} onChange={set('website')} type="url" placeholder="yourportfolio.com" />
        </div>
      </div>
    </section>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: CVSection;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps: any;
}

const SectionCard: FC<SectionCardProps> = ({ section, onEdit, onDelete, dragHandleProps }) => {
  const [collapsed, setCollapsed] = useState(true);
  const cfg = SECTION_CONFIG[section.section_type];

  const dateRange = [formatDate(section.start_date), section.end_date === 'Present' ? 'Present' : formatDate(section.end_date)]
    .filter(Boolean).join(' – ');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden group">
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing p-1 text-gray-300 dark:text-slate-600 hover:text-gray-500 shrink-0"
          aria-label="Drag to reorder"
        >
          {[...Array(3)].map((_, i) => (
            <span key={i} className="block w-4 h-0.5 bg-current rounded-full" />
          ))}
        </div>

        {/* Type badge */}
        <span
          className="shrink-0 text-xs font-bold px-2 py-1 rounded-md"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.icon} {cfg.label}
        </span>

        {/* Content preview */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{section.title || <span className="text-gray-400 italic">Untitled</span>}</p>
          {(section.subtitle || dateRange) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {section.subtitle}{section.subtitle && dateRange ? ' · ' : ''}{dateRange}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
            aria-label="Edit section"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            aria-label="Delete section"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {!collapsed && section.description && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed line-clamp-4">
            {section.description}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
    <div className="text-4xl mb-3">📄</div>
    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No sections yet</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add Education, Experience, Skills, Projects, and Certifications to build your ATS-optimised CV.</p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl font-semibold text-sm hover:bg-rose-600 transition-colors"
    >
      <span>+</span> Add First Section
    </button>
  </div>
);

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteConfirmProps {
  sectionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteConfirmDialog: FC<DeleteConfirmProps> = ({ sectionTitle, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Confirm deletion">
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 max-w-sm w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Delete Section?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">"{sectionTitle || 'Untitled'}" will be permanently removed.</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Add/Edit Section Modal ───────────────────────────────────────────────────

interface SectionModalProps {
  initial: CVSection | null; // null = add mode
  onSave: (data: Omit<CVSection, 'id' | 'order_index'>) => Promise<void>;
  onClose: () => void;
}

const SectionModal: FC<SectionModalProps> = ({ initial, onSave, onClose }) => {
  const [type, setType] = useState<SectionType>(initial?.section_type ?? 'education');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date ?? '');
  const [endDate, setEndDate] = useState(initial?.end_date ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cfg = SECTION_CONFIG[type];

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'This field is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ section_type: type, title: title.trim(), subtitle: subtitle.trim(), location: location.trim(), start_date: startDate.trim(), end_date: endDate.trim(), description: description.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={initial ? 'Edit section' : 'Add section'}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-white">{initial ? 'Edit Section' : 'Add Section'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Section type selector (locked to ATS-standard types) */}
          {!initial && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Section Type</label>
              <div className="grid grid-cols-5 gap-1.5">
                {SECTION_TYPES.map(t => {
                  const c = SECTION_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-semibold transition-all ${type === t ? 'border-rose-500 bg-rose-50 dark:bg-rose-950' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'}`}
                      style={type === t ? { borderColor: c.color, background: c.bg, color: c.color } : {}}
                    >
                      <span className="text-lg">{c.icon}</span>
                      <span className="text-center leading-tight">{c.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                <span>🔒</span> Section headings are locked to ATS-standard labels to ensure parser compatibility.
              </p>
            </div>
          )}

          {/* Fields */}
          <ATSField
            label={cfg.fields.title}
            value={title}
            onChange={setTitle}
            required
            atsTip={cfg.atsTips.title}
          />
          {errors.title && <p className="text-xs text-red-500 -mt-2">{errors.title}</p>}

          {cfg.fields.subtitle && (
            <ATSField label={cfg.fields.subtitle} value={subtitle} onChange={setSubtitle} atsTip={cfg.atsTips.subtitle} />
          )}

          {cfg.fields.location && (
            <ATSField label={cfg.fields.location} value={location} onChange={setLocation} placeholder="e.g. Cairo, Egypt" />
          )}

          {(cfg.fields.start_date || cfg.fields.end_date) && (
            <div className="grid grid-cols-2 gap-3">
              {cfg.fields.start_date && (
                <ATSField label="Start Date" value={startDate} onChange={setStartDate} type="month" />
              )}
              <div>
                {cfg.fields.end_date && (
                  <ATSField label="End Date" value={endDate} onChange={setEndDate} type="month" />
                )}
                {cfg.fields.end_date && (
                  <button
                    onClick={() => setEndDate('Present')}
                    className={`mt-1.5 text-xs px-2 py-1 rounded-lg border transition-colors ${endDate === 'Present' ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 'border-gray-200 dark:border-slate-600 text-gray-500 hover:border-gray-300'}`}
                  >
                    ✓ Present
                  </button>
                )}
              </div>
            </div>
          )}

          {cfg.fields.description !== '' && (
            <ATSField
              label="Description"
              value={description}
              onChange={setDescription}
              type="textarea"
              rows={5}
              placeholder={`Enter ${cfg.label.toLowerCase()} details here…`}
              atsTip={cfg.atsTips.description}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-slate-700 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {initial ? 'Save Changes' : 'Add Section'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── A4 CV Preview (ATS-Compliant) ────────────────────────────────────────────

interface A4PreviewProps {
  header: CVHeader;
  sections: CVSection[];
  userName: string;
  userEmail: string;
}

const A4Preview: FC<A4PreviewProps> = ({ header, sections, userName, userEmail }) => {
  const contactParts = [
    userEmail,
    header.phone,
    header.linkedin,
    header.github,
    header.website,
  ].filter(Boolean);

  const sectionOrder: SectionType[] = ['education', 'experience', 'projects', 'skills', 'certifications'];
  const grouped = sectionOrder
    .map(type => ({ type, items: sections.filter(s => s.section_type === type) }))
    .filter(g => g.items.length > 0);

  return (
    <div
      id="cv-a4-preview"
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: '10pt',
        color: '#1a1a1a',
        background: '#ffffff',
        padding: '32px 40px',
        lineHeight: 1.55,
        minHeight: '297mm',
        boxSizing: 'border-box',
      }}
    >
      {/* Name */}
      <h1 style={{ margin: '0 0 4px', fontSize: '20pt', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.3px' }}>
        {userName || 'Your Name'}
      </h1>

      {/* Headline */}
      {header.headline && (
        <p style={{ margin: '0 0 6px', fontSize: '10pt', textAlign: 'center', color: '#555' }}>
          {header.headline}
        </p>
      )}

      {/* Contact line — ATS reads plain text */}
      {contactParts.length > 0 && (
        <p style={{ margin: '0 0 10px', fontSize: '9pt', textAlign: 'center', color: '#555' }}>
          {contactParts.join('  |  ')}
        </p>
      )}

      {/* Divider */}
      <hr style={{ margin: '0 0 10px', borderTop: '1.5px solid #1a1a1a', borderBottom: 'none' }} />

      {/* Summary */}
      {header.summary && (
        <section style={{ marginBottom: '14px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '0.5px solid #ccc', paddingBottom: '3px' }}>
            Summary
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '9.5pt', color: '#333' }}>{header.summary}</p>
        </section>
      )}

      {/* Sections */}
      {grouped.map(({ type, items }) => {
        const cfg = SECTION_CONFIG[type];
        return (
          <section key={type} style={{ marginBottom: '14px' }}>
            {/* ATS-standard heading — uppercase plain text, no graphics */}
            <h2 style={{ margin: '0 0 5px', fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '0.5px solid #ccc', paddingBottom: '3px' }}>
              {cfg.atsLabel}
            </h2>

            {items.map(item => {
              const startFmt = formatDate(item.start_date);
              const endFmt = item.end_date === 'Present' ? 'Present' : formatDate(item.end_date);
              const dateStr = [startFmt, endFmt].filter(Boolean).join(' – ');

              return (
                <div key={item.id} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '10pt', fontWeight: 700 }}>{item.title}</strong>
                    {dateStr && <span style={{ fontSize: '9pt', color: '#555', whiteSpace: 'nowrap', marginLeft: '8px' }}>{dateStr}</span>}
                  </div>
                  {(item.subtitle || item.location) && (
                    <p style={{ margin: '1px 0 0', fontSize: '9.5pt', color: '#444', fontStyle: 'italic' }}>
                      {[item.subtitle, item.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {item.description && (
                    <p style={{ margin: '3px 0 0', fontSize: '9.5pt', color: '#333', whiteSpace: 'pre-line' }}>
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      {/* Placeholder when empty */}
      {grouped.length === 0 && !header.summary && (
        <div style={{ textAlign: 'center', color: '#bbb', padding: '60px 0', fontSize: '10pt' }}>
          Fill in your details to see the live preview
        </div>
      )}
    </div>
  );
};

// ─── Main CVBuilder Component ─────────────────────────────────────────────────

export function CVBuilder() {
  const { user } = useAuth();
  const userName = user?.name ?? '';
  const userEmail = user?.email ?? '';

  const [header, setHeader] = useState<CVHeader>(emptyHeader());
  const [sections, setSections] = useState<CVSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeView, setActiveView] = useState<ActiveView>('editor');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState<CVSection | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((msg: string, type: Toast['type'] = 'error') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Load CV on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await api.cv.get();
        if (res.cv) {
          const cv = res.cv;
          setHeader({
            headline: cv.headline ?? '',
            summary: cv.summary ?? '',
            phone: cv.phone ?? '',
            linkedin: cv.linkedin ?? '',
            github: cv.github ?? '',
            website: cv.website ?? '',
          });
          const secs: CVSection[] = (cv.sections ?? []).map((s: any) => ({
            id: s.id,
            section_type: s.section_type as SectionType,
            title: s.title ?? '',
            subtitle: s.subtitle ?? '',
            location: s.location ?? '',
            start_date: s.start_date ?? '',
            end_date: s.end_date ?? '',
            description: s.description ?? '',
            order_index: s.order_index ?? 0,
          }));
          setSections(secs.sort((a, b) => a.order_index - b.order_index));
        }
      } catch (e: any) {
        addToast('Failed to load your CV. Please refresh the page.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [addToast]);

  // ── Auto-save header (debounced 1.5s) ────────────────────────────────────

  const saveHeaderFn = useCallback(async (h: CVHeader) => {
    setSaveStatus('saving');
    try {
      await api.cv.saveHeader(h);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      addToast('Failed to save — check your connection and try again.', 'error');
    }
  }, [addToast]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveHeaderDebounced = useCallback(debounce(saveHeaderFn, 1500), [saveHeaderFn]);

  const handleHeaderChange = (h: CVHeader) => {
    setHeader(h);
    setSaveStatus('saving');
    saveHeaderDebounced(h);
  };

  // ── Add section ──────────────────────────────────────────────────────────

  const handleAddSection = async (data: Omit<CVSection, 'id' | 'order_index'>) => {
    try {
      const res = await api.cv.addSection({ ...data, order_index: sections.length });
      const s = res.section;
      setSections(prev => [...prev, {
        id: s.id,
        section_type: s.section_type,
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        location: s.location ?? '',
        start_date: s.start_date ?? '',
        end_date: s.end_date ?? '',
        description: s.description ?? '',
        order_index: s.order_index ?? prev.length,
      }]);
      addToast('Section added!', 'success');
    } catch {
      addToast('Failed to add section. Please try again.', 'error');
      throw new Error('add failed');
    }
  };

  // ── Edit section ─────────────────────────────────────────────────────────

  const handleEditSection = async (data: Omit<CVSection, 'id' | 'order_index'>) => {
    if (!editingSection) return;
    try {
      const res = await api.cv.updateSection(editingSection.id, data);
      const s = res.section;
      setSections(prev => prev.map(sec => sec.id === editingSection.id ? {
        ...sec,
        section_type: s.section_type,
        title: s.title ?? '',
        subtitle: s.subtitle ?? '',
        location: s.location ?? '',
        start_date: s.start_date ?? '',
        end_date: s.end_date ?? '',
        description: s.description ?? '',
      } : sec));
      addToast('Section updated!', 'success');
    } catch {
      addToast('Failed to update section.', 'error');
      throw new Error('edit failed');
    }
  };

  // ── Delete section ───────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await api.cv.deleteSection(deleteId);
      setSections(prev => prev.filter(s => s.id !== deleteId));
      addToast('Section deleted.', 'info');
    } catch {
      addToast('Failed to delete section.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // ── Drag-to-reorder ──────────────────────────────────────────────────────

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;

    const reordered = Array.from(sections);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, order_index: i }));
    setSections(updated); // optimistic

    // Persist new order (parallel PUT requests)
    try {
      await Promise.all(updated.map(s => api.cv.updateSection(s.id, { order_index: s.order_index })));
    } catch {
      addToast('Failed to save section order.', 'error');
    }
  };

  // ── Export PDF ───────────────────────────────────────────────────────────

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await api.cv.exportPDF();
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        if (response.status === 402) {
          addToast(`Insufficient points for PDF export. You need ${json.points_required ?? '?'} points.`, 'error');
        } else if (response.status === 404) {
          addToast('Save your CV first before exporting.', 'error');
        } else {
          addToast(json.error ?? 'PDF export failed. Please try again.', 'error');
        }
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${userName.replace(/\s+/g, '_') || 'CV'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('PDF downloaded!', 'success');
    } catch {
      addToast('PDF export failed. Please check your connection.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const deleteTarget = sections.find(s => s.id === deleteId);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cv-a4-preview, #cv-a4-preview * { visibility: visible !important; }
          #cv-a4-preview { position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">CV Builder</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">ATS-optimised · auto-saves · real-time preview</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <AutoSaveIndicator status={saveStatus} />
              <button
                onClick={handleExportPDF}
                disabled={exporting || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white font-bold text-sm rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 shadow-sm shadow-rose-200 dark:shadow-none"
                aria-label="Download CV as PDF"
              >
                {exporting
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                Download PDF
              </button>
            </div>
          </div>

          {/* ── Mobile Tab Switcher ── */}
          <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit xl:hidden" role="tablist">
            {(['editor', 'preview'] as ActiveView[]).map(v => (
              <button
                key={v}
                role="tab"
                aria-selected={activeView === v}
                onClick={() => setActiveView(v)}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${activeView === v ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                {v === 'editor' ? '✏️ Editor' : '👁 Preview'}
              </button>
            ))}
          </div>

          {/* ── Two-Column Layout ── */}
          <div className="flex gap-6">

            {/* ── Left: Editor ── */}
            <div className={`flex-1 min-w-0 space-y-4 ${activeView === 'preview' ? 'hidden xl:block' : ''}`}>

              {loading ? <LoadingSkeleton /> : (
                <>
                  {/* Header Editor */}
                  <HeaderEditor
                    header={header}
                    onChange={handleHeaderChange}
                    userName={userName}
                    userEmail={userEmail}
                  />

                  {/* Section List */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">Sections</h2>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors"
                        aria-label="Add new section"
                      >
                        <span className="text-base leading-none">+</span> Add Section
                      </button>
                    </div>

                    {sections.length === 0 ? (
                      <EmptyState onAdd={() => setShowAddModal(true)} />
                    ) : (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="cv-sections">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2"
                            >
                              {sections.map((section, index) => (
                                <Draggable key={String(section.id)} draggableId={String(section.id)} index={index}>
                                  {(drag, snapshot) => (
                                    <div
                                      ref={drag.innerRef}
                                      {...drag.draggableProps}
                                      className={snapshot.isDragging ? 'opacity-80 shadow-xl scale-[1.01]' : ''}
                                    >
                                      <SectionCard
                                        section={section}
                                        index={index}
                                        onEdit={() => setEditingSection(section)}
                                        onDelete={() => setDeleteId(section.id)}
                                        dragHandleProps={drag.dragHandleProps}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </section>

                  {/* ATS Compliance Banner */}
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                    <span className="text-lg shrink-0">🤖</span>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p className="font-semibold">ATS Compliance — what's enforced:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
                        <li>Standard section headings only (Education, Work Experience, Skills, Projects, Certifications)</li>
                        <li>Single-column, plain-text PDF output — no tables, no text boxes, no graphics</li>
                        <li>Machine-readable fonts (Helvetica/Arial)</li>
                        <li>Dates formatted consistently as Mon YYYY (e.g. Jan 2024)</li>
                        <li>Logical reading order from top to bottom</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Right: A4 Preview ── */}
            <div className={`shrink-0 xl:w-[420px] ${activeView === 'editor' ? 'hidden xl:block' : ''}`}>
              <div className="xl:sticky xl:top-28">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Live Preview
                  </span>
                  <span className="text-xs text-gray-400">A4 · ATS-safe</span>
                </div>

                {/* A4 frame */}
                <div
                  className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200"
                  style={{ transformOrigin: 'top left' }}
                >
                  <div style={{ transform: 'scale(0.56)', transformOrigin: 'top left', width: `${100 / 0.56}%`, maxHeight: `${297 * 0.56}mm`, overflow: 'hidden' }}>
                    {loading ? (
                      <div className="flex items-center justify-center" style={{ height: '400px' }}>
                        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <A4Preview header={header} sections={sections} userName={userName} userEmail={userEmail} />
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                  Updates in real time as you type
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showAddModal && (
        <SectionModal
          initial={null}
          onSave={handleAddSection}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingSection && (
        <SectionModal
          initial={editingSection}
          onSave={handleEditSection}
          onClose={() => setEditingSection(null)}
        />
      )}

      {deleteId !== null && (
        <DeleteConfirmDialog
          sectionTitle={deleteTarget?.title ?? ''}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteId(null)}
          loading={deleteLoading}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
