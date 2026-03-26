// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartnerBadge } from './PartnerBadge.jsx';

describe('PartnerBadge', () => {
  it('renders nothing when customColors is null', () => {
    const { container } = render(<PartnerBadge customColors={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when customColors is undefined', () => {
    const { container } = render(<PartnerBadge />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the badge with the partner label', () => {
    render(
      <PartnerBadge
        customColors={{
          primary: '#123456',
          bg: '#654321',
          label: 'Microsoft',
        }}
      />,
    );

    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('renders the default label when no label is provided', () => {
    render(
      <PartnerBadge
        customColors={{
          primary: '#123456',
          bg: '#654321',
        }}
      />,
    );

    expect(screen.getByText('Partner branding')).toBeInTheDocument();
  });

  it('renders the color swatch with the correct background color', () => {
    const { container } = render(
      <PartnerBadge
        customColors={{
          primary: '#1EAFAF',
          bg: '#141121',
          label: 'Rewst Partner',
        }}
      />,
    );

    const swatch = container.querySelector('span[style]');

    expect(swatch).toBeInTheDocument();
    expect(swatch).toHaveStyle({ backgroundColor: '#1EAFAF' });
  });
});
