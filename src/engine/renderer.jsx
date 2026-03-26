/**
 * Slide Renderer - Maps schema objects to React components
 *
 * Each slide renders at a fixed 1920x1080 "virtual canvas" and is
 * scaled to fit its container via CSS transform. This ensures
 * consistent font sizes, spacing, and layout regardless of the
 * container's actual dimensions.
 */

import React, { useRef, useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { getTheme } from '../config/themes';

// ── Helpers ──────────────────────────────────────────────────────────

const SLIDE_W = 1920;
const SLIDE_H = 1080;

function getIcon(name, size = 32) {
  if (!name) return null;
  const Icon = Icons[name];
  return Icon ? <Icon size={size} /> : null;
}

/** Pick a font size class based on text length to prevent overflow */
function titleSize(text, base = 'text-7xl', shrink = 'text-5xl', tiny = 'text-4xl') {
  if (!text) return base;
  if (text.length > 60) return tiny;
  if (text.length > 35) return shrink;
  return base;
}

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
      <h1 className={`${titleSize(slide.title, 'text-8xl', 'text-6xl', 'text-5xl')} font-display font-black ${t.textOnPage} mb-6 leading-tight`}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p className={`text-3xl ${t.accentColor} font-bold tracking-wide uppercase`}>
          {slide.subtitle}
        </p>
      )}
      {slide.author && (
        <p className={`text-2xl ${t.textMuted} mt-8`}>{slide.author}</p>
      )}
      {slide.date && (
        <p className={`text-xl ${t.textMuted} mt-2`}>{slide.date}</p>
      )}
    </div>
  );
}

function ContentSlide({ slide, theme: t }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-6 mb-8 shrink-0">
        {slide.icon && (
          <div className={`p-4 rounded-2xl border ${t.cardBorder} ${t.cardBg} ${t.accentColor} ${t.accentGlow}`}>
            {getIcon(slide.icon, 44)}
          </div>
        )}
        <div>
          <h2 className={`${titleSize(slide.title, 'text-6xl', 'text-5xl', 'text-4xl')} font-black ${t.textOnPage} leading-tight`}>
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className={`text-2xl ${t.accentColor} font-bold tracking-wide uppercase mt-2`}>
              {slide.subtitle}
            </p>
          )}
        </div>
      </div>
      <ul className="space-y-5 ml-4 flex-1 min-h-0">
        {slide.points.map((p, i) => (
          <li key={i} className="flex items-start gap-5">
            <div className={`mt-3 w-3 h-3 rounded-full shrink-0 ${t.accentBg} shadow-[0_0_16px] ${t.accentGlow}`} />
            <span className={`text-3xl text-slate-200 font-medium leading-snug`}>{p}</span>
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
      <h2 className={`${titleSize(slide.title, 'text-6xl', 'text-5xl', 'text-4xl')} font-black ${t.textOnPage} mb-3 shrink-0`}>
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className={`text-2xl ${t.accentColor} font-bold tracking-wide uppercase mb-8 shrink-0`}>
          {slide.subtitle}
        </p>
      )}
      <div className={`grid ${COL_CLASSES[cols] || 'grid-cols-3'} gap-6 flex-1 min-h-0`}>
        {slide.items.map((item, i) => (
          <div key={i} className={`rounded-2xl p-7 border ${t.cardBorder} ${t.cardBg} flex flex-col`}>
            {item.icon && (
              <div className={`${t.accentColor} mb-4`}>{getIcon(item.icon, 32)}</div>
            )}
            <h3 className={`text-2xl font-bold ${t.textPrimary} mb-2`}>{item.title}</h3>
            {item.description && (
              <p className={`text-lg ${t.textSecondary} leading-relaxed`}>{item.description}</p>
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
        <h2 className={`text-5xl font-black ${t.textOnPage} mb-8`}>{slide.title}</h2>
      )}
      <img
        src={slide.src}
        alt={slide.caption || slide.title || ''}
        className={`max-h-[70%] rounded-2xl ${slide.fit === 'cover' ? 'object-cover w-full' : 'object-contain'}`}
      />
      {slide.caption && (
        <p className={`text-xl ${t.textMuted} mt-6`}>{slide.caption}</p>
      )}
    </div>
  );
}

function QuoteSlide({ slide, theme: t }) {
  const quoteSize = slide.quote && slide.quote.length > 120 ? 'text-3xl' : 'text-4xl';
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-16">
      <div className={`text-8xl ${t.accentColor} mb-4 leading-none`}>&ldquo;</div>
      <blockquote className={`${quoteSize} font-light ${t.textOnPage} leading-relaxed mb-10 max-w-4xl`}>
        {slide.quote}
      </blockquote>
      {slide.attribution && (
        <div>
          <p className={`text-2xl font-bold ${t.accentColor}`}>{slide.attribution}</p>
          {slide.role && (
            <p className={`text-xl ${t.textMuted} mt-1`}>{slide.role}</p>
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
        <h2 className={`${titleSize(slide.title, 'text-6xl', 'text-5xl', 'text-4xl')} font-black ${t.textOnPage} mb-3 shrink-0`}>
          {slide.title}
        </h2>
      )}
      {slide.subtitle && (
        <p className={`text-2xl ${t.accentColor} font-bold tracking-wide uppercase mb-10 shrink-0`}>
          {slide.subtitle}
        </p>
      )}
      <div className={`grid ${COL_CLASSES[metricCount] || 'grid-cols-3'} gap-8 flex-1 items-center`}>
        {slide.metrics.map((m, i) => (
          <div key={i} className={`rounded-2xl p-8 border ${t.cardBorder} ${t.cardBg} text-center`}>
            <div className={`text-6xl font-black mb-4 ${m.color || t.accentColor}`}>
              {m.value}
            </div>
            <div className={`text-lg ${t.textSecondary}`}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionSlide({ slide, theme: t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className={`w-24 h-1 ${t.accentBg} mb-10 rounded-full`} />
      <h2 className={`${titleSize(slide.title, 'text-8xl', 'text-6xl', 'text-5xl')} font-display font-black ${t.textOnPage} leading-tight`}>
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className={`text-3xl ${t.accentColor} font-bold mt-6`}>{slide.subtitle}</p>
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
};

/**
 * Render a single slide from its schema object
 */
export function renderSlide(slide, defaultTheme = 'rewst') {
  const Renderer = RENDERERS[slide.type];
  if (!Renderer) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-2xl">
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
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function updateScale() {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / SLIDE_W, height / SLIDE_H));
    }

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full ${theme.bg} bg-gradient-to-br ${theme.gradient} overflow-hidden relative`}>
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        className="p-16"
      >
        {children || renderSlide(slide, defaultTheme)}
      </div>
      {/* Overflow fade indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}

export { RENDERERS };
export default renderSlide;
