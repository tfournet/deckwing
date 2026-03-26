export function PartnerBadge({ customColors }) {
  if (!customColors) return null;
  const isValidHex = typeof customColors.primary === 'string'
    && /^#[0-9a-fA-F]{3,8}$/.test(customColors.primary);
  const safeColor = isValidHex ? customColors.primary : '#1EAFAF';

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-trigger-amber-400/20 text-trigger-amber-400 border border-trigger-amber-400/30"
    >
      <span
        style={{
          backgroundColor: safeColor,
          width: 8,
          height: 8,
          borderRadius: '50%',
        }}
      />
      {customColors.label || 'Partner branding'}
    </span>
  );
}
