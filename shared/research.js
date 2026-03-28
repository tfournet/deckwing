import researchSources from '../src/config/design/research-sources.json' with { type: 'json' };

function normalizeDomain(domain) {
  return String(domain ?? '').trim().toLowerCase().replace(/^\.+|\.+$/g, '');
}

function getHostname(url) {
  try {
    return normalizeDomain(new URL(url).hostname);
  } catch {
    return '';
  }
}

export function getEnabledSources() {
  return (researchSources.sources ?? []).filter(source => source?.enabled);
}

export function isAllowedUrl(url) {
  const hostname = getHostname(url);
  if (!hostname) {
    return false;
  }

  return getEnabledSources().some(source => {
    const domain = normalizeDomain(source.domain);
    return hostname === domain || hostname.endsWith(`.${domain}`);
  });
}

export function formatCitation(title, url) {
  return researchSources.citationFormat.template
    .replaceAll('{title}', title)
    .replaceAll('{url}', url);
}

export default {
  getEnabledSources,
  isAllowedUrl,
  formatCitation,
};
