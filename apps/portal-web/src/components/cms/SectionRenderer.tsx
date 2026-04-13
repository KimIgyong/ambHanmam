import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { CmsSection } from '@/lib/cms-api';

interface SectionRendererProps {
  sections: CmsSection[];
}

function useLocalizedContent(section: CmsSection): Record<string, any> {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  if (lang.startsWith('ko') && section.contentKo && Object.keys(section.contentKo).length > 0) {
    return section.contentKo;
  }
  return section.contentEn || {};
}

function HeroSection({ section }: { section: CmsSection }) {
  const content = useLocalizedContent(section);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-6xl">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-gray-600">
              {content.subtitle}
            </p>
          )}
          {content.ctaText && content.ctaLink && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to={content.ctaLink}
                className="btn-primary w-full sm:w-auto px-6 py-3 text-base flex items-center justify-center gap-2"
              >
                {content.ctaText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ section }: { section: CmsSection }) {
  const content = useLocalizedContent(section);
  const items: Array<{ title: string; description: string; icon?: string }> = content.items || [];

  if (items.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {content.title && (
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {content.title}
          </h2>
        )}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gray-200 p-6 sm:p-8 transition-all hover:border-primary-200 hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ section }: { section: CmsSection }) {
  const content = useLocalizedContent(section);
  return (
    <section className="bg-primary-600 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{content.title}</h2>
        {content.subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">{content.subtitle}</p>
        )}
        {content.buttonText && content.buttonLink && (
          <div className="mt-8">
            <Link
              to={content.buttonLink}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              {content.buttonText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function FAQSection({ section }: { section: CmsSection }) {
  const content = useLocalizedContent(section);
  const items: Array<{ question: string; answer: string }> = content.items || [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {content.title && (
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {content.title}
          </h2>
        )}
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-medium text-gray-900">{item.question}</span>
                {openIdx === idx ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {openIdx === idx && (
                <div className="border-t border-gray-200 px-6 py-4 text-gray-600">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SECTION_RENDERERS: Record<string, React.FC<{ section: CmsSection }>> = {
  HERO: HeroSection,
  FEATURES: FeaturesSection,
  CTA: CTASection,
  FAQ: FAQSection,
};

export function SectionRenderer({ sections }: SectionRendererProps) {
  return (
    <div>
      {sections.map((section) => {
        const Renderer = SECTION_RENDERERS[section.type];
        if (!Renderer) return null;
        return <Renderer key={section.id} section={section} />;
      })}
    </div>
  );
}
