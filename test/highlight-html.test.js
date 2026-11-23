import { describe, it, expect } from 'vitest';
import HighlightWordsInDom from '../highlightWordsInHtml/index.js';

function highlight(html, list, options) {
  const container = document.createElement('div');
  container.innerHTML = html;
  const result = new HighlightWordsInDom().getHighlightInnerHTML(container, list, options);
  return { container, result };
}

describe('HighlightWordsInDom', () => {
  it('highlights a simple word', () => {
    const { result } = highlight('<p>hello world</p>', [{ word: 'world' }]);
    expect(result).toContain('<i class="red-highlight">world</i>');
    expect(result).toContain('hello ');
  });

  it('highlights a keyword split across tags (cross-tag matching)', () => {
    const { result } = highlight('<span>Java</span><span>Script</span>', [{ word: 'JavaScript' }]);
    const matches = result.match(/<i class="red-highlight">/g) || [];
    expect(matches.length).toBe(2);
    // reconstruct the plain text — highlight markup removed
    const text = result.replace(/<i class="red-highlight">/g, '').replace(/<\/i>/g, '');
    expect(text).toBe('<span>Java</span><span>Script</span>');
  });

  it('supports regex keywords', () => {
    const { result } = highlight('<p>abc123 and abc999</p>', [
      { isReg: true, reg: /abc\d+/g },
    ]);
    expect(result.match(/<i class="red-highlight">/g).length).toBe(2);
  });

  it('supports multiple keywords in one pass', () => {
    const { result } = highlight('<p>alpha beta</p>', [{ word: 'alpha' }, { word: 'beta' }]);
    expect(result).toContain('<i class="red-highlight">alpha</i>');
    expect(result).toContain('<i class="red-highlight">beta</i>');
  });

  it('does not corrupt text containing < > & (HTML escaping)', () => {
    const html = '<p>a &lt; b and &amp; c</p>';
    const { container, result } = highlight(html, [{ word: 'b' }]);
    // re-parse the result — text content must be preserved intact
    const probe = document.createElement('div');
    probe.innerHTML = result;
    expect(probe.textContent).toBe('a < b and & c');
    expect(probe.querySelectorAll('i').length).toBe(1);
    expect(probe.querySelector('i').textContent).toBe('b');
    expect(container.textContent).toBe('a < b and & c');
  });

  it('keeps markup intact when text appears inside an earlier attribute', () => {
    const html = '<img alt="hi" src="x"><span>hi there</span>';
    const { result } = highlight(html, [{ word: 'hi' }]);
    expect(result).toContain('<img');
    expect(result).toContain('alt="hi"');
    const probe = document.createElement('div');
    probe.innerHTML = result;
    // only the text occurrence is wrapped, not the attribute
    expect(probe.querySelectorAll('i').length).toBe(1);
    expect(probe.querySelector('i').textContent).toBe('hi');
  });

  it('supports a custom highlight class', () => {
    const { result } = highlight('<p>hello</p>', [{ word: 'hello' }], {
      highlightClass: 'my-mark',
    });
    expect(result).toContain('<i class="my-mark">hello</i>');
    expect(result).not.toContain('red-highlight');
  });

  it('returns the original innerHTML when the list is empty', () => {
    const html = '<p>nothing to do</p>';
    const { result } = highlight(html, []);
    expect(result).toBe('<p>nothing to do</p>');
  });

  it('returns the original innerHTML when no keyword matches', () => {
    const { result } = highlight('<p>hello world</p>', [{ word: 'xyz' }]);
    expect(result).toBe('<p>hello world</p>');
  });
});
