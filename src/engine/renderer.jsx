/**
 * Slide Renderer - Maps schema objects to React components
 *
 * Each slide renders at a fixed 1920x1080 "virtual canvas" and is
 * scaled to fit its container via CSS transform. This ensures
 * consistent font sizes, spacing, and layout regardless of the
 * container's actual dimensions.
 */

import { useRef, useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { getTheme } from '../config/themes';
import { getBlockThemeVars } from './block-theme.js';
import { LayoutSlide } from './blocks/LayoutSlide.jsx';
import logoConfig from '../config/design/images.json';
import { ChartSlide } from './ChartSlide.jsx';

// ── Helpers ──────────────────────────────────────────────────────────

const SLIDE_W = 1920;
const SLIDE_H = 1080;

function getIcon(name, size = 32) {
  if (!name) return null;
  const Icon = Icons[name];
  return Icon ? <Icon size={size} /> : null;
}

import { titleSize } from './slide-utils.js';

const COL_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

// ── Slide Type Renderers ─────────────────────────────────────────────

function TitleSlide({ slide, theme: t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className={`${titleSize(slide.title, 'text-[96px]', 'text-[72px]', 'text-[56px]')} font-display font-black ${t.textOnPage} mb-8 leading-tight`}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p className={`text-[36px] ${t.accentColor} font-bold tracking-wide`}>
          {slide.subtitle}
        </p>
      )}
      {slide.author && (
        <p className={`text-[28px] ${t.textMuted} mt-10`}>{slide.author}</p>
      )}
      {slide.date && (
        <p className={`text-[28px] ${t.textMuted} mt-3`}>{slide.date}</p>
      )}
    </div>
  );
}

function ContentSlide({ slide, theme: t }) {
  const pointSize = slide.points && slide.points.length > 4 ? 'text-[32px]' : 'text-[36px]';
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-8 mb-10 shrink-0">
        {slide.icon && (
          <div className={`p-5 rounded-2xl border ${t.cardBorder} ${t.cardBg} ${t.accentColor} ${t.accentGlow}`}>
            {getIcon(slide.icon, 56)}
          </div>
        )}
        <div>
          <h2 className={`${titleSize(slide.title)} font-display font-black ${t.textOnPage} leading-tight`}>
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className={`text-[28px] ${t.accentColor} font-bold tracking-wide mt-3`}>
              {slide.subtitle}
            </p>
          )}
        </div>
      </div>
      <ul className="space-y-6 ml-4 flex-1 min-h-0">
        {slide.points.map((p, i) => (
          <li key={i} className="flex items-start gap-6">
            <div className={`mt-4 w-4 h-4 rounded-full shrink-0 ${t.accentBg} shadow-[0_0_20px] ${t.accentGlow}`} />
            <span className={`${pointSize} ${t.textSecondary} font-medium leading-snug`}>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GridSlide({ slide, theme: t }) {
  const cols = slide.columns || Math.min(slide.items.length, 3);

  return (
    <div className="h-full flex flex-col">
      <h2 className={`${titleSize(slide.title)} font-display font-black ${t.textOnPage} mb-3 shrink-0`}>
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className={`text-[28px] ${t.accentColor} font-bold tracking-wide mb-10 shrink-0`}>
          {slide.subtitle}
        </p>
      )}
      <div className={`grid ${COL_CLASSES[cols] || 'grid-cols-3'} gap-8 items-start`}>
        {slide.items.map((item, i) => (
          <div key={i} className={`rounded-2xl p-8 border ${t.cardBorder} ${t.cardBg} flex flex-col`}>
            {item.icon && (
              <div className={`${t.accentColor} mb-5`}>{getIcon(item.icon, 40)}</div>
            )}
            <h3 className={`text-[32px] font-display font-bold ${t.textPrimary} mb-3`}>{item.title}</h3>
            {item.description && (
              <p className={`text-[28px] ${t.textSecondary} leading-relaxed`}>{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageSlide({ slide, theme: t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {slide.title && (
        <h2 className={`${titleSize(slide.title)} font-display font-black ${t.textOnPage} mb-8`}>{slide.title}</h2>
      )}
      <img
        src={slide.src}
        alt={slide.caption || slide.title || ''}
        className={`max-h-[70%] rounded-2xl ${slide.fit === 'cover' ? 'object-cover w-full' : 'object-contain'}`}
      />
      {slide.caption && (
        <p className={`text-[28px] ${t.textMuted} mt-6`}>{slide.caption}</p>
      )}
    </div>
  );
}

function QuoteSlide({ slide, theme: t }) {
  const quoteSize = slide.quote && slide.quote.length > 120 ? 'text-[36px]' : 'text-[44px]';
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-20">
      <div className={`text-[120px] ${t.accentColor} mb-8 leading-none`}>&ldquo;</div>
      <blockquote className={`${quoteSize} font-normal ${t.textOnPage} leading-relaxed mb-12 max-w-[1400px]`}>
        {slide.quote}
      </blockquote>
      {slide.attribution && (
        <div>
          <p className={`text-[30px] font-bold ${t.accentColor}`}>{slide.attribution}</p>
          {slide.role && (
            <p className={`text-[28px] ${t.textMuted} mt-2`}>{slide.role}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricSlide({ slide, theme: t }) {
  const metricCount = Math.min(slide.metrics.length, 4);

  return (
    <div className="h-full flex flex-col">
      {slide.title && (
        <h2 className={`${titleSize(slide.title)} font-display font-black ${t.textOnPage} mb-3 shrink-0`}>
          {slide.title}
        </h2>
      )}
      {slide.subtitle && (
        <p className={`text-[28px] ${t.accentColor} font-bold tracking-wide mb-10 shrink-0`}>
          {slide.subtitle}
        </p>
      )}
      <div className={`grid ${COL_CLASSES[metricCount] || 'grid-cols-3'} gap-10 flex-1 items-center`}>
        {slide.metrics.map((m, i) => (
          <div key={i} className={`rounded-2xl p-10 border ${t.cardBorder} ${t.cardBg} text-center`}>
            <div className={`text-[72px] font-black mb-4 ${m.color || t.accentColor}`}>
              {m.value}
            </div>
            <div className={`text-[28px] ${t.textSecondary}`}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionSlide({ slide, theme: t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className={`w-32 h-1.5 ${t.accentBg} mb-12 rounded-full`} />
      <h2 className={`${titleSize(slide.title, 'text-[96px]', 'text-[72px]', 'text-[56px]')} font-display font-black ${t.textOnPage} leading-tight`}>
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className={`text-[36px] ${t.accentColor} font-bold tracking-wide mt-8`}>{slide.subtitle}</p>
      )}
    </div>
  );
}

function BlankSlide() {
  return <div className="h-full" />;
}

// ── Registry ─────────────────────────────────────────────────────────

const RENDERERS = {
  title: TitleSlide,
  content: ContentSlide,
  grid: GridSlide,
  image: ImageSlide,
  quote: QuoteSlide,
  metric: MetricSlide,
  section: SectionSlide,
  blank: BlankSlide,
  layout: LayoutSlide,
  chart: ChartSlide,
};

/**
 * Render a single slide from its schema object
 */
export function renderSlide(slide, defaultTheme = 'rewst') {
  const Renderer = RENDERERS[slide.type];
  if (!Renderer) {
    return (
      <div className="flex items-center justify-center h-full text-[32px]" style={{ color: '#F15B5B' }}>
        Unknown slide type: {slide.type}
      </div>
    );
  }

  const theme = getTheme(slide.theme || defaultTheme);
  return <Renderer slide={slide} theme={theme} />;
}

/**
 * SlideFrame - Renders a slide at a fixed 1920x1080 virtual canvas
 * and scales it to fit its container proportionally.
 *
 * This is how real presentation tools work — content is authored at
 * a reference resolution and scaled to whatever viewport displays it.
 */
export function SlideFrame({ slide, defaultTheme = 'rewst', children }) {
  const theme = getTheme(slide.theme || defaultTheme);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0);
  const blockVars = slide.type === 'layout'
    ? getBlockThemeVars(slide.theme || defaultTheme, slide.customColors)
    : {};

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function updateScale() {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / SLIDE_W, height / SLIDE_H));
    }

    // In production builds (Electron), layout may not be resolved when the
    // effect first runs because the CSS file is still being parsed.  Call
    // updateScale eagerly, but also schedule a retry so we don't stay at
    // scale-0 if the first call bails due to zero dimensions.
    updateScale();
    const retryId = requestAnimationFrame(() => {
      updateScale();
    });

    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(retryId);
      observer.disconnect();
    };
  }, []);

  // Logo defaults: title/section slides get none, everything else gets bottom-right
  const logoDefault = (slide.type === 'title' || slide.type === 'section') ? 'none' : 'bottom-right';
  const logoPosition = slide.logo || logoDefault;

  const offset = logoConfig.logoSettings.edgeOffset || '16px';
  const logoPositionStyle = {
    'top-left': { top: offset, left: offset },
    'top-right': { top: offset, right: offset },
    'bottom-left': { bottom: offset, left: offset },
    'bottom-right': { bottom: offset, right: offset },
  }[logoPosition];

  // Merge block-theme CSS vars with an inline fallback background.
  // The Tailwind class (theme.bg) is the primary source of truth, but
  // in Electron production builds a CSS-load race can leave the utility
  // class momentarily un-styled.  The inline backgroundColor guarantees
  // the dark backdrop is visible even before Tailwind's stylesheet is
  // parsed — the utility class wins as soon as it loads because it sets
  // --tw-bg-opacity which changes the computed value.
  const containerStyle = {
    ...blockVars,
    backgroundColor: theme.hex.bg,
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${theme.bg} bg-gradient-to-br ${theme.gradient} overflow-hidden relative`}
      style={containerStyle}
    >
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          color: theme.hex.text,
        }}
        className="p-16 relative"
      >
        {children || renderSlide(slide, defaultTheme)}
      </div>
      {/* Logo overlay — positioned relative to the slide frame, not the padded content */}
      {logoPosition !== 'none' && logoPositionStyle && (
        <img
          src={logoConfig.logos[logoConfig.logoSettings.defaultLogo] || '/images/rewst-logo.png'}
          alt=""
          style={{
            ...logoPositionStyle,
            height: logoConfig.logoSettings.height || '80px',
            opacity: logoConfig.logoSettings.opacity || 0.7,
            transform: `scale(${scale})`,
            transformOrigin: logoPosition.replace('-', ' '),
          }}
          className="absolute"
        />
      )}
      {/* Overflow fade indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}

export { RENDERERS };
export default renderSlide;
