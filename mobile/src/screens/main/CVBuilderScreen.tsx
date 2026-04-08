import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator, Alert, Modal,
  KeyboardAvoidingView, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';
import { RootStackParamList, CVSection } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CVBuilder'>;

// â”€â”€â”€ ATS Section Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SectionType = 'education' | 'experience' | 'skills' | 'projects' | 'certifications';

const SECTION_CONFIG: Record<SectionType, {
  label: string; icon: string; color: string;
  titleLabel: string; subtitleLabel?: string; hasDates: boolean; tip: string;
}> = {
  education:      { label: 'Education',      icon: 'school-outline',      color: '#3B5BDB', titleLabel: 'Degree / Qualification', subtitleLabel: 'Institution Name', hasDates: true,  tip: 'Use the full official degree name.' },
  experience:     { label: 'Work Experience', icon: 'briefcase-outline',   color: '#2F9E44', titleLabel: 'Job Title',             subtitleLabel: 'Company Name',      hasDates: true,  tip: 'Start descriptions with action verbs. Include metrics.' },
  skills:         { label: 'Skills',          icon: 'flash-outline',       color: '#E8445A', titleLabel: 'Category (e.g. Programming Languages)', hasDates: false, tip: 'List as comma-separated skills.' },
  projects:       { label: 'Projects',        icon: 'rocket-outline',      color: '#F59E0B', titleLabel: 'Project Name',          subtitleLabel: 'Technologies Used', hasDates: true,  tip: 'Describe impact: "500+ users", "deployed to AWS".' },
  certifications: { label: 'Certifications',  icon: 'ribbon-outline',      color: '#8B5CF6', titleLabel: 'Certification Name',    subtitleLabel: 'Issuing Organisation', hasDates: false, tip: 'Use the exact official name.' },
};

const SECTION_TYPES = Object.keys(SECTION_CONFIG) as SectionType[];

// â”€â”€â”€ Header (name + email from profile, editable fields) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CVHeader { headline: string; summary: string; phone: string; linkedin: string; github: string; website: string; }
const emptyHeader = (): CVHeader => ({ headline: '', summary: '', phone: '', linkedin: '', github: '', website: '' });

// â”€â”€â”€ Field Input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Field({ label, value, onChange, multiline, placeholder, C }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; C: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        style={{
          backgroundColor: C.card,
          borderWidth: 1, borderColor: C.border,
          borderRadius: Radius.md,
          paddingHorizontal: 12, paddingVertical: 10,
          fontSize: FontSize.base, color: C.text,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

// â”€â”€â”€ Section Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionCard({ section, onEdit, onDelete, onMoveUp, onMoveDown, C }: {
  section: CVSection; onEdit: () => void; onDelete: () => void;
  onMoveUp: () => void; onMoveDown: () => void; C: any;
}) {
  const cfg = SECTION_CONFIG[section.section_type as SectionType];
  return (
    <View style={[sCardStyles.card, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={sCardStyles.left}>
        <View style={[sCardStyles.iconBox, { backgroundColor: cfg.color + '18' }]}>
          <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
        </View>
        <View style={sCardStyles.info}>
          <Text style={[sCardStyles.label, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[sCardStyles.title, { color: C.text }]} numberOfLines={1}>{section.title || 'Untitled'}</Text>
          {(section.subtitle || section.start_date) ? (
            <Text style={[sCardStyles.sub, { color: C.textSecondary }]} numberOfLines={1}>
              {[section.subtitle, section.start_date && `${section.start_date}${section.end_date ? ` â€“ ${section.end_date}` : ''}`].filter(Boolean).join(' Â· ')}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={sCardStyles.actions}>
        <TouchableOpacity onPress={onMoveUp} style={sCardStyles.btn}>
          <Ionicons name="chevron-up" size={18} color={C.gray400} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMoveDown} style={sCardStyles.btn}>
          <Ionicons name="chevron-down" size={18} color={C.gray400} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} style={sCardStyles.btn}>
          <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={sCardStyles.btn}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sCardStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, padding: 12, marginBottom: 10, borderWidth: 1, ...Shadow.sm },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontSize: FontSize.sm, fontWeight: '700', marginTop: 1 },
  sub: { fontSize: FontSize.xs, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 2 },
  btn: { padding: 6 },
});

// â”€â”€â”€ Add / Edit Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ModalState {
  visible: boolean;
  editing: CVSection | null;
  type: SectionType;
  title: string;
  subtitle: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

function SectionModal({ state, onClose, onSave, C }: {
  state: ModalState; onClose: () => void;
  onSave: (data: Omit<CVSection, 'id' | 'order_index'>) => Promise<void>; C: any;
}) {
  const cfg = SECTION_CONFIG[state.type];
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(state.title);
  const [subtitle, setSubtitle] = useState(state.subtitle);
  const [location, setLocation] = useState(state.location);
  const [startDate, setStartDate] = useState(state.startDate);
  const [endDate, setEndDate] = useState(state.endDate);
  const [description, setDescription] = useState(state.description);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Title is required.'); return; }
    setSaving(true);
    try {
      await onSave({ section_type: state.type, title: title.trim(), subtitle: subtitle.trim(), location: location.trim(), start_date: startDate.trim(), end_date: endDate.trim(), description: description.trim() });
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save section.');
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={state.visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={[mStyles.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[mStyles.headerTitle, { color: C.text }]}>{state.editing ? 'Edit Section' : 'Add Section'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[mStyles.saveBtn, { backgroundColor: cfg.color }]}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={mStyles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.md }} keyboardShouldPersistTaps="handled">
          {/* Type badge */}
          <View style={[mStyles.typeBadge, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '40' }]}>
            <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
            <Text style={[mStyles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          <Field label={cfg.titleLabel} value={title} onChange={setTitle} placeholder={`e.g. ${cfg.titleLabel}`} C={C} />
          {cfg.subtitleLabel && <Field label={cfg.subtitleLabel} value={subtitle} onChange={setSubtitle} placeholder={cfg.subtitleLabel} C={C} />}
          {!cfg.subtitleLabel && <View />}

          {cfg.hasDates && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label="Start Date" value={startDate} onChange={setStartDate} placeholder="e.g. Sep 2022" C={C} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="End Date" value={endDate} onChange={setEndDate} placeholder="Present" C={C} />
              </View>
            </View>
          )}

          <Field label="Location (optional)" value={location} onChange={setLocation} placeholder="Cairo, Egypt" C={C} />
          <Field label="Description" value={description} onChange={setDescription} multiline placeholder={`Describe your ${cfg.label.toLowerCase()}â€¦`} C={C} />

          {/* ATS tip */}
          <View style={[mStyles.tip, { backgroundColor: '#2563eb12', borderColor: '#2563eb30' }]}>
            <Ionicons name="bulb-outline" size={14} color="#2563eb" />
            <Text style={[mStyles.tipText, { color: '#2563eb' }]}>{cfg.tip}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 12, paddingHorizontal: Spacing.md, borderBottomWidth: 1 },
  closeBtn: { padding: 4, width: 36 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.md, fontWeight: '800' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, marginBottom: 16 },
  typeBadgeText: { fontSize: FontSize.sm, fontWeight: '700' },
  tip: { flexDirection: 'row', gap: 6, padding: 10, borderRadius: Radius.md, borderWidth: 1, marginTop: 4 },
  tipText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },
});

// â”€â”€â”€ Type Picker Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TypePickerModal({ visible, onClose, onSelect, C }: {
  visible: boolean; onClose: () => void; onSelect: (t: SectionType) => void; C: any;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <View style={[mStyles.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[mStyles.headerTitle, { color: C.text }]}>Choose Section Type</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: 10 }}>
          {SECTION_TYPES.map(t => {
            const cfg = SECTION_CONFIG[t];
            return (
              <TouchableOpacity
                key={t}
                onPress={() => onSelect(t)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, ...Shadow.sm }}
                activeOpacity={0.8}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: cfg.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.base, fontWeight: '700', color: C.text }}>{cfg.label}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: C.textSecondary, marginTop: 2 }}>{cfg.tip}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.gray400} />
              </TouchableOpacity>
            );
          })}
          <View style={{ backgroundColor: '#2563eb12', borderColor: '#2563eb30', borderWidth: 1, borderRadius: Radius.md, padding: 12, flexDirection: 'row', gap: 8 }}>
            <Ionicons name="lock-closed-outline" size={14} color="#2563eb" />
            <Text style={{ flex: 1, fontSize: FontSize.xs, color: '#2563eb', lineHeight: 16 }}>
              Section headings are locked to ATS-standard labels to ensure parsers can read your CV correctly.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// â”€â”€â”€ Save Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
const STATUS_TEXT: Record<SaveStatus, string> = { idle: '', saving: 'Savingâ€¦', saved: 'Saved', error: 'Save failed' };
const STATUS_COLOR: Record<SaveStatus, string> = { idle: '', saving: '#f59e0b', saved: '#16a34a', error: '#dc2626' };

// â”€â”€â”€ Main Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CVBuilderScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [header, setHeader] = useState<CVHeader>(emptyHeader());
  const [sections, setSections] = useState<CVSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [exporting, setExporting] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [modal, setModal] = useState<ModalState>({ visible: false, editing: null, type: 'education', title: '', subtitle: '', location: '', startDate: '', endDate: '', description: '' });

  // â”€â”€ Load CV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    (async () => {
      try {
        const res = await api.cv.get();
        if (res.cv) {
          const cv = res.cv;
          setHeader({ headline: cv.headline ?? '', summary: cv.summary ?? '', phone: cv.phone ?? '', linkedin: cv.linkedin ?? '', github: cv.github ?? '', website: cv.website ?? '' });
          const secs: CVSection[] = (cv.sections ?? []).map((s: any) => ({
            id: s.id, section_type: s.section_type, title: s.title ?? '',
            subtitle: s.subtitle ?? '', location: s.location ?? '',
            start_date: s.start_date ?? '', end_date: s.end_date ?? '',
            description: s.description ?? '', order_index: s.order_index ?? 0,
          }));
          setSections(secs.sort((a, b) => a.order_index - b.order_index));
        }
      } catch { Alert.alert('Error', 'Failed to load CV.'); }
      finally { setLoading(false); }
    })();
  }, []);

  // â”€â”€ Debounced header save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveTimeoutRef = React.useRef<any>(null);
  const handleHeaderChange = (updated: CVHeader) => {
    setHeader(updated);
    setSaveStatus('saving');
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try { await api.cv.saveHeader(updated); setSaveStatus('saved'); }
      catch { setSaveStatus('error'); }
    }, 1500);
  };

  // â”€â”€ Add section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddSection = async (data: Omit<CVSection, 'id' | 'order_index'>) => {
    const res = await api.cv.addSection({ ...data, order_index: sections.length });
    const s = res.section;
    setSections(prev => [...prev, { id: s.id, section_type: s.section_type, title: s.title ?? '', subtitle: s.subtitle ?? '', location: s.location ?? '', start_date: s.start_date ?? '', end_date: s.end_date ?? '', description: s.description ?? '', order_index: s.order_index ?? prev.length }]);
  };

  // â”€â”€ Edit section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleEditSection = async (data: Omit<CVSection, 'id' | 'order_index'>) => {
    if (!modal.editing) return;
    const res = await api.cv.updateSection(modal.editing.id, data);
    const s = res.section;
    setSections(prev => prev.map(sec => sec.id === modal.editing!.id ? { ...sec, ...s, title: s.title ?? '', subtitle: s.subtitle ?? '', location: s.location ?? '', start_date: s.start_date ?? '', end_date: s.end_date ?? '', description: s.description ?? '' } : sec));
  };

  // â”€â”€ Delete section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDelete = (section: CVSection) => {
    Alert.alert('Delete Section', `Delete "${section.title || 'this section'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.cv.deleteSection(section.id);
          setSections(prev => prev.filter(s => s.id !== section.id));
        } catch { Alert.alert('Error', 'Failed to delete section.'); }
      }},
    ]);
  };

  // â”€â”€ Reorder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const moveSection = async (index: number, dir: 'up' | 'down') => {
    const newIdx = dir === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[newIdx]] = [reordered[newIdx], reordered[index]];
    const updated = reordered.map((s, i) => ({ ...s, order_index: i }));
    setSections(updated);
    await Promise.all(updated.map(s => api.cv.updateSection(s.id, { order_index: s.order_index }).catch(() => {})));
  };

  // â”€â”€ Open modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openAdd = (type: SectionType) => {
    setShowTypePicker(false);
    setModal({ visible: true, editing: null, type, title: '', subtitle: '', location: '', startDate: '', endDate: '', description: '' });
  };

  const openEdit = (section: CVSection) => {
    setModal({ visible: true, editing: section, type: section.section_type as SectionType, title: section.title, subtitle: section.subtitle ?? '', location: section.location ?? '', startDate: section.start_date ?? '', endDate: section.end_date ?? '', description: section.description ?? '' });
  };

  // â”€â”€ Export PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await api.cv.exportPDF();
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        if (response.status === 402) Alert.alert('Insufficient Points', `You need ${json.points_required ?? '?'} points to export your CV.`);
        else Alert.alert('Export Failed', json.error ?? 'Could not generate PDF.');
        return;
      }
      Alert.alert('PDF Ready', 'Your CV PDF has been generated. Check your downloads or share it from the browser.');
    } catch { Alert.alert('Error', 'PDF export failed. Please try again.'); }
    finally { setExporting(false); }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* â”€â”€ Nav bar â”€â”€ */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.navTitle, { color: C.text }]}>CV Builder</Text>
          {saveStatus !== 'idle' && (
            <Text style={{ fontSize: 10, color: STATUS_COLOR[saveStatus], textAlign: 'center' }}>{STATUS_TEXT[saveStatus]}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleExportPDF}
          disabled={exporting}
          style={[styles.exportBtn, { backgroundColor: C.primary }]}
        >
          {exporting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="download-outline" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* â”€â”€ Editor / Preview tab toggle â”€â”€ */}
      <View style={[styles.tabRow, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'editor' && styles.tabBtnActive]}
          onPress={() => setActiveTab('editor')}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={15} color={activeTab === 'editor' ? C.primary : C.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'editor' ? C.primary : C.textSecondary }]}>Editor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'preview' && styles.tabBtnActive]}
          onPress={() => setActiveTab('preview')}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={15} color={activeTab === 'preview' ? C.primary : C.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === 'preview' ? C.primary : C.textSecondary }]}>Preview</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {activeTab === 'editor' ? (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* â”€â”€ Personal Info â”€â”€ */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Personal Info &amp; Header</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Full Name</Text>
                  <View style={[styles.readOnly, { backgroundColor: C.gray100, borderColor: C.border }]}>
                    <Text style={{ fontSize: FontSize.sm, color: C.textSecondary }}>{user?.name || 'â€”'}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Email</Text>
                  <View style={[styles.readOnly, { backgroundColor: C.gray100, borderColor: C.border }]}>
                    <Text style={{ fontSize: FontSize.sm, color: C.textSecondary }} numberOfLines={1}>{user?.email || 'â€”'}</Text>
                  </View>
                </View>
              </View>
              <Field label="Professional Headline" value={header.headline} onChange={v => handleHeaderChange({ ...header, headline: v })} placeholder="e.g. CS Student | Seeking Software Internship" C={C} />
              <Field label="Professional Summary" value={header.summary} onChange={v => handleHeaderChange({ ...header, summary: v })} multiline placeholder="2â€“3 sentences about your background and goals." C={C} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Field label="Phone" value={header.phone} onChange={v => handleHeaderChange({ ...header, phone: v })} placeholder="+20 1XX XXX XXXX" C={C} /></View>
                <View style={{ flex: 1 }}><Field label="LinkedIn" value={header.linkedin} onChange={v => handleHeaderChange({ ...header, linkedin: v })} placeholder="linkedin.com/in/you" C={C} /></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Field label="GitHub" value={header.github} onChange={v => handleHeaderChange({ ...header, github: v })} placeholder="github.com/you" C={C} /></View>
                <View style={{ flex: 1 }}><Field label="Portfolio" value={header.website} onChange={v => handleHeaderChange({ ...header, website: v })} placeholder="yoursite.com" C={C} /></View>
              </View>
            </View>

            {/* â”€â”€ Sections â”€â”€ */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>CV Sections</Text>
                <TouchableOpacity onPress={() => setShowTypePicker(true)} style={[styles.addBtn, { backgroundColor: C.primary }]}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              {sections.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Ionicons name="document-text-outline" size={40} color={C.gray300} />
                  <Text style={{ marginTop: 10, fontSize: FontSize.base, color: C.textSecondary, textAlign: 'center' }}>No sections yet.{'\n'}Add Education, Experience, Skills and more.</Text>
                </View>
              ) : (
                sections.map((section, i) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onEdit={() => openEdit(section)}
                    onDelete={() => handleDelete(section)}
                    onMoveUp={() => moveSection(i, 'up')}
                    onMoveDown={() => moveSection(i, 'down')}
                    C={C}
                  />
                ))
              )}
            </View>

            {/* â”€â”€ ATS banner â”€â”€ */}
            <View style={[styles.atsBanner, { backgroundColor: '#2563eb12', borderColor: '#2563eb30' }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#2563eb" />
              <Text style={{ flex: 1, fontSize: FontSize.xs, color: '#2563eb', lineHeight: 16 }}>
                <Text style={{ fontWeight: '700' }}>ATS-compliant output:</Text> Standard headings Â· Single-column PDF Â· Machine-readable fonts
              </Text>
            </View>

            {/* â”€â”€ Export â”€â”€ */}
            <TouchableOpacity onPress={handleExportPDF} disabled={exporting} style={[styles.exportLarge, { backgroundColor: C.primary }]}>
              {exporting ? <ActivityIndicator color="#fff" /> : <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.exportLargeText}>Download PDF</Text>
              </>}
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* â”€â”€ Preview tab â”€â”€ */
          <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { marginBottom: 8 }]}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: C.text, marginBottom: 2 }}>{user?.name || 'â€”'}</Text>
              {header.headline ? <Text style={{ fontSize: FontSize.sm, color: C.primary, fontWeight: '700', marginBottom: 4 }}>{header.headline}</Text> : null}
              {header.summary ? <Text style={{ fontSize: FontSize.sm, color: C.textSecondary, lineHeight: 20, marginBottom: 8 }}>{header.summary}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {user?.email ? <Text style={{ fontSize: 11, color: C.textSecondary }}>{user.email}</Text> : null}
                {header.phone ? <Text style={{ fontSize: 11, color: C.textSecondary }}>Â· {header.phone}</Text> : null}
                {header.linkedin ? <Text style={{ fontSize: 11, color: '#2563eb' }}>Â· LinkedIn</Text> : null}
              </View>
            </View>

            {sections.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="document-text-outline" size={40} color={C.gray300} />
                <Text style={{ marginTop: 10, fontSize: FontSize.sm, color: C.textSecondary, textAlign: 'center' }}>No sections yet. Switch to Editor to add content.</Text>
              </View>
            ) : (
              sections.map(sec => {
                const cfg = SECTION_CONFIG[sec.section_type as SectionType];
                return (
                  <View key={sec.id} style={[styles.card, { marginBottom: 8, borderLeftWidth: 3, borderLeftColor: cfg?.color || C.primary }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Ionicons name={(cfg?.icon || 'document-outline') as any} size={14} color={cfg?.color || C.primary} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: cfg?.color || C.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cfg?.label || sec.section_type}</Text>
                    </View>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: C.text }}>{sec.title}</Text>
                    {sec.subtitle ? <Text style={{ fontSize: FontSize.xs, color: C.textSecondary, marginTop: 2 }}>{sec.subtitle}</Text> : null}
                    {(sec.start_date || sec.end_date) ? (
                      <Text style={{ fontSize: FontSize.xs, color: C.gray400, marginTop: 2 }}>
                        {sec.start_date}{sec.end_date ? ` â€“ ${sec.end_date}` : ''}
                      </Text>
                    ) : null}
                    {sec.description ? <Text style={{ fontSize: FontSize.sm, color: C.textSecondary, lineHeight: 20, marginTop: 6 }}>{sec.description}</Text> : null}
                  </View>
                );
              })
            )}

            <View style={[styles.atsBanner, { backgroundColor: '#2563eb12', borderColor: '#2563eb30' }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#2563eb" />
              <Text style={{ flex: 1, fontSize: FontSize.xs, color: '#2563eb', lineHeight: 16 }}>
                <Text style={{ fontWeight: '700' }}>ATS-compliant output: </Text>Standard headings · Single-column PDF · Machine-readable fonts
              </Text>
            </View>

            <TouchableOpacity onPress={handleExportPDF} disabled={exporting} style={[styles.exportLarge, { backgroundColor: C.primary }]}>
              {exporting ? <ActivityIndicator color="#fff" /> : <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.exportLargeText}>Download PDF</Text>
              </>}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modals */}
      <TypePickerModal visible={showTypePicker} onClose={() => setShowTypePicker(false)} onSelect={openAdd} C={C} />
      <SectionModal
        state={modal}
        onClose={() => setModal(m => ({ ...m, visible: false }))}
        onSave={modal.editing ? handleEditSection : handleAddSection}
        C={C}
      />
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useTheme>['C']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12, paddingHorizontal: Spacing.md,
    backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  navBtn: { padding: 6, width: 40 },
  navTitle: { fontSize: FontSize.md, fontWeight: '800', textAlign: 'center' },
  exportBtn: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: Spacing.md,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: C.primary },
  tabLabel: { fontSize: FontSize.sm, fontWeight: '700', color: C.textSecondary },
  scroll: { padding: Spacing.md, paddingBottom: 40 },
  card: { backgroundColor: C.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: C.border, ...Shadow.sm },
  cardTitle: { fontSize: FontSize.base, fontWeight: '800', color: C.text, marginBottom: 14 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  readOnly: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md },
  addBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  atsBanner: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md, alignItems: 'flex-start' },
  exportLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: Radius.lg, marginBottom: 8 },
  exportLargeText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});
