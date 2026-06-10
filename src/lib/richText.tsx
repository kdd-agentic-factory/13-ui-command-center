/**
 * richText — safe inline rendering of lightweight markup.
 *
 * Replaces `dangerouslySetInnerHTML` for our event feeds and strategy lines.
 * Only `<strong>…</strong>` is honoured; everything else is rendered as plain
 * text, so user-supplied content (e.g. crew-chief directives) can never inject
 * markup or script. Returns React nodes, not HTML.
 */
import { Fragment, type ReactNode } from 'react';

const STRONG_RE = /<strong>(.*?)<\/strong>/gis;

/** Render a string that may contain <strong> spans as safe React nodes. */
export function renderRichText(input: string): ReactNode {
  if (!input) return null;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  STRONG_RE.lastIndex = 0;
  while ((match = STRONG_RE.exec(input)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={key++}>{input.slice(lastIndex, match.index)}</Fragment>);
    }
    nodes.push(<strong key={key++}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < input.length) {
    nodes.push(<Fragment key={key++}>{input.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

/** Wrap the given keyword groups in <strong>, then render safely. */
export function renderHighlighted(input: string, pattern: RegExp): ReactNode {
  // Build with the markup token, then hand to renderRichText which treats the
  // raw input (minus the tokens it injects) as plain text.
  const marked = input.replace(pattern, '<strong>$1</strong>');
  return renderRichText(marked);
}
