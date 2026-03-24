import { useState, useRef, useEffect, type ChangeEvent, type FC } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalData {
  name: string; title: string; email: string; phone: string;
  location: string; linkedin: string; github: string;
  portfolio: string; summary: string; photo: string;
}
interface EducationEntry  { id: number; degree: string; school: string; year: string; gpa: string; }
interface ExperienceEntry { id: number; role: string; company: string; period: string; description: string; }
interface ProjectEntry    { id: number; name: string; tech: string; link: string; description: string; }
interface CertEntry       { id: number; name: string; issuer: string; date: string; }
interface SkillsData      { technical: string; soft: string; languages: string; }

interface AcademicData {
  education:      EducationEntry[];
  experience:     ExperienceEntry[];
  skills:         SkillsData;
  projects:       ProjectEntry[];
  certifications: CertEntry[];
}

interface CVData { personal: PersonalData; academic: AcademicData; }

type AnimDir    = 'forward' | 'back';
type InputType  = 'text' | 'email' | 'tel' | 'textarea' | 'url';
type Template   = 'modern' | 'classic' | 'minimal';
type ThemeColor = 'coral' | 'navy' | 'forest';

// ─── Constants ────────────────────────────────────────────────────────────────

interface StepCfg { id: number; label: string; emoji: string; desc: string; }
const STEPS: StepCfg[] = [
  { id: 0, label: 'Personal Info',     emoji: '👤', desc: 'Contact & about you'       },
  { id: 1, label: 'Academic & Skills', emoji: '🎓', desc: 'Education, experience...'  },
  { id: 2, label: 'Preview CV',        emoji: '✨', desc: 'Review & download'         },
];

const THEMES: Record<ThemeColor, { accent: string; label: string }> = {
  coral:  { accent: '#E8445A', label: 'Coral'  },
  navy:   { accent: '#3B5BDB', label: 'Navy'   },
  forest: { accent: '#2F9E44', label: 'Forest' },
};

const emptyEdu  = (): EducationEntry  => ({ id: Date.now(), degree: '', school: '', year: '', gpa: '' });
const emptyExp  = (): ExperienceEntry => ({ id: Date.now(), role: '', company: '', period: '', description: '' });
const emptyProj = (): ProjectEntry    => ({ id: Date.now(), name: '', tech: '', link: '', description: '' });
const emptyCert = (): CertEntry       => ({ id: Date.now(), name: '', issuer: '', date: '' });

const initialData: CVData = {
  personal: { name:'', title:'', email:'', phone:'', location:'', linkedin:'', github:'', portfolio:'', summary:'', photo:'' },
  academic: {
    education:      [{ id:1, degree:'', school:'', year:'', gpa:'' }],
    experience:     [{ id:1, role:'', company:'', period:'', description:'' }],
    skills:         { technical:'', soft:'', languages:'' },
    projects:       [{ id:1, name:'', tech:'', link:'', description:'' }],
    certifications: [{ id:1, name:'', issuer:'', date:'' }],
  },
};

const LS_KEY = 'futureintern_cv_v2';

// ─── UI Theme ─────────────────────────────────────────────────────────────────

interface UITheme {
  bg: string; sidebar: string; card: string; border: string;
  text: string; textMuted: string; inputBg: string; inputBorder: string;
  navBg: string; previewShell: string; tagBg: string; errorBg: string;
}

const lightUI: UITheme = {
  bg: '#F8F9FA', sidebar: '#FFFFFF', card: '#FFFFFF', border: '#F3F4F6',
  text: '#111827', textMuted: '#6B7280', inputBg: '#FFFFFF', inputBorder: '#E5E7EB',
  navBg: '#FFFFFF', previewShell: '#F1F3F5', tagBg: '#F9FAFB', errorBg: '#FEF2F2',
};

const darkUI: UITheme = {
  bg: '#0F1117', sidebar: '#16181D', card: '#1C1F26', border: '#2A2D36',
  text: '#F1F3F5', textMuted: '#8B8FA8', inputBg: '#1C1F26', inputBorder: '#2A2D36',
  navBg: '#16181D', previewShell: '#12141A', tagBg: '#1C1F26', errorBg: '#2D1B1E',
};

// ─── Completeness Calculator ──────────────────────────────────────────────────

interface CompletenessResult { score: number; missing: string[]; }

function calcCompleteness(data: CVData): CompletenessResult {
  const p = data.personal;
  const ac = data.academic;
  const checks: Array<{ label: string; ok: boolean; weight: number }> = [
    { label: 'Full name',         ok: p.name.trim().length > 0,       weight: 10 },
    { label: 'Job title',         ok: p.title.trim().length > 0,      weight: 8  },
    { label: 'Email',             ok: p.email.trim().length > 0,      weight: 8  },
    { label: 'Phone',             ok: p.phone.trim().length > 0,      weight: 5  },
    { label: 'Location',          ok: p.location.trim().length > 0,   weight: 5  },
    { label: 'LinkedIn',          ok: p.linkedin.trim().length > 0,   weight: 7  },
    { label: 'GitHub',            ok: p.github.trim().length > 0,     weight: 7  },
    { label: 'Summary (50+ chars)', ok: p.summary.trim().length >= 50, weight: 10 },
    { label: 'Profile photo',     ok: p.photo.trim().length > 0,      weight: 5  },
    { label: 'Education',         ok: ac.education.some(e => e.degree && e.school), weight: 10 },
    { label: 'Technical skills',  ok: ac.skills.technical.trim().length > 0,       weight: 8  },
    { label: 'Languages',         ok: ac.skills.languages.trim().length > 0,       weight: 5  },
    { label: 'A project',         ok: ac.projects.some(p => p.name && p.tech),     weight: 8  },
    { label: 'Internship/Experience', ok: ac.experience.some(e => e.role && e.company), weight: 4 },
  ];
  const total  = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter(c => c.ok).reduce((s, c) => s + c.weight, 0);
  const missing = checks.filter(c => !c.ok).map(c => c.label);
  return { score: Math.round((earned / total) * 100), missing };
}

// ─── ATS Score Calculator ─────────────────────────────────────────────────────

interface ATSResult { score: number; tips: string[]; good: string[]; }

function calcATS(data: CVData): ATSResult {
  const p  = data.personal;
  const ac = data.academic;
  const fullText = [
    p.name, p.title, p.summary,
    ac.skills.technical, ac.skills.soft, ac.skills.languages,
    ...ac.education.map(e => `${e.degree} ${e.school}`),
    ...ac.experience.map(e => `${e.role} ${e.company} ${e.description}`),
    ...ac.projects.map(p => `${p.name} ${p.tech} ${p.description}`),
    ...ac.certifications.map(c => `${c.name} ${c.issuer}`),
  ].join(' ').toLowerCase();

  const tips: string[] = [];
  const good: string[] = [];
  let score = 0;

  // Action verbs
  const actionVerbs = ['built','developed','designed','led','managed','created','implemented','improved','increased','reduced','delivered','launched','collaborated','analyzed','optimized'];
  const usedVerbs = actionVerbs.filter(v => fullText.includes(v));
  if (usedVerbs.length >= 3) { score += 20; good.push(`Strong action verbs used (${usedVerbs.slice(0,3).join(', ')}...)`); }
  else { tips.push('Use action verbs in experience: "Built", "Developed", "Led", "Optimized"'); }

  // Quantifiable results
  const hasNumbers = /\d+%|\d+ (users|projects|features|apps|clients|hours|days|months)/.test(fullText);
  if (hasNumbers) { score += 20; good.push('Quantified achievements found (numbers = ATS boost)'); }
  else { tips.push('Add numbers: "Improved performance by 30%" or "Built app with 500+ users"'); }

  // Technical keywords
  const techKeywords = ['react','python','javascript','typescript','node','sql','git','api','html','css','figma','flutter','django','aws','docker'];
  const foundTech = techKeywords.filter(k => fullText.includes(k));
  if (foundTech.length >= 4) { score += 20; good.push(`Tech keywords detected: ${foundTech.slice(0,4).join(', ')}`); }
  else { tips.push('Add more tech keywords in Skills: React, Python, SQL, Git, Docker...'); }

  // Contact completeness
  if (p.email && p.phone && p.linkedin) { score += 15; good.push('Complete contact info (email + phone + LinkedIn)'); }
  else { tips.push('Complete your contact info: email, phone, and LinkedIn are essential'); }

  // Summary quality
  if (p.summary.length >= 100) { score += 15; good.push('Detailed summary (100+ chars)'); }
  else if (p.summary.length >= 50) { score += 8; tips.push('Expand your summary to 100+ characters for better ATS ranking'); }
  else { tips.push('Write a professional summary of at least 2–3 sentences'); }

  // Links
  if (p.github || p.portfolio) { score += 10; good.push('Portfolio/GitHub link present'); }
  else { tips.push('Add your GitHub or portfolio URL — recruiters check these'); }

  return { score: Math.min(score, 100), tips, good };
}

// ─── Validation ───────────────────────────────────────────────────────────────

type ValidationErrors = Record<string, string>;

function validateStep0(data: PersonalData): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!data.name.trim())  errors.name  = 'Name is required';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Invalid email format';
  if (!data.title.trim()) errors.title = 'Job title is required';
  return errors;
}

function validateStep1(data: AcademicData): ValidationErrors {
  const errors: ValidationErrors = {};
  const hasEdu = data.education.some(e => e.degree.trim() && e.school.trim());
  if (!hasEdu) errors.education = 'Add at least one education entry';
  if (!data.skills.technical.trim()) errors.technical = 'Add at least one technical skill';
  return errors;
}

// ─── FInput ───────────────────────────────────────────────────────────────────

interface FInputProps {
  label: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: InputType; placeholder?: string; accent: string; ui: UITheme;
  error?: string;
}

const FInput: FC<FInputProps> = ({ label, value, onChange, type = 'text', placeholder = '', accent, ui, error }) => {
  const [focused, setFocused] = useState(false);
  const up = focused || value.length > 0;
  const borderColor = error ? '#E8445A' : focused ? accent : ui.inputBorder;
  const shared = {
    width: '100%', border: `1.5px solid ${borderColor}`, borderRadius: '10px',
    padding: '12px', fontSize: '13px', fontFamily: "'Plus Jakarta Sans',sans-serif",
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
    color: ui.text, background: error ? ui.errorBg : ui.inputBg,
  };
  return (
    <div style={{ position: 'relative', marginBottom: error ? '6px' : '20px' }}>
      <label style={{
        position: 'absolute', top: up ? '-9px' : '13px', left: '12px',
        fontSize: up ? '10px' : '13px', color: error ? '#E8445A' : up ? accent : ui.textMuted,
        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)', pointerEvents: 'none',
        letterSpacing: up ? '1px' : '0', textTransform: 'uppercase',
        fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 650,
        background: up ? (error ? ui.errorBg : ui.inputBg) : 'transparent', padding: up ? '0 4px' : '0',
      }}>{label}</label>
      {type === 'textarea'
        ? <textarea value={value} onChange={onChange} rows={3}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder={focused ? placeholder : ''}
            style={{ ...shared, resize: 'none', lineHeight: '1.6' }} />
        : <input type={type} value={value} onChange={onChange}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder={focused ? placeholder : ''} style={shared} />
      }
      {error && <div style={{ fontSize: '10px', color: '#E8445A', marginTop: '4px', marginBottom: '12px', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 650 }}>⚠ {error}</div>}
    </div>
  );
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const SubSection: FC<{ title: string; emoji: string; accent: string; ui: UITheme; tip?: string; children: React.ReactNode }> = ({ title, emoji, accent, ui, tip, children }) => {
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px', paddingBottom: '9px', borderBottom: `2px solid ${accent}20` }}>
        <span style={{ fontSize: '16px' }}>{emoji}</span>
        <h3 style={{ fontSize: '13px', fontFamily: "'Syne',sans-serif", fontWeight: 650, color: ui.text, margin: 0, flex: 1 }}>{title}</h3>
        {tip && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowTip(s => !s)}
              style={{ width: '20px', height: '20px', borderRadius: '50%', background: `${accent}18`, border: 'none', color: accent, fontSize: '11px', fontWeight: 650, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              💡
            </button>
            {showTip && (
              <div style={{ position: 'absolute', right: 0, top: '26px', width: '240px', background: ui.card, border: `1px solid ${ui.border}`, borderRadius: '10px', padding: '12px', fontSize: '11px', color: ui.textMuted, lineHeight: '1.6', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                <div style={{ color: accent, fontWeight: 650, marginBottom: '5px', fontSize: '10px', letterSpacing: '0.5px' }}>💡 Pro Tip</div>
                {tip}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

const EntryCard: FC<{ children: React.ReactNode; accent: string; ui: UITheme; index: number; onRemove?: () => void }> = ({ children, accent, ui, index, onRemove }) => (
  <div style={{ marginBottom: '12px', padding: '15px 15px 11px 21px', borderRadius: '11px', border: `1.5px solid ${ui.border}`, background: ui.tagBg, position: 'relative', borderLeft: `3px solid ${accent}` }}>
    <div style={{ position: 'absolute', top: '12px', left: '-10px', width: '17px', height: '17px', borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 650, color: '#fff', fontFamily: 'monospace', boxShadow: `0 2px 6px ${accent}44` }}>{index + 1}</div>
    {onRemove && <button onClick={onRemove} style={{ position: 'absolute', top: '9px', right: '9px', background: '#FEE2E2', border: 'none', color: '#E8445A', cursor: 'pointer', width: '20px', height: '20px', borderRadius: '50%', fontSize: '12px', fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
    <div style={{ paddingTop: '1px' }}>{children}</div>
  </div>
);

const AddBtn: FC<{ onClick: () => void; label: string; accent: string }> = ({ onClick, label, accent }) => (
  <button onClick={onClick}
    style={{ width: '100%', padding: '10px', background: 'transparent', border: `1.5px dashed ${accent}`, borderRadius: '10px', color: accent, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '11px', fontWeight: 650, transition: 'background 0.2s' }}
    onMouseEnter={e => (e.currentTarget.style.background = `${accent}10`)}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
    + {label}
  </button>
);

const Pill: FC<{ text: string; accent: string }> = ({ text, accent }) => (
  <span style={{ display: 'inline-block', padding: '3px 9px', margin: '2px', borderRadius: '20px', background: `${accent}18`, color: accent, fontSize: '10px', fontWeight: 650, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{text.trim()}</span>
);

// ─── Completeness Bar ─────────────────────────────────────────────────────────

const CompletenessBar: FC<{ data: CVData; accent: string; ui: UITheme }> = ({ data, accent, ui }) => {
  const { score, missing } = calcCompleteness(data);
  const [expanded, setExpanded] = useState(false);
  const color = score >= 80 ? '#2F9E44' : score >= 50 ? '#F59E0B' : '#E8445A';

  return (
    <div style={{ background: ui.card, border: `1px solid ${ui.border}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>{score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'}</span>
          <span style={{ fontSize: '12px', fontWeight: 650, color: ui.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>CV Completeness</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 650, color, fontFamily: "'Syne',sans-serif" }}>{score}%</span>
          {missing.length > 0 && (
            <button onClick={() => setExpanded(e => !e)}
              style={{ fontSize: '9px', color: accent, fontWeight: 650, background: `${accent}14`, border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {expanded ? 'Hide' : `${missing.length} missing`}
            </button>
          )}
        </div>
      </div>

      {/* Bar */}
      <div style={{ height: '6px', background: ui.border, borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg,${color},${color}99)`, borderRadius: '99px', transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
      </div>

      {/* Missing items */}
      {expanded && missing.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {missing.map((m, i) => (
            <span key={i} style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', background: ui.errorBg, color: '#E8445A', fontWeight: 650, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              + {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ATS Panel ────────────────────────────────────────────────────────────────

const ATSPanel: FC<{ data: CVData; accent: string; ui: UITheme }> = ({ data, accent, ui }) => {
  const { score, tips, good } = calcATS(data);
  const color = score >= 70 ? '#2F9E44' : score >= 40 ? '#F59E0B' : '#E8445A';
  const [tab, setTab] = useState<'improve' | 'good'>('improve');

  return (
    <div style={{ background: ui.card, border: `1px solid ${ui.border}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>🤖</span>
          <span style={{ fontSize: '12px', fontWeight: 650, color: ui.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>ATS Score</span>
          <span style={{ fontSize: '9px', color: ui.textMuted, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Applicant Tracking System</span>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 650, color, fontFamily: "'Syne',sans-serif" }}>{score}/100</span>
      </div>

      {/* Score bar */}
      <div style={{ height: '5px', background: ui.border, borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: '99px', transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {(['improve', 'good'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '4px 10px', borderRadius: '7px', border: `1.5px solid ${tab === t ? accent : ui.border}`, background: tab === t ? `${accent}14` : 'transparent', color: tab === t ? accent : ui.textMuted, fontSize: '10px', fontWeight: 650, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {t === 'improve' ? `⚡ Improve (${tips.length})` : `✅ Good (${good.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {tab === 'improve' && tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', borderRadius: '8px', background: ui.errorBg, border: `1px solid #FCA5A520` }}>
            <span style={{ fontSize: '10px', flexShrink: 0, marginTop: '1px' }}>💡</span>
            <span style={{ fontSize: '11px', color: ui.text, fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: '1.5' }}>{tip}</span>
          </div>
        ))}
        {tab === 'improve' && tips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '12px', color: '#2F9E44', fontSize: '12px', fontWeight: 650, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>🎉 No improvements needed!</div>
        )}
        {tab === 'good' && good.map((g, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #86EFAC20' }}>
            <span style={{ fontSize: '10px', flexShrink: 0, marginTop: '1px' }}>✅</span>
            <span style={{ fontSize: '11px', color: ui.text, fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: '1.5' }}>{g}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Validation Toast ─────────────────────────────────────────────────────────

const ValidationToast: FC<{ errors: ValidationErrors; accent: string }> = ({ errors }) => {
  const msgs = Object.values(errors);
  if (msgs.length === 0) return null;
  return (
    <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1F2937', borderRadius: '12px', padding: '12px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 999, display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Plus Jakarta Sans',sans-serif", animation: 'toastIn 0.3s ease forwards' }}>
      <span style={{ fontSize: '16px' }}>⚠️</span>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 650, color: '#F9FAFB', marginBottom: '2px' }}>Please fix {msgs.length} field{msgs.length > 1 ? 's' : ''} before continuing</div>
        <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{msgs[0]}{msgs.length > 1 ? ` (+${msgs.length - 1} more)` : ''}</div>
      </div>
    </div>
  );
};

// ─── Step 1: Personal ─────────────────────────────────────────────────────────

const Step1: FC<{ data: PersonalData; onChange: (d: PersonalData) => void; accent: string; ui: UITheme; errors: ValidationErrors }> = ({ data, onChange, accent, ui, errors }) => {
  const u = (f: keyof PersonalData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, [f]: e.target.value });
  const fileRef = useRef<HTMLInputElement>(null);
  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange({ ...data, photo: ev.target?.result as string });
    reader.readAsDataURL(file);
  };
  return (
    <div>
      {/* Photo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div onClick={() => fileRef.current?.click()}
          style={{ width: '86px', height: '86px', borderRadius: '50%', border: `2.5px dashed ${accent}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: ui.tagBg, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}12`; e.currentTarget.style.borderStyle = 'solid'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ui.tagBg; e.currentTarget.style.borderStyle = 'dashed'; }}>
          {data.photo ? <img src={data.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <><span style={{ fontSize: '20px' }}>📷</span><span style={{ fontSize: '8px', color: accent, fontWeight: 650, fontFamily: "'Plus Jakarta Sans',sans-serif", marginTop: '3px', textTransform: 'uppercase' }}>Add Photo</span></>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <FInput label="Full Name *" value={data.name}  onChange={u('name')}  accent={accent} ui={ui} placeholder="Ahmed Mohamed" error={errors.name} />
        <FInput label="Job Title *" value={data.title} onChange={u('title')} accent={accent} ui={ui} placeholder="CS Student / Frontend Dev" error={errors.title} />
        <FInput label="Email *"     value={data.email} onChange={u('email')} accent={accent} ui={ui} type="email" placeholder="ahmed@email.com" error={errors.email} />
        <FInput label="Phone"       value={data.phone} onChange={u('phone')} accent={accent} ui={ui} placeholder="+20 100 000 0000" />
        <FInput label="Location"    value={data.location} onChange={u('location')} accent={accent} ui={ui} placeholder="Cairo, Egypt" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <FInput label="LinkedIn" value={data.linkedin}  onChange={u('linkedin')}  accent={accent} ui={ui} type="url" placeholder="linkedin.com/in/ahmed" />
        <FInput label="GitHub"   value={data.github}    onChange={u('github')}    accent={accent} ui={ui} type="url" placeholder="github.com/ahmed" />
        <FInput label="Portfolio" value={data.portfolio} onChange={u('portfolio')} accent={accent} ui={ui} type="url" placeholder="ahmed.dev" />
      </div>
      <FInput label="Professional Summary" value={data.summary} onChange={u('summary')} accent={accent} ui={ui} type="textarea"
        placeholder="3rd-year CS student passionate about web dev, seeking an internship to apply my React & Node.js skills in a real product..." />
      <div style={{ fontSize: '11px', color: data.summary.length >= 100 ? '#2F9E44' : data.summary.length >= 50 ? '#F59E0B' : ui.textMuted, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 650, marginTop: '-14px', marginBottom: '16px' }}>
        {data.summary.length}/100 chars {data.summary.length >= 100 ? '✅' : data.summary.length >= 50 ? '⚡ Almost there' : '— aim for 100+'}
      </div>
    </div>
  );
};

// ─── Step 2: Academic ─────────────────────────────────────────────────────────

const Step2: FC<{ data: AcademicData; onChange: (d: AcademicData) => void; accent: string; ui: UITheme; errors: ValidationErrors }> = ({ data, onChange, accent, ui, errors }) => {
  const uEdu  = (id: number, f: keyof EducationEntry)  => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, education:      data.education.map(x => x.id === id ? { ...x, [f]: e.target.value } : x) });
  const uExp  = (id: number, f: keyof ExperienceEntry) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, experience:     data.experience.map(x => x.id === id ? { ...x, [f]: e.target.value } : x) });
  const uSkill = (f: keyof SkillsData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, skills: { ...data.skills, [f]: e.target.value } });
  const uProj = (id: number, f: keyof ProjectEntry)    => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, projects:       data.projects.map(x => x.id === id ? { ...x, [f]: e.target.value } : x) });
  const uCert = (id: number, f: keyof CertEntry)       => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...data, certifications: data.certifications.map(x => x.id === id ? { ...x, [f]: e.target.value } : x) });

  return (
    <div>
      {/* Education */}
      <SubSection title="Education" emoji="🎓" accent={accent} ui={ui}
        tip="List your most recent degree first. Include your GPA if it's 3.0+. For expected graduation, write 'Expected May 2026'.">
        {errors.education && <div style={{ fontSize: '11px', color: '#E8445A', marginBottom: '10px', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 650 }}>⚠ {errors.education}</div>}
        {data.education.map((e, i) => (
          <EntryCard key={e.id} accent={accent} ui={ui} index={i} onRemove={data.education.length > 1 ? () => onChange({ ...data, education: data.education.filter(x => x.id !== e.id) }) : undefined}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
              <FInput label="Degree *"    value={e.degree} onChange={uEdu(e.id, 'degree')} accent={accent} ui={ui} placeholder="B.Sc. Computer Science" />
              <FInput label="University *" value={e.school} onChange={uEdu(e.id, 'school')} accent={accent} ui={ui} placeholder="Cairo University" />
              <FInput label="Year"        value={e.year}   onChange={uEdu(e.id, 'year')}   accent={accent} ui={ui} placeholder="Expected 2026" />
              <FInput label="GPA"         value={e.gpa}    onChange={uEdu(e.id, 'gpa')}    accent={accent} ui={ui} placeholder="3.7 / 4.0" />
            </div>
          </EntryCard>
        ))}
        <AddBtn onClick={() => onChange({ ...data, education: [...data.education, emptyEdu()] })} label="Add Degree" accent={accent} />
      </SubSection>

      {/* Experience */}
      <SubSection title="Experience" emoji="💼" accent={accent} ui={ui}
        tip="Include internships, part-time jobs, freelance work, or even volunteer experience. Use bullet points starting with action verbs: 'Built', 'Led', 'Improved'.">
        {data.experience.map((e, i) => (
          <EntryCard key={e.id} accent={accent} ui={ui} index={i} onRemove={data.experience.length > 1 ? () => onChange({ ...data, experience: data.experience.filter(x => x.id !== e.id) }) : undefined}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
              <FInput label="Job Title / Role"   value={e.role}    onChange={uExp(e.id, 'role')}    accent={accent} ui={ui} placeholder="Frontend Intern" />
              <FInput label="Company / Org"      value={e.company} onChange={uExp(e.id, 'company')} accent={accent} ui={ui} placeholder="Company Name" />
              <FInput label="Period"             value={e.period}  onChange={uExp(e.id, 'period')}  accent={accent} ui={ui} placeholder="Jun 2023 – Aug 2023" />
            </div>
            <FInput label="Key achievements & responsibilities" value={e.description} onChange={uExp(e.id, 'description')} accent={accent} ui={ui} type="textarea"
              placeholder="• Built X feature used by 500+ users&#10;• Reduced load time by 40% using lazy loading&#10;• Collaborated with team of 5 developers" />
          </EntryCard>
        ))}
        <AddBtn onClick={() => onChange({ ...data, experience: [...data.experience, emptyExp()] })} label="Add Experience" accent={accent} />
      </SubSection>

      {/* Skills */}
      <SubSection title="Skills" emoji="⚡" accent={accent} ui={ui}
        tip="Be specific! Instead of 'JavaScript', write 'React, TypeScript, Node.js'. ATS systems match exact keywords from job descriptions.">
        {errors.technical && <div style={{ fontSize: '11px', color: '#E8445A', marginBottom: '10px', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 650 }}>⚠ {errors.technical}</div>}
        <FInput label="Technical Skills *" value={data.skills.technical} onChange={uSkill('technical')} accent={accent} ui={ui} placeholder="React, TypeScript, Python, Git, SQL, Docker..." />
        <FInput label="Soft Skills"        value={data.skills.soft}      onChange={uSkill('soft')}      accent={accent} ui={ui} placeholder="Teamwork, Leadership, Problem Solving..." />
        <FInput label="Languages"          value={data.skills.languages} onChange={uSkill('languages')} accent={accent} ui={ui} placeholder="Arabic (Native), English (Fluent)..." />
      </SubSection>

      {/* Projects */}
      <SubSection title="Projects" emoji="🚀" accent={accent} ui={ui}
        tip="Projects replace experience for students. Add a live link or GitHub URL. Mention the problem it solves and the tech used. Quantify if possible: '500+ users', '3 collaborators'.">
        {data.projects.map((p, i) => (
          <EntryCard key={p.id} accent={accent} ui={ui} index={i} onRemove={data.projects.length > 1 ? () => onChange({ ...data, projects: data.projects.filter(x => x.id !== p.id) }) : undefined}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
              <FInput label="Project Name" value={p.name} onChange={uProj(p.id, 'name')} accent={accent} ui={ui} placeholder="E-commerce App" />
              <FInput label="Tech Stack"   value={p.tech} onChange={uProj(p.id, 'tech')} accent={accent} ui={ui} placeholder="React, Node.js, MongoDB" />
              <FInput label="GitHub / Live Link" value={p.link} onChange={uProj(p.id, 'link')} accent={accent} ui={ui} type="url" placeholder="github.com/ahmed/project" />
            </div>
            <FInput label="What does it do?" value={p.description} onChange={uProj(p.id, 'description')} accent={accent} ui={ui} type="textarea" placeholder="A full-stack e-commerce app with 500+ products, built with React & Node.js..." />
          </EntryCard>
        ))}
        <AddBtn onClick={() => onChange({ ...data, projects: [...data.projects, emptyProj()] })} label="Add Project" accent={accent} />
      </SubSection>

      {/* Certifications */}
      <SubSection title="Certifications" emoji="🏆" accent={accent} ui={ui}
        tip="Include Coursera, Udemy, ITI, Google, Meta, or AWS certificates. Even free online courses count if they're relevant.">
        {data.certifications.map((c, i) => (
          <EntryCard key={c.id} accent={accent} ui={ui} index={i} onRemove={data.certifications.length > 1 ? () => onChange({ ...data, certifications: data.certifications.filter(x => x.id !== c.id) }) : undefined}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 18px' }}>
              <FInput label="Certificate" value={c.name}   onChange={uCert(c.id, 'name')}   accent={accent} ui={ui} placeholder="React Developer" />
              <FInput label="Issued By"   value={c.issuer} onChange={uCert(c.id, 'issuer')} accent={accent} ui={ui} placeholder="Meta / Coursera / ITI" />
              <FInput label="Date"        value={c.date}   onChange={uCert(c.id, 'date')}   accent={accent} ui={ui} placeholder="Jan 2024" />
            </div>
          </EntryCard>
        ))}
        <AddBtn onClick={() => onChange({ ...data, certifications: [...data.certifications, emptyCert()] })} label="Add Certificate" accent={accent} />
      </SubSection>
    </div>
  );
};

// ─── CV Templates ─────────────────────────────────────────────────────────────

const CVModern: FC<{ data: CVData; accent: string }> = ({ data, accent }) => {
  const { personal: p, academic: ac } = data;
  const tech = ac.skills.technical ? ac.skills.technical.split(',') : [];
  const soft = ac.skills.soft       ? ac.skills.soft.split(',')       : [];
  const lang = ac.skills.languages  ? ac.skills.languages.split(',')  : [];
  return (
    <div style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif", maxWidth: '800px', margin: '0 auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', borderRadius: '14px', overflow: 'hidden', fontSize: '12px' }}>
      <div style={{ background: `linear-gradient(135deg,${accent},${accent}BB)`, padding: '28px 34px', display: 'flex', gap: '18px', alignItems: 'center' }}>
        {p.photo && <img src={p.photo} alt="" style={{ width: '68px', height: '68px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', objectFit: 'cover', flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 2px', fontSize: '22px', fontFamily: "'Syne',sans-serif", fontWeight: 650, color: '#fff' }}>{p.name || 'Your Name'}</h1>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 650, marginBottom: '8px' }}>{p.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>
            {p.email&&<span>✉ {p.email}</span>}{p.phone&&<span>📞 {p.phone}</span>}{p.location&&<span>📍 {p.location}</span>}{p.linkedin&&<span>🔗 {p.linkedin}</span>}{p.github&&<span>💻 {p.github}</span>}{p.portfolio&&<span>🌐 {p.portfolio}</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '185px 1fr' }}>
        <div style={{ background: '#F9FAFB', padding: '20px 14px', borderRight: '1px solid #F3F4F6' }}>
          {tech.length > 0 && <div style={{ marginBottom: '14px' }}><div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 650, marginBottom: '5px' }}>Technical</div>{tech.map((s, i) => <Pill key={i} text={s} accent={accent} />)}</div>}
          {soft.length > 0 && <div style={{ marginBottom: '14px' }}><div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 650, marginBottom: '5px' }}>Soft Skills</div>{soft.map((s, i) => <Pill key={i} text={s} accent={accent} />)}</div>}
          {lang.length > 0 && <div style={{ marginBottom: '14px' }}><div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 650, marginBottom: '5px' }}>Languages</div>{lang.map((s, i) => <Pill key={i} text={s} accent={accent} />)}</div>}
          {ac.education.some(e => e.degree) && <div style={{ marginBottom: '14px' }}><div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 650, marginBottom: '5px' }}>Education</div>{ac.education.filter(e => e.degree).map(e => <div key={e.id} style={{ marginBottom: '7px' }}><div style={{ fontWeight: 650, fontSize: '10px', color: '#111827' }}>{e.degree}</div><div style={{ fontSize: '9px', color: '#6B7280' }}>{e.school}</div><div style={{ fontSize: '9px', color: accent, fontWeight: 600 }}>{e.year}{e.gpa ? ` · ${e.gpa}` : ''}</div></div>)}</div>}
          {ac.certifications.some(c => c.name) && <div><div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 650, marginBottom: '5px' }}>Certifications</div>{ac.certifications.filter(c => c.name).map(c => <div key={c.id} style={{ marginBottom: '6px' }}><div style={{ fontWeight: 650, fontSize: '10px', color: '#111827' }}>{c.name}</div><div style={{ fontSize: '9px', color: '#9CA3AF' }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</div></div>)}</div>}
        </div>
        <div style={{ padding: '20px 24px' }}>
          {p.summary && <div style={{ marginBottom: '14px' }}><div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 800, marginBottom: '5px' }}>About</div><p style={{ fontSize: '11px', lineHeight: '1.8', color: '#4B5563', margin: 0 }}>{p.summary}</p></div>}
          {ac.experience.some(e => e.role) && <div style={{ marginBottom: '14px' }}><div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 800, marginBottom: '8px' }}>Experience</div>{ac.experience.filter(e => e.role).map(e => <div key={e.id} style={{ marginBottom: '9px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontWeight: 650, fontSize: '11px', color: '#111827' }}>{e.role}</span><span style={{ fontSize: '9px', color: '#9CA3AF' }}>{e.period}</span></div><div style={{ fontSize: '10px', color: accent, marginBottom: '2px', fontWeight: 650 }}>{e.company}</div>{e.description && <p style={{ fontSize: '10px', color: '#6B7280', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-line' }}>{e.description}</p>}</div>)}</div>}
          {ac.projects.some(p => p.name) && <div><div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 800, marginBottom: '7px' }}>Projects</div>{ac.projects.filter(p => p.name).map(p => <div key={p.id} style={{ marginBottom: '8px', padding: '8px 10px', borderRadius: '7px', background: '#F9FAFB', border: `1px solid ${accent}20` }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}><span style={{ fontWeight: 650, fontSize: '11px', color: '#111827' }}>{p.name}</span>{p.link && <a href={p.link} style={{ fontSize: '9px', color: accent, textDecoration: 'none', fontWeight: 650 }}>🔗</a>}</div>{p.tech && <div style={{ marginBottom: '2px' }}>{p.tech.split(',').map((t, i) => <Pill key={i} text={t} accent={accent} />)}</div>}{p.description && <p style={{ fontSize: '10px', color: '#6B7280', margin: 0, lineHeight: '1.5' }}>{p.description}</p>}</div>)}</div>}
        </div>
      </div>
    </div>
  );
};

const CVClassic: FC<{ data: CVData; accent: string }> = ({ data, accent }) => {
  const { personal: p, academic: ac } = data;
  const tech = ac.skills.technical ? ac.skills.technical.split(',') : [];
  const lang = ac.skills.languages  ? ac.skills.languages.split(',')  : [];
  const D = () => <div style={{ borderBottom: `2px solid ${accent}`, marginBottom: '9px', marginTop: '2px' }} />;
  const H = ({ t }: { t: string }) => <><div style={{ fontSize: '8px', letterSpacing: '2px', color: accent, fontWeight: 650, textTransform: 'uppercase', marginBottom: '2px' }}>{t}</div><D /></>;
  return (
    <div style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif", maxWidth: '780px', margin: '0 auto', padding: '38px 46px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', fontSize: '12px' }}>
      <div style={{ borderTop: `5px solid ${accent}`, paddingTop: '18px', marginBottom: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        {p.photo && <img src={p.photo} alt="" style={{ width: '58px', height: '58px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}`, flexShrink: 0 }} />}
        <div><h1 style={{ margin: '0 0 2px', fontSize: '22px', fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#111827' }}>{p.name || 'Your Name'}</h1><div style={{ fontSize: '11px', color: accent, fontWeight: 650, marginBottom: '4px' }}>{p.title}</div><div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '10px', color: '#6B7280' }}>{p.email&&<span>✉ {p.email}</span>}{p.phone&&<span>📞 {p.phone}</span>}{p.location&&<span>📍 {p.location}</span>}{p.linkedin&&<span>🔗 {p.linkedin}</span>}{p.github&&<span>💻 {p.github}</span>}</div></div>
      </div>
      {p.summary&&<><H t="Summary"/><p style={{ fontSize:'11px',lineHeight:'1.8',color:'#4B5563',margin:'0 0 13px' }}>{p.summary}</p></>}
      {ac.education.some(e=>e.degree)&&<><H t="Education"/>{ac.education.filter(e=>e.degree).map(e=><div key={e.id} style={{ display:'flex',justifyContent:'space-between',marginBottom:'7px' }}><div><div style={{ fontWeight:650,color:'#111827' }}>{e.degree}</div><div style={{ fontSize:'10px',color:'#6B7280' }}>{e.school}{e.gpa?` · GPA: ${e.gpa}`:''}</div></div><div style={{ fontSize:'10px',color:accent,fontWeight:650 }}>{e.year}</div></div>)}<div style={{ marginBottom:'12px' }}/></>}
      {ac.experience.some(e=>e.role)&&<><H t="Experience"/>{ac.experience.filter(e=>e.role).map(e=><div key={e.id} style={{ marginBottom:'10px' }}><div style={{ display:'flex',justifyContent:'space-between' }}><span style={{ fontWeight:650 }}>{e.role}</span><span style={{ fontSize:'10px',color:'#9CA3AF' }}>{e.period}</span></div><div style={{ fontSize:'10px',color:accent,fontWeight:600,marginBottom:'2px' }}>{e.company}</div>{e.description&&<p style={{ fontSize:'10px',color:'#6B7280',margin:0,lineHeight:'1.5',whiteSpace:'pre-line' }}>{e.description}</p>}</div>)}<div style={{ marginBottom:'12px' }}/></>}
      {ac.projects.some(p=>p.name)&&<><H t="Projects"/>{ac.projects.filter(p=>p.name).map(p=><div key={p.id} style={{ marginBottom:'8px' }}><div style={{ display:'flex',justifyContent:'space-between' }}><span style={{ fontWeight:650 }}>{p.name}</span>{p.link&&<a href={p.link} style={{ fontSize:'9px',color:accent }}>🔗</a>}</div>{p.tech&&<div style={{ fontSize:'10px',color:'#6B7280',marginBottom:'1px' }}>Stack: {p.tech}</div>}{p.description&&<p style={{ fontSize:'10px',color:'#6B7280',margin:0 }}>{p.description}</p>}</div>)}<div style={{ marginBottom:'12px' }}/></>}
      {ac.certifications.some(c=>c.name)&&<><H t="Certifications"/>{ac.certifications.filter(c=>c.name).map(c=><div key={c.id} style={{ display:'flex',justifyContent:'space-between',marginBottom:'4px' }}><span style={{ fontWeight:650 }}>{c.name}</span><span style={{ fontSize:'10px',color:'#9CA3AF' }}>{c.issuer}{c.date?` · ${c.date}`:''}</span></div>)}<div style={{ marginBottom:'12px' }}/></>}
      {(tech.length>0||lang.length>0)&&<><H t="Skills & Languages"/><div>{tech.map((s,i)=><Pill key={i} text={s} accent={accent}/>)}{lang.map((s,i)=><Pill key={i} text={s} accent={accent}/>)}</div></>}
    </div>
  );
};

const CVMinimal: FC<{ data: CVData; accent: string }> = ({ data, accent }) => {
  const { personal: p, academic: ac } = data;
  const tech = ac.skills.technical ? ac.skills.technical.split(',') : [];
  const lang = ac.skills.languages  ? ac.skills.languages.split(',')  : [];
  const L = ({ t }: { t: string }) => <div style={{ fontSize: '8px', letterSpacing: '3px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '7px', fontWeight: 650 }}>{t}</div>;
  return (
    <div style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif", maxWidth: '720px', margin: '0 auto', padding: '48px 54px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', fontSize: '12px' }}>
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {p.photo && <img src={p.photo} alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
          <div><h1 style={{ margin: '0 0 1px', fontSize: '24px', fontFamily: "'Syne',sans-serif", fontWeight: 650, color: '#111', letterSpacing: '-0.5px' }}>{p.name || 'Your Name'}</h1><div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{p.title}</div><div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: '#9CA3AF', flexWrap: 'wrap' }}>{p.email&&<span>{p.email}</span>}{p.phone&&<span>{p.phone}</span>}{p.location&&<span>{p.location}</span>}{p.linkedin&&<a href={p.linkedin} style={{ color:accent,textDecoration:'none' }}>LinkedIn</a>}{p.github&&<a href={p.github} style={{ color:accent,textDecoration:'none' }}>GitHub</a>}{p.portfolio&&<a href={p.portfolio} style={{ color:accent,textDecoration:'none' }}>Portfolio</a>}</div></div>
        </div>
        {p.summary&&<p style={{ fontSize:'11px',lineHeight:'1.9',color:'#6B7280',marginTop:'10px',paddingTop:'10px',borderTop:'1px solid #F3F4F6' }}>{p.summary}</p>}
      </div>
      {ac.education.some(e=>e.degree)&&<div style={{ marginBottom:'18px' }}><L t="Education"/>{ac.education.filter(e=>e.degree).map(e=><div key={e.id} style={{ marginBottom:'4px' }}><span style={{ fontWeight:800,color:'#111' }}>{e.degree}</span><span style={{ color:'#9CA3AF' }}> · {e.school}</span>{e.year&&<span style={{ color:accent }}> · {e.year}</span>}{e.gpa&&<span style={{ color:'#9CA3AF' }}> · {e.gpa}</span>}</div>)}</div>}
      {ac.experience.some(e=>e.role)&&<div style={{ marginBottom:'18px' }}><L t="Experience"/>{ac.experience.filter(e=>e.role).map(e=><div key={e.id} style={{ marginBottom:'8px' }}><div style={{ display:'flex',alignItems:'baseline',gap:'6px' }}><span style={{ fontWeight:800,color:'#111' }}>{e.role}</span><span style={{ color:'#9CA3AF',fontSize:'10px' }}>at {e.company}</span>{e.period&&<span style={{ color:accent,fontSize:'9px' }}>{e.period}</span>}</div>{e.description&&<p style={{ fontSize:'10px',color:'#6B7280',margin:'2px 0 0',lineHeight:'1.6',whiteSpace:'pre-line' }}>{e.description}</p>}</div>)}</div>}
      {ac.projects.some(p=>p.name)&&<div style={{ marginBottom:'18px' }}><L t="Projects"/>{ac.projects.filter(p=>p.name).map(p=><div key={p.id} style={{ marginBottom:'7px' }}><div style={{ display:'flex',alignItems:'center',gap:'7px' }}><span style={{ fontWeight:800,color:'#111' }}>{p.name}</span>{p.tech&&<span style={{ fontSize:'10px',color:'#9CA3AF' }}>— {p.tech}</span>}{p.link&&<a href={p.link} style={{ fontSize:'9px',color:accent,fontWeight:700,textDecoration:'none' }}>↗</a>}</div>{p.description&&<p style={{ fontSize:'10px',color:'#6B7280',margin:'1px 0 0',lineHeight:'1.5' }}>{p.description}</p>}</div>)}</div>}
      {ac.certifications.some(c=>c.name)&&<div style={{ marginBottom:'18px' }}><L t="Certifications"/>{ac.certifications.filter(c=>c.name).map(c=><div key={c.id} style={{ marginBottom:'4px' }}><span style={{ fontWeight:800,color:'#111' }}>{c.name}</span><span style={{ color:'#9CA3AF' }}> · {c.issuer}</span>{c.date&&<span style={{ color:accent }}> · {c.date}</span>}</div>)}</div>}
      {(tech.length>0||lang.length>0)&&<div><L t="Skills"/>{tech.map((s,i)=><Pill key={i} text={s} accent={accent}/>)}{lang.map((s,i)=><Pill key={i} text={s} accent={accent}/>)}</div>}
    </div>
  );
};

// ─── Mini Live Preview ────────────────────────────────────────────────────────

const MiniPreview: FC<{ data: CVData; accent: string }> = ({ data, accent }) => {
  const { personal: p, academic: ac } = data;
  const tech = ac.skills.technical ? ac.skills.technical.split(',').slice(0, 4) : [];
  const lang = ac.skills.languages  ? ac.skills.languages.split(',').slice(0, 2) : [];
  const SL = ({ t }: { t: string }) => <div style={{ fontSize: '7.5px', letterSpacing: '2px', textTransform: 'uppercase', color: accent, fontWeight: 650, borderBottom: `1.5px solid ${accent}25`, paddingBottom: '3px', marginBottom: '6px', marginTop: '11px' }}>{t}</div>;
  return (
    <div style={{ background: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif", padding: '16px 14px', minHeight: '460px', fontSize: '10px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg,${accent},${accent}77)` }} />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #F3F4F6' }}>
        {p.photo ? <img src={p.photo} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${accent}`, flexShrink: 0 }} />
          : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>👤</div>}
        <div>
          <div style={{ fontSize: '12px', fontFamily: "'Syne',sans-serif", fontWeight: 650, color: '#111', lineHeight: 1.1 }}>{p.name || 'Your Name'}</div>
          <div style={{ fontSize: '8px', color: accent, fontWeight: 650, marginTop: '2px' }}>{p.title || 'Job Title'}</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', fontSize: '7.5px', color: '#9CA3AF', marginTop: '1px' }}>
            {p.email&&<span>✉ {p.email}</span>}{p.location&&<span>📍 {p.location}</span>}
          </div>
        </div>
      </div>
      {p.summary&&<p style={{ fontSize:'8px',lineHeight:'1.55',color:'#6B7280',margin:0 }}>{p.summary.slice(0,100)}{p.summary.length>100?'...':''}</p>}
      {ac.education.some(e=>e.degree)&&<><SL t="Education"/>{ac.education.filter(e=>e.degree).slice(0,2).map(e=><div key={e.id} style={{ marginBottom:'3px',fontSize:'9px' }}><span style={{ fontWeight:650,color:'#111' }}>{e.degree}</span><span style={{ color:'#9CA3AF' }}> · {e.school}</span>{e.year&&<span style={{ color:accent }}> · {e.year}</span>}</div>)}</>}
      {ac.experience.some(e=>e.role)&&<><SL t="Experience"/>{ac.experience.filter(e=>e.role).slice(0,2).map(e=><div key={e.id} style={{ marginBottom:'3px',fontSize:'9px' }}><span style={{ fontWeight:650,color:'#111' }}>{e.role}</span><span style={{ color:accent }}> @ {e.company}</span></div>)}</>}
      {ac.projects.some(p=>p.name)&&<><SL t="Projects"/>{ac.projects.filter(p=>p.name).slice(0,2).map(p=><div key={p.id} style={{ marginBottom:'3px',fontSize:'9px' }}><span style={{ fontWeight:650,color:'#111' }}>{p.name}</span>{p.tech&&<span style={{ color:'#9CA3AF',fontSize:'7.5px' }}> — {p.tech.split(',').slice(0,2).join(', ')}</span>}</div>)}</>}
      {(tech.length>0||lang.length>0)&&<><SL t="Skills"/><div>{tech.map((s,i)=><Pill key={i} text={s} accent={accent}/>)}{lang.map((s,i)=><Pill key={i} text={s} accent={accent}/>)}</div></>}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar: FC<{ step: number; accent: string; ui: UITheme; isDark: boolean; onToggle: () => void; onJump: (i: number) => void }> = ({ step, accent, ui, isDark, onToggle, onJump }) => (
  <aside style={{ width: '218px', flexShrink: 0, background: ui.sidebar, borderRight: `1px solid ${ui.border}`, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', position: 'sticky', top: 0, transition: 'background 0.3s' }}>
    <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${ui.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', boxShadow: `0 3px 10px ${accent}44`, flexShrink: 0 }}>📄</div>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', color: ui.text, lineHeight: 1 }}>FUTURE<span style={{ color: accent }}>INTERN</span></div>
          <div style={{ fontSize: '7px', letterSpacing: '2px', color: ui.textMuted, textTransform: 'uppercase', marginTop: '2px' }}>CV Builder</div>
        </div>
      </div>
    </div>

    <nav style={{ flex: 1, paddingTop: '8px' }}>
      {STEPS.map(s => {
        const active = step === s.id, done = step > s.id;
        return (
          <button key={s.id} onClick={() => s.id <= step && onJump(s.id)}
            style={{ width: '100%', padding: '10px 16px', background: active ? `${accent}12` : 'transparent', border: 'none', borderLeft: `3px solid ${active ? accent : done ? `${accent}44` : 'transparent'}`, cursor: s.id <= step ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', textAlign: 'left' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: done ? accent : active ? `${accent}18` : ui.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? '12px' : '10px', fontWeight: 800, color: done ? '#fff' : active ? accent : ui.textMuted, fontFamily: done ? 'inherit' : 'monospace', boxShadow: active ? `0 0 12px ${accent}35` : 'none', transition: 'all 0.2s' }}>
              {done ? '✓' : String(s.id + 1).padStart(2, '0')}
            </div>
            <div>
              <div style={{ fontSize: '11.5px', color: active ? accent : done ? ui.text : ui.textMuted, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: active ? 650 : 600, transition: 'color 0.2s' }}>{s.label}</div>
              <div style={{ fontSize: '8.5px', color: ui.textMuted, marginTop: '1px' }}>{s.desc}</div>
            </div>
          </button>
        );
      })}
    </nav>

    <div style={{ padding: '12px 16px', borderTop: `1px solid ${ui.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '8.5px', color: ui.textMuted, fontWeight: 650, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Progress</span>
        <span style={{ fontSize: '8.5px', color: accent, fontWeight: 650 }}>{Math.round((step / 2) * 100)}%</span>
      </div>
      <div style={{ height: '4px', background: ui.border, borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ height: '100%', width: `${Math.round((step / 2) * 100)}%`, background: `linear-gradient(90deg,${accent},${accent}99)`, borderRadius: '99px', transition: 'width 0.5s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      <button onClick={onToggle} style={{ width: '100%', padding: '7px', background: ui.tagBg, border: `1px solid ${ui.border}`, borderRadius: '8px', color: ui.textMuted, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '10px', fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span>{isDark ? '☀️' : '🌙'}</span><span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
      <div style={{ marginTop: '8px', fontSize: '8px', color: ui.textMuted, textAlign: 'center', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        💾 Auto-saved to browser
      </div>
    </div>
  </aside>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CVBuilder() {
  const [step, setStep]             = useState<number>(0);
  const [data, setData]             = useState<CVData>(() => {
    try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : initialData; } catch { return initialData; }
  });
  const [animDir, setAnimDir]       = useState<AnimDir>('forward');
  const [animating, setAnimating]   = useState<boolean>(false);
  const [visible, setVisible]       = useState<boolean>(true);
  const [template, setTemplate]     = useState<Template>('modern');
  const [themeColor, setThemeColor] = useState<ThemeColor>('coral');
  const [isDark, setIsDark]         = useState<boolean>(false);
  const [errors, setErrors]         = useState<ValidationErrors>({});
  const [showToast, setShowToast]   = useState<boolean>(false);
  const [saveFlash, setSaveFlash]   = useState<boolean>(false);

  const accent    = THEMES[themeColor].accent;
  const ui        = isDark ? darkUI : lightUI;
  const isPreview = step === 2;

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      setSaveFlash(true);
      const t = setTimeout(() => setSaveFlash(false), 1200);
      return () => clearTimeout(t);
    } catch {}
  }, [data]);

  const go = (dir: 1 | -1): void => {
    if (animating) return;

    // Validate before advancing
    if (dir === 1) {
      let errs: ValidationErrors = {};
      if (step === 0) errs = validateStep0(data.personal);
      if (step === 1) errs = validateStep1(data.academic);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
        return;
      }
      setErrors({});
    }

    const next = step + dir;
    if (next < 0 || next > 2) return;
    setAnimDir(dir > 0 ? 'forward' : 'back');
    setAnimating(true); setVisible(false);
    setTimeout(() => { setStep(next); setVisible(true); setAnimating(false); }, 260);
  };

  const jumpTo = (i: number): void => {
    if (animating || i === step) return;
    setAnimDir(i > step ? 'forward' : 'back');
    setAnimating(true); setVisible(false);
    setTimeout(() => { setStep(i); setVisible(true); setAnimating(false); }, 260);
  };

  const animClass = visible
    ? (animDir === 'forward' ? 'aef' : 'aeb')
    : (animDir === 'forward' ? 'axf' : 'axb');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .cvbuilder-root{background:${ui.bg};font-family:'Plus Jakarta Sans',sans-serif;overflow:hidden;transition:background 0.3s;height:calc(100vh - 64px);display:flex;flex-direction:row;}
        .cvbuilder-root *{box-sizing:border-box;}
        @keyframes sef{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes seb{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes sxf{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-20px)}}
        @keyframes sxb{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(20px)}}
        @keyframes fa{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-11px) rotate(5deg)}}
        @keyframes fb{0%,100%{transform:translateY(0) rotate(45deg)}50%{transform:translateY(-8px) rotate(52deg)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes saveFlash{0%,100%{opacity:0}20%,80%{opacity:1}}
        .aef{animation:sef 0.26s cubic-bezier(.4,0,.2,1) forwards}
        .aeb{animation:seb 0.26s cubic-bezier(.4,0,.2,1) forwards}
        .axf{animation:sxf 0.26s cubic-bezier(.4,0,.2,1) forwards}
        .axb{animation:sxb 0.26s cubic-bezier(.4,0,.2,1) forwards}
        .nbtn{transition:all 0.2s !important;}
        .nbtn:not(:disabled):hover{transform:translateY(-2px) !important;}
        .nbtn:disabled{opacity:0.3;cursor:default !important;pointer-events:none;}
        .fscroll::-webkit-scrollbar{width:4px;}
        .fscroll::-webkit-scrollbar-thumb{background:${ui.border};border-radius:99px;}
        .pscroll::-webkit-scrollbar{width:3px;}
        .pscroll::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:99px;}
        .cvbuilder-root nav::-webkit-scrollbar{width:2px;}
        @media print{body *{visibility:hidden !important}#cvp,#cvp *{visibility:visible !important}#cvp{position:fixed;top:0;left:0;width:100%;z-index:9999}}
      `}</style>

      {/* Save flash indicator */}
      {saveFlash && (
        <div style={{ position: 'fixed', top: '14px', right: '14px', background: '#2F9E44', color: '#fff', padding: '5px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 650, fontFamily: "'Plus Jakarta Sans',sans-serif", zIndex: 999, animation: 'saveFlash 1.2s ease forwards', display: 'flex', alignItems: 'center', gap: '5px' }}>
          💾 Saved
        </div>
      )}

      {/* Validation toast */}
      {showToast && <ValidationToast errors={errors} accent={accent} />}

      {/* Floating shapes */}
      {!isDark && (
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '9%', left: '23%', width: '44px', height: '44px', borderRadius: '50%', background: `${accent}16`, animation: 'fa 4s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '14%', right: '27%', width: '28px', height: '28px', borderRadius: '6px', background: `${accent}12`, animation: 'fb 5s ease-in-out 1s infinite' }} />
          <div style={{ position: 'absolute', bottom: '19%', left: '25%', width: '18px', height: '18px', borderRadius: '4px', background: `${accent}16`, animation: 'fa 6s ease-in-out 2s infinite' }} />
        </div>
      )}

      <div className="cvbuilder-root" style={{ position: 'relative', zIndex: 1, marginTop: '96px' }}>

        <Sidebar step={step} accent={accent} ui={ui} isDark={isDark} onToggle={() => setIsDark(d => !d)} onJump={jumpTo} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Top bar */}
          <div style={{ height: '56px', borderBottom: `1px solid ${ui.border}`, padding: '0 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: ui.navBg, flexShrink: 0, transition: 'background 0.3s' }}>
            <div>
              <div style={{ fontSize: '13px', color: ui.text, fontFamily: "'Syne',sans-serif", fontWeight: 650 }}>{STEPS[step].label}</div>
              <div style={{ fontSize: '9px', color: ui.textMuted, marginTop: '1px' }}>{STEPS[step].desc}</div>
            </div>
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
              <button className="nbtn" onClick={() => go(-1)} disabled={step === 0}
                style={{ padding: '7px 16px', background: 'transparent', border: `1.5px solid ${ui.border}`, borderRadius: '9px', color: ui.textMuted, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '11px', fontWeight: 650 }}>← Back</button>
              {isPreview
                ? <button className="nbtn" onClick={() => window.print()}
                    style={{ padding: '7px 18px', background: accent, border: 'none', borderRadius: '9px', color: '#fff', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '11px', fontWeight: 650, boxShadow: `0 4px 14px ${accent}44` }}>↓ Download PDF</button>
                : <button className="nbtn" onClick={() => go(1)}
                    style={{ padding: '7px 20px', background: accent, border: 'none', borderRadius: '9px', color: '#fff', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '11px', fontWeight: 650, boxShadow: `0 4px 14px ${accent}44` }}>
                    {step === 1 ? '🎉 Preview CV' : 'Next →'}
                  </button>}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Form area */}
            <div className="fscroll" style={{ flex: 1, overflowY: 'auto', padding: isPreview ? '22px' : '24px 32px' }}>

              {/* Completeness + ATS panels (visible on all steps) */}
              {!isPreview && (
                <>
                  <CompletenessBar data={data} accent={accent} ui={ui} />
                  <ATSPanel data={data} accent={accent} ui={ui} />
                </>
              )}

              {/* Preview toolbar */}
              {isPreview && (
                <div style={{ background: ui.card, borderRadius: '12px', padding: '13px 18px', marginBottom: '16px', border: `1px solid ${ui.border}`, boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: ui.textMuted, fontWeight: 650, marginBottom: '6px' }}>Template</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {(['modern', 'classic', 'minimal'] as Template[]).map(t => (
                        <button key={t} onClick={() => setTemplate(t)}
                          style={{ padding: '5px 11px', borderRadius: '7px', border: `2px solid ${template === t ? accent : ui.border}`, background: template === t ? `${accent}14` : 'transparent', color: template === t ? accent : ui.textMuted, fontSize: '10px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Plus Jakarta Sans',sans-serif", textTransform: 'capitalize' }}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: ui.textMuted, fontWeight: 650, marginBottom: '6px' }}>Color</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {(Object.keys(THEMES) as ThemeColor[]).map(c => (
                        <button key={c} onClick={() => setThemeColor(c)} title={THEMES[c].label}
                          style={{ width: '20px', height: '20px', borderRadius: '50%', background: THEMES[c].accent, border: themeColor === c ? '2.5px solid #fff' : '2.5px solid transparent', cursor: 'pointer', outline: themeColor === c ? `2px solid ${THEMES[c].accent}` : 'none', outlineOffset: '2px', transition: 'all 0.2s' }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '7px' }}>
                    <button className="nbtn" onClick={() => jumpTo(0)}
                      style={{ padding: '6px 12px', background: ui.tagBg, border: `1px solid ${ui.border}`, borderRadius: '7px', color: ui.text, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '10px', fontWeight: 650 }}>✏️ Edit</button>
                  </div>

                  {/* ATS + Completeness also on preview */}
                  <div style={{ width: '100%', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}><CompletenessBar data={data} accent={accent} ui={ui} /></div>
                    <div style={{ flex: 1, minWidth: '200px' }}><ATSPanel data={data} accent={accent} ui={ui} /></div>
                  </div>
                </div>
              )}

              <div className={animClass}>
                {step === 0 && <div style={{ background: ui.card, borderRadius: '16px', padding: '28px 28px 20px', boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)', border: `1px solid ${ui.border}` }}><Step1 data={data.personal} onChange={p => setData({ ...data, personal: p })} accent={accent} ui={ui} errors={errors} /></div>}
                {step === 1 && <div style={{ background: ui.card, borderRadius: '16px', padding: '28px 28px 20px', boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)', border: `1px solid ${ui.border}` }}><Step2 data={data.academic} onChange={a => setData({ ...data, academic: a })} accent={accent} ui={ui} errors={errors} /></div>}
                {step === 2 && <div id="cvp">{template==='modern'&&<CVModern data={data} accent={accent}/>}{template==='classic'&&<CVClassic data={data} accent={accent}/>}{template==='minimal'&&<CVMinimal data={data} accent={accent}/>}</div>}
              </div>
            </div>

            {/* Live Preview panel */}
            {!isPreview && (
              <div style={{ width: '305px', flexShrink: 0, borderLeft: `1px solid ${ui.border}`, background: ui.previewShell, display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>
                <div style={{ padding: '9px 13px', borderBottom: `1px solid ${ui.border}`, display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, boxShadow: `0 0 7px ${accent}88` }} />
                  <span style={{ fontSize: '8.5px', letterSpacing: '2.5px', color: ui.textMuted, textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 650 }}>Live Preview</span>
                  <span style={{ marginLeft: 'auto', fontSize: '7.5px', color: ui.textMuted }}>updates as you type</span>
                </div>
                <div className="pscroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
                  <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}>
                    <MiniPreview data={data} accent={accent} />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
