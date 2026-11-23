import { describe, it, expect } from 'vitest';
import HighlightWordsInPdf, { findMatches } from '../highlightWordsInPdf/index.js';

describe('findMatches (pure position finder)', () => {
  it('finds a single occurrence', () => {
    expect(findMatches('hello world', ['world'])).toEqual([
      { startIndex: 6, endIndex: 11 },
    ]);
  });

  it('finds overlapping occurrences', () => {
    expect(findMatches('aaa', ['aa'])).toEqual([
      { startIndex: 0, endIndex: 2 },
      { startIndex: 1, endIndex: 3 },
    ]);
  });

  it('finds multiple words (positions grouped by word)', () => {
    const pos = findMatches('foo bar foo', ['foo', 'bar']);
    expect(pos).toEqual([
      { startIndex: 0, endIndex: 3 },
      { startIndex: 8, endIndex: 11 },
      { startIndex: 4, endIndex: 7 },
    ]);
  });

  it('escapes regex special characters in words', () => {
    expect(findMatches('a.b (c)', ['.b', '(c)'])).toEqual([
      { startIndex: 1, endIndex: 3 },
      { startIndex: 4, endIndex: 7 },
    ]);
  });

  it('returns empty for no matches', () => {
    expect(findMatches('hello', ['xyz'])).toEqual([]);
  });

  it('exports the PDF highlighter class', () => {
    expect(typeof HighlightWordsInPdf).toBe('function');
    expect(typeof HighlightWordsInPdf.prototype.setPageDomHighlight).toBe('function');
    expect(typeof HighlightWordsInPdf.prototype.clear).toBe('function');
  });
});
