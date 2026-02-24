function normalize(rawUrl, options) {
  const includeQuery = !!options.include_query_urls;
  const includeHash = !!options.include_hash_urls;
  const parsed = new URL(String(rawUrl).trim());
  if (!includeHash) parsed.hash = '';
  if (!includeQuery) parsed.search = '';
  if (!options.keep_trailing_slash && parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/$/, '');
  }
  return parsed.toString();
}

const cases = [
  {
    input: 'https://example.com/a/b/?x=1#top',
    options: { include_query_urls: false, include_hash_urls: false, keep_trailing_slash: false },
    expected: 'https://example.com/a/b'
  },
  {
    input: 'https://example.com/a/?x=1#top',
    options: { include_query_urls: true, include_hash_urls: true, keep_trailing_slash: true },
    expected: 'https://example.com/a/?x=1#top'
  }
];

for (const c of cases) {
  const actual = normalize(c.input, c.options);
  if (actual !== c.expected) {
    throw new Error(`mismatch: ${c.input} => ${actual}, expected ${c.expected}`);
  }
}

console.log('urlutil-check: ok');
