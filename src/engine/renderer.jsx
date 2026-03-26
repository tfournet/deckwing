/**
 * Slide Renderer - Maps schema objects to React components
 *
 * This is the bridge between the data model (slide schema) and
 * the visual output (React components). Each slide type gets its
 * own render function that receives the slide data and theme.
 */

import React from 'react';
import * as Icons from 'lucide-react';
import { getTheme } from '../config/themes';

/**
 * Resolve a Lucide icon by name string
 */
function getIcon(name, size = 32) {
  if (!name) return null;
  const Icon = Icons[name];
  return Icon ? <Icon size={size} /> : null;
}

/**
 * Title Slide - Hero with big text
 */
function TitleSlide({ slide, theme: t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
      <h1 className={`text-slide-h1 font-display font-black ${t.textOnPage} mb-6`}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p className={`text-slide-h3 ${t.accentColor} font-bold tracking-wide uppercase`}>
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

/**
 * Content Slide - Icon + heading + bullet points
 */
function ContentSlide({ slide, theme: t }) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-6 mb-10">
        {slide.icon && (
          <div className={`p-4 rounded-2xl border ${t.cardBorder} ${t.cardBg} ${t.accentColor} ${t.accentGlow}`}>
            {getIcon(slide.icon, 48)}
          </div>
        )}
        <div>
          <h2 className={`text-6xl md:text-8xl font-black ${t.textOnPage}`}>{slide.title}</h2>
          {slide.subtitle && (
            <p className={`text-2xl md:text-3xl ${t.accentColor} font-bold tracking-wide uppercase mt-2`}>
              {slide.subtitle}
            </p>
          )}
        </div>
      </div>
      <ul className="space-y-6 ml-4">
        {slide.points.map((p, i) => (
          <li key={i} className="flex items-start gap-6 group">
            <div className={`mt-4 w-4 h-4 rounded-full ${t.accentBg} shadow-[0_0_20px] ${t.accentGlow} group-hover:scale-150 transition-transform`} />
            <span className="text-3xl md:text-4xl text-slate-200 font-medium leading-relaxed">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Grid Slide - Multi-column card layout
 */
function GridSlide({ slide, theme: t }) {
  const cols = slide.columns || Math.min(slide.items.length, 3);
  const colClass = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className={`text-6xl md:text-7xl font-black ${t.textOnPage} mb-4`}>{slide.title}</h2>
      {slide.subtitle && (
        <p className={`text-2xl ${t.accentColor} font-bold tracking-wide uppercase mb-10`}>
          {slide.subtitle}
        </p>
      )}
      <div className={`grid ${colClass[cols] || 'grid-cols-3'} gap-8`}>
        {slide.items.map((item, i) => (
          <div key={i} className={`rounded-2xl p-8 border ${t.cardBorder} ${t.cardBg}`}>
            {item.icon && (
              <div className={`${t.accentColor} mb-4`}>{getIcon(item.icon, 36)}</div>
            )}
            <h3 className={`text-3xl font-bold ${t.textPrimary} mb-3`}>{item.title}</h3>
            {item.description && (
              <p className={`text-xl ${t.textSecondary} leading-relaxed`}>{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Image Slide - Full image with optional caption
 */
function ImageSlide({ slide, theme: t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500">
      {slide.title && (
        <h2 className={`text-5xl font-black ${t.textOnPage} mb-8`}>{slide.title}</h2>
      )}
      <img
        src={slide.src}
        alt={slide.caption || slide.title || ''}
        className={`max-h-[70vh] rounded-2xl ${slide.fit === 'cover' ? 'object-cover w-full' : 'object-contain'}`}
      />
      {slide.caption && (
        <p className={`text-xl ${t.textMuted} mt-6`}>{slide.caption}</p>
      )}
    </div>
  );
}

/**
 * Quote Slide - Large quote with attribution
 */
function QuoteSlide({ slide, theme: t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-16 animate-in fade-in duration-500">
      <div className={`text-8xl ${t.accentColor} mb-6`}>"</div>
      <blockquote className={`text-4xl md:text-5xl font-light ${t.textOnPage} leading-relaxed mb-10 max-w-4xl`}>
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

/**
 * Metric Slide - Stats/numbers display
 */
function MetricSlide({ slide, theme: t }) {
  return (
    <div className="animate-in fade-in duration-500">
      {slide.title && (
        <h2 className={`text-6xl md:text-7xl font-black ${t.textOnPage} mb-4`}>{slide.title}</h2>
      )}
      {slide.subtitle && (
        <p className={`text-2xl ${t.accentColor} font-bold tracking-wide uppercase mb-12`}>
          {slide.subtitle}
        </p>
      )}
      <div className={`grid grid-cols-${Math.min(slide.metrics.length, 4)} gap-8`}>
        {slide.metrics.map((m, i) => (
          <div key={i} className={`rounded-2xl p-8 border ${t.cardBorder} ${t.cardBg} text-center`}>
            <div className={`text-6xl md:text-7xl font-black mb-4 ${m.color || t.accentColor}`}>
              {m.value}
            </div>
            <div className={`text-xl ${t.textSecondary}`}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Section Slide - Divider between topics
 */
function SectionSlide({ slide, theme: t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
      <div className={`w-24 h-1 ${t.accentBg} mb-10 rounded-full`} />
      <h2 className={`text-slide-h1 font-display font-black ${t.textOnPage}`}>{slide.title}</h2>
      {slide.subtitle && (
        <p className={`text-slide-h3 ${t.accentColor} font-bold mt-6`}>{slide.subtitle}</p>
      )}
    </div>
  );
}

/**
 * Blank Slide - Empty canvas
 */
function BlankSlide() {
  return <div className="h-full" />;
}

/**
 * Registry mapping slide types to render components
 */
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
 *
 * @param {object} slide - Slide data from the deck schema
 * @param {string} [defaultTheme='rewst'] - Fallback theme name
 * @returns {React.ReactElement}
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
 * SlideFrame - Wraps a rendered slide with consistent chrome
 */
export function SlideFrame({ slide, defaultTheme = 'rewst', children }) {
  const theme = getTheme(slide.theme || defaultTheme);

  return (
    <div className={`w-full h-full ${theme.bg} bg-gradient-to-br ${theme.gradient} p-12 overflow-hidden`}>
      {children || renderSlide(slide, defaultTheme)}
    </div>
  );
}

export { RENDERERS };
export default renderSlide;
