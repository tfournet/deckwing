/**
 * ChartSlide - Renders chart slides using Chart.js inside the 1920x1080 virtual canvas.
 *
 * Supports bar, line, pie, and doughnut chart types.
 * Colors are pulled from charts.json palette — never hardcoded.
 * All text uses Montserrat. Dark background with white labels.
 */

import { useMemo, useRef, useEffect } from 'react';
import { titleSize } from './slide-utils.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Legend,
  Tooltip,
  Title,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import chartConfig from '../config/design/charts.json';

// Register all Chart.js components we need
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Legend,
  Tooltip,
  Title,
);

// ── Helpers ──────────────────────────────────────────────────────────

const { palette, style } = chartConfig;

/** Resolve a palette key (e.g. "teal") to fill/fillLight hex values.
 *  Falls back to cycling through the palette order. */
function resolveColor(colorKey, index) {
  if (colorKey && palette.colors[colorKey]) {
    return palette.colors[colorKey];
  }
  const key = palette.order[index % palette.order.length];
  return palette.colors[key];
}

/** Chart.js component map */
const CHART_COMPONENTS = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
};

/** Whether this chart type uses axes (bar/line) vs. radial (pie/doughnut) */
function isAxesChart(chartType) {
  return chartType === 'bar' || chartType === 'line';
}

// ── Chart Data Builder ───────────────────────────────────────────────

function buildChartData(slide) {
  const { data, chartType } = slide;
  if (!data?.labels || !data?.datasets) return null;

  const datasets = data.datasets.map((ds, i) => {
    const color = resolveColor(ds.color, i);

    const base = {
      label: ds.label || `Series ${i + 1}`,
      data: ds.values || [],
    };

    if (chartType === 'bar') {
      return {
        ...base,
        backgroundColor: color.fill,
        borderColor: color.fill,
        borderWidth: 0,
        borderRadius: style.borderRadius,
        barPercentage: style.barPercentage,
      };
    }

    if (chartType === 'line') {
      return {
        ...base,
        borderColor: color.fill,
        backgroundColor: color.fillLight,
        borderWidth: style.lineWidth,
        pointBackgroundColor: color.fill,
        pointBorderColor: color.fill,
        pointRadius: style.pointRadius,
        pointHoverRadius: style.pointRadius + 2,
        fill: true,
        tension: 0.3,
      };
    }

    // pie / doughnut — each segment gets a different color
    const segmentColors = data.labels.map((_, segIdx) => resolveColor(null, segIdx));
    return {
      ...base,
      backgroundColor: segmentColors.map((c) => c.fill),
      borderColor: 'rgba(20, 17, 33, 0.6)',
      borderWidth: 2,
    };
  });

  return {
    labels: data.labels,
    datasets,
  };
}

// ── Chart Options Builder ────────────────────────────────────────────

function buildChartOptions(slide) {
  const { chartType, options = {} } = slide;
  const hasMultipleDatasets = (slide.data?.datasets?.length || 0) > 1;
  const showLegend = options.showLegend ?? hasMultipleDatasets;
  const showGrid = options.showGrid ?? isAxesChart(chartType);

  // Font sizes are scaled for the 1920x1080 virtual canvas.
  // Chart.js font sizes are in actual pixels inside the canvas element,
  // which is itself inside the scaled slide frame. We use larger sizes
  // than charts.json's base values to meet the 28px minimum requirement.
  const CANVAS_FONT_SIZE = {
    axisLabel: 28,
    tickLabel: 26,
    legend: 26,
    tooltip: 24,
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: showLegend,
        position: style.legendPosition,
        labels: {
          color: style.textColor,
          font: {
            family: style.fontFamily,
            size: CANVAS_FONT_SIZE.legend,
          },
          padding: 24,
          usePointStyle: false,
          boxWidth: 28,
          boxHeight: 14,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 17, 33, 0.95)',
        titleColor: style.textColor,
        bodyColor: style.textColor,
        borderColor: style.gridColor,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 16,
        titleFont: {
          family: style.fontFamily,
          size: CANVAS_FONT_SIZE.tooltip,
        },
        bodyFont: {
          family: style.fontFamily,
          size: CANVAS_FONT_SIZE.tooltip,
        },
      },
      title: {
        display: false, // We render the title ourselves for consistent styling
      },
    },
  };

  // Axes config for bar/line charts
  if (isAxesChart(chartType)) {
    baseOptions.scales = {
      x: {
        ticks: {
          color: style.textColor,
          font: {
            family: style.fontFamily,
            size: CANVAS_FONT_SIZE.tickLabel,
          },
          padding: 12,
        },
        grid: {
          display: showGrid,
          color: style.gridColor,
          lineWidth: 1,
        },
        border: {
          color: style.axisColor,
        },
      },
      y: {
        ticks: {
          color: style.textColor,
          font: {
            family: style.fontFamily,
            size: CANVAS_FONT_SIZE.tickLabel,
          },
          padding: 12,
        },
        grid: {
          display: showGrid,
          color: style.gridColor,
          lineWidth: 1,
        },
        border: {
          color: style.axisColor,
        },
      },
    };

    if (options.stacked) {
      baseOptions.scales.x.stacked = true;
      baseOptions.scales.y.stacked = true;
    }
  }

  // Pie/doughnut specific
  if (chartType === 'doughnut') {
    baseOptions.cutout = '55%';
  }

  return baseOptions;
}

// ── Empty / Error States ─────────────────────────────────────────────

function ChartEmpty({ theme: t }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div
        className={`border border-dashed ${t.cardBorder} rounded-2xl px-16 py-12 text-center`}
      >
        <p className={`text-[32px] ${t.textMuted}`}>No chart data provided</p>
        <p className={`text-[24px] ${t.textMuted} mt-3 opacity-60`}>
          Add labels and datasets to render a chart
        </p>
      </div>
    </div>
  );
}

function ChartError({ message, theme: t }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="border border-dashed border-alert-coral-400/40 rounded-2xl px-16 py-12 text-center">
        <p className="text-[32px] text-alert-coral-300">Chart data format error</p>
        <p className={`text-[24px] ${t.textMuted} mt-3`}>{message}</p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export function ChartSlide({ slide, theme: t }) {
  const chartRef = useRef(null);
  const chartType = slide.chartType || 'bar';
  const ChartComponent = CHART_COMPONENTS[chartType] || null;

  // Hooks MUST be called unconditionally, before any early returns
  const chartData = useMemo(() => {
    if (!slide.data?.labels?.length || !slide.data?.datasets?.length) return null;
    return buildChartData(slide);
  }, [slide]);
  const chartOptions = useMemo(() => buildChartOptions(slide), [slide]);

  // Now safe to do conditional returns
  if (!ChartComponent) {
    return (
      <div className="h-full flex flex-col">
        <ChartError
          message={`Unsupported chart type: "${chartType}"`}
          theme={t}
        />
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-full flex flex-col">
        {slide.title && (
          <div className="shrink-0 mb-6">
            <h2
              className={`${titleSize(slide.title)} font-display font-black ${t.textOnPage} leading-tight`}
            >
              {slide.title}
            </h2>
          </div>
        )}
        <ChartEmpty theme={t} />
      </div>
    );
  }

  if (!chartData.labels) {
    return (
      <div className="h-full flex flex-col">
        <ChartError message="Could not parse chart data" theme={t} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Title + subtitle header */}
      {(slide.title || slide.subtitle) && (
        <div className="shrink-0 mb-6">
          {slide.title && (
            <h2
              className={`${titleSize(slide.title)} font-display font-black ${t.textOnPage} leading-tight`}
            >
              {slide.title}
            </h2>
          )}
          {slide.subtitle && (
            <p
              className={`text-[28px] ${t.accentColor} font-bold tracking-wide mt-3`}
            >
              {slide.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart area — fills remaining ~70% of slide height */}
      <div className="flex-1 min-h-0 relative">
        <ChartComponent
          ref={chartRef}
          data={chartData}
          options={chartOptions}
        />
      </div>
    </div>
  );
}

export default ChartSlide;
