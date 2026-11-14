// Never build a RegExp from user input without this: `(` would throw and `.*` would match everything.
export const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
