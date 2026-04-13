import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Image as ImageIcon } from 'lucide-react';

interface PageMetaFormProps {
  page: {
    id: string;
    title: string | null;
    description: string | null;
    ogImage: string | null;
    seoKeywords: string[];
  };
  onSave: (data: { title?: string; description?: string; og_image?: string; seo_keywords?: string[] }) => void;
  isSaving?: boolean;
}

export default function PageMetaForm({ page, onSave, isSaving }: PageMetaFormProps) {
  const { t } = useTranslation(['site', 'common']);

  const [title, setTitle] = useState(page.title ?? '');
  const [description, setDescription] = useState(page.description ?? '');
  const [ogImage, setOgImage] = useState(page.ogImage ?? '');
  const [keywords, setKeywords] = useState<string[]>(page.seoKeywords ?? []);
  const [keywordInput, setKeywordInput] = useState('');

  // Sync when page prop changes (e.g. after save or page switch)
  useEffect(() => {
    setTitle(page.title ?? '');
    setDescription(page.description ?? '');
    setOgImage(page.ogImage ?? '');
    setKeywords(page.seoKeywords ?? []);
    setKeywordInput('');
  }, [page.id, page.title, page.description, page.ogImage, page.seoKeywords]);

  const handleKeywordKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = keywordInput.trim();
        if (value && !keywords.includes(value)) {
          setKeywords((prev) => [...prev, value]);
        }
        setKeywordInput('');
      }
    },
    [keywordInput, keywords],
  );

  const removeKeyword = useCallback((keyword: string) => {
    setKeywords((prev) => prev.filter((k) => k !== keyword));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      og_image: ogImage.trim() || undefined,
      seo_keywords: keywords,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* SEO Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('site:page.seoTitle')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {title.length} / 60
        </p>
      </div>

      {/* SEO Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('site:page.seoDescription')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={160}
          rows={3}
          className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {description.length} / 160
        </p>
      </div>

      {/* OG Image */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('site:page.ogImage')}
        </label>
        <input
          type="text"
          value={ogImage}
          onChange={(e) => setOgImage(e.target.value)}
          placeholder="https://example.com/image.png"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {ogImage.trim() && (
          <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
            <img
              src={ogImage}
              alt="OG Preview"
              className="h-40 w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex h-40 items-center justify-center bg-gray-50 text-gray-400">
              <ImageIcon className="mr-2 h-5 w-5" />
              <span className="text-sm">Invalid image URL</span>
            </div>
          </div>
        )}
      </div>

      {/* SEO Keywords */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('site:page.seoKeywords')}
        </label>
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="ml-0.5 text-indigo-400 hover:text-indigo-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
            placeholder={keywords.length === 0 ? 'Type and press Enter' : ''}
            className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end border-t border-gray-200 pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? '...' : t('common:save')}
        </button>
      </div>
    </form>
  );
}
