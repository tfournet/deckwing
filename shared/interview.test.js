import { describe, it, expect } from 'vitest';
import { getInterviewConfig, shouldSkipInterview, formatInterviewContext } from './interview.js';

describe('interview helpers', () => {
  it('returns the interview config', () => {
    expect(getInterviewConfig()).toEqual(expect.objectContaining({ enabled: true }));
    expect(getInterviewConfig().questions).toHaveLength(5);
  });

  it('detects skip phrases case-insensitively', () => {
    expect(shouldSkipInterview('Just make it for QBR leadership')).toBe(true);
    expect(shouldSkipInterview('please SKIP QUESTIONS and build it')).toBe(true);
    expect(shouldSkipInterview('Build me a deck about automation')).toBe(false);
  });

  it('formats interview answers into prompt context', () => {
    const context = formatInterviewContext({
      audience: 'MSP owners/leadership',
      purpose: { label: 'Quarterly business review', value: 'qbr' },
      keyMessage: 'Automation saved 400 hours last quarter',
      data: ['Ticket volume trends', 'ConnectWise integration stats'],
    });

    expect(context).toContain('Interview context:');
    expect(context).toContain('- Who is the audience for this presentation? MSP owners/leadership');
    expect(context).toContain('- What is the purpose of this presentation? Quarterly business review');
    expect(context).toContain('- What is the one key message you want the audience to take away? Automation saved 400 hours last quarter');
    expect(context).toContain('- Any specific data, stories, or topics to include? Ticket volume trends, ConnectWise integration stats');
  });

  it('returns a fallback string when no answers are provided', () => {
    expect(formatInterviewContext()).toBe('Interview context: none provided');
  });
});
