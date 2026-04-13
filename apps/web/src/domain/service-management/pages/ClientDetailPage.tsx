import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Pencil, Trash2, Mail, Phone, Star } from 'lucide-react';
import { useClientDetail, useUpdateClient, useDeleteClient, useClientContacts, useCreateContact, useDeleteContact, useClientNotes, useCreateNote, useDeleteNote } from '../hooks/useClient';
import TranslationPanel from '@/domain/translations/components/TranslationPanel';
import { LocalDateTime } from '@/components/common/LocalDateTime';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['service', 'common']);
  const { data: client, isLoading } = useClientDetail(id!);
  const { data: contacts } = useClientContacts(id!);
  const { data: notes } = useClientNotes(id!);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'subscriptions' | 'notes'>('info');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', position: '', department: '', is_primary: false });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ type: 'GENERAL', title: '', content: '' });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-cyan-600" />
      </div>
    );
  }

  if (!client) return null;

  const handleSave = async () => {
    await updateClient.mutateAsync({ id: id!, data: form });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('common:confirmDelete'))) return;
    await deleteClient.mutateAsync(id!);
    navigate('/service/clients');
  };

  const handleCreateContact = async () => {
    if (!contactForm.name) return;
    await createContact.mutateAsync({ clientId: id!, data: contactForm });
    setShowContactForm(false);
    setContactForm({ name: '', email: '', phone: '', position: '', department: '', is_primary: false });
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm(t('common:confirmDelete'))) return;
    await deleteContact.mutateAsync({ clientId: id!, contactId });
  };

  const handleCreateNote = async () => {
    if (!noteForm.content) return;
    await createNote.mutateAsync({ clientId: id!, data: noteForm });
    setShowNoteForm(false);
    setNoteForm({ type: 'GENERAL', title: '', content: '' });
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm(t('common:confirmDelete'))) return;
    await deleteNote.mutateAsync({ clientId: id!, noteId });
  };

  const tabs = [
    { key: 'info' as const, label: t('service:client.basicInfo') },
    { key: 'contacts' as const, label: t('service:client.contacts') },
    { key: 'subscriptions' as const, label: t('service:client.subscriptions') },
    { key: 'notes' as const, label: t('service:client.notes') },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/service/clients')} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{client.companyName}</h1>
            <p className="text-sm text-gray-500">{client.code} · {t(`service:clientType.${client.type}`)}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            client.status === 'PROSPECT' ? 'bg-blue-100 text-blue-700' :
            client.status === 'CHURNED' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {t(`service:status.${client.status}`)}
          </span>
          <div className="flex gap-2">
            <button onClick={() => { setEditing(!editing); setForm({}); }} className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={handleDelete} className="rounded-md border border-red-200 p-1.5 text-red-500 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          editing ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <input placeholder={t('service:client.companyName')} defaultValue={client.companyName} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input placeholder={t('service:client.companyNameLocal')} defaultValue={client.companyNameLocal || ''} onChange={(e) => setForm({ ...form, company_name_local: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <select defaultValue={client.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                {['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED'].map((s) => (
                  <option key={s} value={s}>{t(`service:status.${s}`)}</option>
                ))}
              </select>
              <input placeholder={t('service:client.country')} defaultValue={client.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input placeholder={t('service:client.industry')} defaultValue={client.industry || ''} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input placeholder={t('service:client.website')} defaultValue={client.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <textarea placeholder={t('service:client.note')} defaultValue={client.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={3} />
              <div className="flex gap-2">
                <button onClick={handleSave} className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700">{t('common:save')}</button>
                <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600">{t('common:close')}</button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {client.companyNameLocal && <div className="col-span-2"><span className="text-gray-500">{t('service:client.companyNameLocal')}:</span> {client.companyNameLocal}</div>}
                <div><span className="text-gray-500">{t('service:client.type')}:</span> {t(`service:clientType.${client.type}`)}</div>
                <div><span className="text-gray-500">{t('service:client.country')}:</span> {client.country || '-'}</div>
                <div><span className="text-gray-500">{t('service:client.industry')}:</span> {client.industry || '-'}</div>
                <div><span className="text-gray-500">{t('service:client.companySize')}:</span> {client.companySize ? t(`service:companySize.${client.companySize}`) : '-'}</div>
                {client.taxId && <div><span className="text-gray-500">{t('service:client.taxId')}:</span> {client.taxId}</div>}
                {client.address && <div className="col-span-2"><span className="text-gray-500">{t('service:client.address')}:</span> {client.address}</div>}
                {client.website && <div className="col-span-2"><span className="text-gray-500">{t('service:client.website')}:</span> <a href={client.website} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline">{client.website}</a></div>}
                {client.source && <div><span className="text-gray-500">{t('service:client.source')}:</span> {client.source}</div>}
                {client.accountManagerName && <div><span className="text-gray-500">{t('service:client.accountManager')}:</span> {client.accountManagerName}</div>}
                {client.note && <div className="col-span-2"><span className="text-gray-500">{t('service:client.note')}:</span> {client.note}</div>}
              </div>
            </div>
          )
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setShowContactForm(true)} className="flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700">
                <Plus className="h-3.5 w-3.5" />
                {t('service:contact.add')}
              </button>
            </div>
            {contacts && contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.contactId} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      {contact.isPrimary && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                      <div>
                        <div className="font-medium text-gray-900">
                          {contact.name}
                          {contact.position && <span className="text-xs text-gray-400 ml-1">({contact.position})</span>}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                          {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>}
                          {contact.department && <span>{contact.department}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteContact(contact.contactId)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4">{t('service:client.noClients')}</p>
            )}
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div>
            {client.subscriptions && client.subscriptions.length > 0 ? (
              <div className="space-y-2">
                {client.subscriptions.map((sub) => (
                  <div key={sub.subscriptionId} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{sub.serviceName}</div>
                      <div className="text-sm text-gray-500">
                        {sub.planName && `${sub.planName} · `}
                        {sub.price != null && sub.price > 0 ? `${sub.currency} ${sub.price.toLocaleString()}` : 'Free'}
                        {sub.endDate && ` · ${t('service:subscription.endDate')}: ${<LocalDateTime value={sub.endDate} format='YYYY-MM-DD HH:mm' />}`}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      sub.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
                      sub.status === 'SUSPENDED' ? 'bg-amber-100 text-amber-700' :
                      sub.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t(`service:status.${sub.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4">{t('service:subscription.noSubscriptions')}</p>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setShowNoteForm(true)} className="flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700">
                <Plus className="h-3.5 w-3.5" />
                {t('service:note.add')}
              </button>
            </div>
            {notes && notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.noteId} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t(`service:noteType.${note.type}`)}</span>
                        {note.title && <span className="font-medium text-gray-900 text-sm">{note.title}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{note.authorName} · {<LocalDateTime value={note.createdAt} format='YYYY-MM-DD HH:mm' />}</span>
                        <button onClick={() => handleDeleteNote(note.noteId)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4">{t('service:client.noClients')}</p>
            )}
          </div>
        )}

        {/* Contact create modal */}
        {showContactForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('service:contact.add')}</h2>
              <div className="space-y-3">
                <input placeholder={t('service:contact.name')} value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder={t('service:contact.email')} type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder={t('service:contact.phone')} value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder={t('service:contact.position')} value={contactForm.position} onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder={t('service:contact.department')} value={contactForm.department} onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={contactForm.is_primary} onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })} className="rounded border-gray-300" />
                  {t('service:contact.primary')}
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowContactForm(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">{t('common:close')}</button>
                <button onClick={handleCreateContact} className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700">{t('common:save')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Note create modal */}
        {showNoteForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('service:note.add')}</h2>
              <div className="space-y-3">
                <select value={noteForm.type} onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  {['GENERAL', 'MEETING', 'ISSUE', 'FEEDBACK', 'CALL'].map((tp) => (
                    <option key={tp} value={tp}>{t(`service:noteType.${tp}`)}</option>
                  ))}
                </select>
                <input placeholder={t('service:note.title')} value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <textarea placeholder={t('service:note.content')} value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={4} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowNoteForm(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">{t('common:close')}</button>
                <button onClick={handleCreateNote} className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700">{t('common:save')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Translation Panel */}
        {client && (
          <div className="mt-6 border-t pt-4">
            <TranslationPanel
              sourceType="CLIENT"
              sourceId={client.clientId}
              sourceFields={['title', 'content']}
              originalLang={client.originalLang || 'ko'}
              originalContent={{ title: client.companyName || '', content: client.note || '' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
