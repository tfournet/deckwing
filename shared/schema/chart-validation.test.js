import { describe, it, expect } from 'vitest';
import { createSlide, validateSlide } from './slide-schema.js';

describe('Chart slide type', () => {

  it('createSlide accepts chart type', () => {
    const slide = createSlide('chart', {
      chartType: 'bar',
      data: { labels: ['A', 'B'], datasets: [{ label: 'X', values: [1, 2] }] },
    });
    expect(slide.type).toBe('chart');
    expect(slide.chartType).toBe('bar');
  });

  it('validates a correct bar chart', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ label: 'Sales', values: [100, 200, 300] }],
      },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validates a correct line chart', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'line',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          { label: 'Revenue', values: [10, 20, 30, 40] },
          { label: 'Cost', values: [8, 15, 22, 28] },
        ],
      },
    });
    expect(result.valid).toBe(true);
  });

  it('validates a correct pie chart', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'pie',
      data: {
        labels: ['Automated', 'Manual', 'Pending'],
        datasets: [{ label: 'Tickets', values: [65, 25, 10] }],
      },
    });
    expect(result.valid).toBe(true);
  });

  it('validates a correct doughnut chart', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'doughnut',
      data: {
        labels: ['Resolved', 'Open'],
        datasets: [{ label: 'Status', values: [80, 20] }],
      },
    });
    expect(result.valid).toBe(true);
  });

  it('fails when chartType is missing', () => {
    const result = validateSlide({
      type: 'chart',
      data: { labels: ['A'], datasets: [{ label: 'X', values: [1] }] },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('chartType'))).toBe(true);
  });

  it('fails when data is missing', () => {
    const result = validateSlide({ type: 'chart', chartType: 'bar' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('data'))).toBe(true);
  });

  it('fails when chartType is unsupported', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'radar',
      data: { labels: ['A'], datasets: [{ label: 'X', values: [1] }] },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('unsupported'))).toBe(true);
  });

  it('fails when dataset values length mismatches labels', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'bar',
      data: {
        labels: ['A', 'B', 'C'],
        datasets: [{ label: 'X', values: [1, 2] }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('length'))).toBe(true);
  });

  it('fails when dataset is missing label', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'bar',
      data: {
        labels: ['A'],
        datasets: [{ values: [1] }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('label'))).toBe(true);
  });

  it('fails when labels are not strings', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'bar',
      data: {
        labels: [1, 2, 3],
        datasets: [{ label: 'X', values: [1, 2, 3] }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('strings'))).toBe(true);
  });

  it('validates chart with optional color on dataset', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'bar',
      data: {
        labels: ['A', 'B'],
        datasets: [{ label: 'X', values: [1, 2], color: 'teal' }],
      },
    });
    expect(result.valid).toBe(true);
  });

  it('validates chart with all optional fields', () => {
    const slide = createSlide('chart', {
      chartType: 'line',
      title: 'Trend',
      subtitle: 'Over time',
      data: { labels: ['A'], datasets: [{ label: 'X', values: [1] }] },
      options: { showLegend: true, showGrid: true, stacked: false },
      theme: 'dramatic',
      logo: 'top-right',
      notes: 'Speaker notes here',
    });
    expect(slide.title).toBe('Trend');
    expect(slide.theme).toBe('dramatic');
    expect(slide.logo).toBe('top-right');

    const result = validateSlide(slide);
    expect(result.valid).toBe(true);
  });
});
