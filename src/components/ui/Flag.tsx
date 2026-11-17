import React from 'react';

// SVG flags from the MIT-licensed flag-icons package. Only the URL map is bundled; each flag file is
// fetched when shown. (Emoji flags are not used: PRD section 12 forbids emojis.)
const FLAGS = import.meta.glob('/node_modules/flag-icons/flags/4x3/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

export function Flag({ code, className }: { code: string; className?: string }) {
  const src = FLAGS[`/node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`];
  if (!src) return <span className={className} aria-hidden />;
  return <img src={src} alt="" aria-hidden loading="lazy" width={20} height={15} className={`h-[15px] w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(15,23,32,.12)] ${className ?? ''}`} />;
}
