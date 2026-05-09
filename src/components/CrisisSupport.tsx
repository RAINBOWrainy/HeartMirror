'use client';

import { useEffect } from 'react';
import { useLocale } from '@/lib/i18n/LocaleContext';

interface CrisisSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  severity?: string;
  locale?: 'zh' | 'en';
}

export function CrisisSupportModal({ isOpen, onClose, severity = 'moderate' }: CrisisSupportModalProps) {
  const currentLocale = useLocale();
  const l = currentLocale.locale;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🆘</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            {l === 'zh' ? '我听到了你' : 'I hear you'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {l === 'zh'
              ? '你现在经历的事情很痛苦，我想确保你能够得到支持。'
              : 'What you are going through sounds really painful, and I want to make sure you have support.'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* US Hotline */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🇺🇸</span>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                  {l === 'zh' ? '美国 - 自杀与危机生命线' : 'US - Suicide & Crisis Lifeline'}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>988</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {l === 'zh' ? '24小时 / 可发短信' : '24 hours / text available'}
            </p>
          </div>

          {/* China Hotline */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🇨🇳</span>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                  {l === 'zh' ? '中国 - 全国心理援助热线' : 'China - National Mental Health Helpline'}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>400-161-9995</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {l === 'zh' ? '24小时' : '24 hours'}
            </p>
          </div>

          {/* Beijing Hai Dian Rui Kang */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏥</span>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                  {l === 'zh' ? '北京海淀区精神卫生中心' : 'Beijing Haidian Mental Health Center'}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>010-62304612</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {l === 'zh' ? '24小时精神科急诊' : '24h Psychiatric Emergency'}
            </p>
          </div>

          {/* International */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🌍</span>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                  {l === 'zh' ? '国际 - 寻找当地热线' : 'International - Find Local Helpline'}
                </p>
                <a
                  href="https://findahelpline.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold underline"
                  style={{ color: 'var(--accent)' }}
                >
                  findahelpline.com →
                </a>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {l === 'zh' ? '全球精神健康支持热线目录' : 'Global mental health helpline directory'}
            </p>
          </div>
        </div>

        <div className="text-center p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {l === 'zh'
              ? '如果你身边有信任的人，我鼓励你现在联系他们'
              : 'If you have someone you trust nearby, I encourage you to reach out to them now'}
          </p>
          <p className="text-sm font-medium mt-2" style={{ color: 'var(--accent)' }}>
            {l === 'zh' ? '你并不孤单，寻求帮助是勇敢的表现' : 'You are not alone, and reaching out is a sign of strength.'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg text-white font-medium"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {l === 'zh' ? '我知道了' : 'I understand'}
        </button>
      </div>
    </div>
  );
}

interface CrisisBannerProps {
  locale?: 'zh' | 'en';
}

export function CrisisBanner({ locale = 'zh' }: CrisisBannerProps) {
  return (
    <div
      className="p-3 text-center text-xs"
      style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      <span style={{ color: 'var(--muted)' }}>
        {locale === 'zh' ? '需要紧急帮助？' : 'Need urgent help?'}
      </span>{' '}
      <a href="tel:988" className="font-medium" style={{ color: 'var(--accent)' }}>
        988
      </a>
      <span style={{ color: 'var(--muted)' }}>
        {locale === 'zh' ? ' (全国) | ' : ' (US) | '}
      </span>
      <a href="tel:400-161-9995" className="font-medium" style={{ color: 'var(--accent)' }}>
        400-161-9995
      </a>
    </div>
  );
}