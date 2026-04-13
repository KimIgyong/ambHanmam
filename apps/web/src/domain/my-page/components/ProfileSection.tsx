import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Building2, Shield, Calendar, Phone, Pencil, Check, X, Camera, Trash2 } from 'lucide-react';
import { MyProfileResponse } from '@amb/types';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import { useUpdateProfile, useUploadProfileImage, useDeleteProfileImage } from '../hooks/useMyPage';

interface Props {
  profile: MyProfileResponse;
}

export default function ProfileSection({ profile }: Props) {
  const { t } = useTranslation(['myPage']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile.name ?? '');
  const [nameError, setNameError] = useState('');

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(profile.phone ?? '');
  const [phoneError, setPhoneError] = useState('');

  const [editingCompanyEmail, setEditingCompanyEmail] = useState(false);
  const [companyEmailValue, setCompanyEmailValue] = useState(profile.companyEmail ?? '');
  const [companyEmailError, setCompanyEmailError] = useState('');

  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadProfileImage();
  const deleteImage = useDeleteProfileImage();

  const handleSaveName = () => {
    setNameError('');
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameError(t('myPage:profile.namePlaceholder'));
      return;
    }
    updateProfile.mutate(
      { name: trimmed },
      {
        onSuccess: () => setEditingName(false),
        onError: () => setNameError(t('myPage:profile.updateFailed')),
      },
    );
  };

  const handleCancelName = () => {
    setNameValue(profile.name ?? '');
    setNameError('');
    setEditingName(false);
  };

  const handleSavePhone = () => {
    setPhoneError('');
    updateProfile.mutate(
      { phone: phoneValue.trim() || null },
      {
        onSuccess: () => setEditingPhone(false),
        onError: () => setPhoneError(t('myPage:profile.updateFailed')),
      },
    );
  };

  const handleCancelPhone = () => {
    setPhoneValue(profile.phone ?? '');
    setPhoneError('');
    setEditingPhone(false);
  };

  const handleSaveCompanyEmail = () => {
    setCompanyEmailError('');
    const trimmed = companyEmailValue.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setCompanyEmailError(t('myPage:profile.companyEmailPlaceholder'));
      return;
    }
    updateProfile.mutate(
      { company_email: trimmed || null },
      {
        onSuccess: () => setEditingCompanyEmail(false),
        onError: () => setCompanyEmailError(t('myPage:profile.updateFailed')),
      },
    );
  };

  const handleCancelCompanyEmail = () => {
    setCompanyEmailValue(profile.companyEmail ?? '');
    setCompanyEmailError('');
    setEditingCompanyEmail(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert(t('myPage:profile.imageFormatError'));
      return;
    }
    if (file.size > 500 * 1024) {
      alert(t('myPage:profile.imageSizeError'));
      return;
    }
    uploadImage.mutate(file);
    e.target.value = '';
  };

  const handleDeleteImage = () => {
    if (!confirm(t('myPage:profile.deleteImage') + '?')) return;
    deleteImage.mutate();
  };

  const initials = profile.name
    ? profile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('myPage:profile.title')}</h2>

      <div className="flex gap-6">
        {/* Left: Profile Image */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="relative">
            {profile.profileImageUrl ? (
              <img
                src={`${profile.profileImageUrl}?t=${Date.now()}`}
                alt={profile.name}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-200"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 ring-2 ring-gray-200">
                <span className="text-2xl font-semibold text-blue-600">{initials}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImage.isPending}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-white shadow hover:bg-gray-900 disabled:opacity-50"
              title={t('myPage:profile.uploadImage')}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImage.isPending}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {t('myPage:profile.uploadImage')}
            </button>
            {profile.profileImageUrl && (
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={deleteImage.isPending}
                className="flex items-center gap-0.5 text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                {t('myPage:profile.deleteImage')}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Right: Info Grid */}
        <div className="flex-1 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {/* Row 1: 이름 (편집 가능) */}
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">{t('myPage:profile.name')}</p>
              {editingName ? (
                <div className="mt-0.5">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder={t('myPage:profile.namePlaceholder')}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') handleCancelName();
                    }}
                    autoFocus
                  />
                  {nameError && <p className="mt-0.5 text-xs text-red-500">{nameError}</p>}
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={handleSaveName} disabled={updateProfile.isPending} className="flex items-center text-xs text-blue-600 hover:underline disabled:opacity-50"><Check className="h-3 w-3" /></button>
                    <button type="button" onClick={handleCancelName} className="flex items-center text-xs text-gray-500 hover:underline"><X className="h-3 w-3" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-900">{profile.name}</p>
                  <button type="button" onClick={() => { setNameValue(profile.name ?? ''); setEditingName(true); }} className="ml-1 text-gray-400 hover:text-gray-700" title={t('myPage:profile.editName')}><Pencil className="h-3 w-3" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Row 1: 이메일 (읽기전용) */}
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500">{t('myPage:profile.email')}</p>
              <p className="text-sm text-gray-900">{profile.email}</p>
            </div>
          </div>

          {/* Row 2: Unit/부서 (읽기전용) */}
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500">{t('myPage:profile.unit')}</p>
              <p className="text-sm text-gray-900">{profile.unit || t('myPage:profile.notSet')}</p>
            </div>
          </div>

          {/* Row 2: 역할 (읽기전용) */}
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500">{t('myPage:profile.role')}</p>
              <p className="text-sm text-gray-900">{t(`myPage:roles.${profile.role}`)}</p>
            </div>
          </div>

          {/* Row 3: 회사이메일 (편집 가능) */}
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">{t('myPage:profile.companyEmail')}</p>
              {editingCompanyEmail ? (
                <div className="mt-0.5">
                  <input
                    type="email"
                    value={companyEmailValue}
                    onChange={(e) => setCompanyEmailValue(e.target.value)}
                    placeholder={t('myPage:profile.companyEmailPlaceholder')}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCompanyEmail();
                      if (e.key === 'Escape') handleCancelCompanyEmail();
                    }}
                    autoFocus
                  />
                  {companyEmailError && <p className="mt-0.5 text-xs text-red-500">{companyEmailError}</p>}
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={handleSaveCompanyEmail} disabled={updateProfile.isPending} className="flex items-center text-xs text-blue-600 hover:underline disabled:opacity-50"><Check className="h-3 w-3" /></button>
                    <button type="button" onClick={handleCancelCompanyEmail} className="flex items-center text-xs text-gray-500 hover:underline"><X className="h-3 w-3" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-900">{profile.companyEmail || t('myPage:profile.notSet')}</p>
                  <button type="button" onClick={() => { setCompanyEmailValue(profile.companyEmail ?? ''); setEditingCompanyEmail(true); }} className="ml-1 text-gray-400 hover:text-gray-700" title={t('myPage:profile.editCompanyEmail')}><Pencil className="h-3 w-3" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: 가입일 (읽기전용) */}
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500">{t('myPage:profile.joinedAt')}</p>
              <p className="text-sm text-gray-900"><LocalDateTime value={profile.createdAt} format='YYYY-MM-DD' /></p>
            </div>
          </div>

          {/* Row 4: 비상연락처 (편집 가능) */}
          <div className="flex items-start gap-3 sm:col-span-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500">{t('myPage:profile.phone')}</p>
              {editingPhone ? (
                <div className="mt-0.5">
                  <input
                    type="tel"
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    placeholder={t('myPage:profile.phonePlaceholder')}
                    className="w-full max-w-xs rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePhone();
                      if (e.key === 'Escape') handleCancelPhone();
                    }}
                    autoFocus
                  />
                  {phoneError && <p className="mt-0.5 text-xs text-red-500">{phoneError}</p>}
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={handleSavePhone} disabled={updateProfile.isPending} className="flex items-center text-xs text-blue-600 hover:underline disabled:opacity-50"><Check className="h-3 w-3" /></button>
                    <button type="button" onClick={handleCancelPhone} className="flex items-center text-xs text-gray-500 hover:underline"><X className="h-3 w-3" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-900">{profile.phone || t('myPage:profile.notSet')}</p>
                  <button type="button" onClick={() => { setPhoneValue(profile.phone ?? ''); setEditingPhone(true); }} className="ml-1 text-gray-400 hover:text-gray-700" title={t('myPage:profile.editPhone')}><Pencil className="h-3 w-3" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
