import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Tailwind-aware class merge: a later class wins over an earlier conflicting one, so shared components
 * can be resized from outside (e.g. Tabs `w-full` + caller `w-56`). Knows the app's custom theme tokens.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'title', 'body', 'small', 'caption'],
      radius: ['card', 'button', 'input'],
      color: ['primary-text'],
      shadow: ['card', 'card-hover', 'float'],
    },
  },
});

/** Joins class names, skipping falsy values, resolving Tailwind conflicts (last one wins). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return merge(parts.filter(Boolean).join(' '));
}
