export function createEmptyLayoutBlock(slot, kind) {
  switch (kind) {
    case 'heading':
      return { slot, kind, text: '', size: 'lg' };
    case 'text':
      return { slot, kind, text: '' };
    case 'list':
      return { slot, kind, items: [] };
    case 'metric':
      return { slot, kind, value: '', label: '' };
    case 'chart':
      return { slot, kind, type: 'bar', data: [] };
    case 'table':
      return { slot, kind, headers: [], rows: [] };
    case 'image':
      return { slot, kind, src: '', alt: '', fit: 'contain' };
    case 'icon':
      return { slot, kind, name: '', size: 48 };
    case 'quote':
      return { slot, kind, text: '', attribution: '', role: '' };
    case 'callout':
      return { slot, kind, text: '', variant: 'teal' };
    case 'divider':
      return { slot, kind, direction: 'horizontal' };
    case 'spacer':
      return { slot, kind };
    default:
      return { slot, kind };
  }
}
