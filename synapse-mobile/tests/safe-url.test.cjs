const {test}=require('node:test');
const assert=require('node:assert/strict');
const {safeSourceUrl}=require('../.test-build/safeSourceUrl');

test('safeSourceUrl validates allowed HTTPS Wikipedia and Wikivoyage domains', ()=>{
  // Valid Wikipedia and Wikivoyage URLs
  assert.equal(safeSourceUrl('https://it.wikipedia.org/wiki/Luce'),'https://it.wikipedia.org/wiki/Luce');
  assert.equal(safeSourceUrl('https://en.wikipedia.org/wiki/Light'),'https://en.wikipedia.org/wiki/Light');
  assert.equal(safeSourceUrl('https://wikipedia.org/wiki/Luce'),'https://wikipedia.org/wiki/Luce');
  assert.equal(safeSourceUrl('https://it.wikivoyage.org/wiki/Roma'),'https://it.wikivoyage.org/wiki/Roma');
  assert.equal(safeSourceUrl('https://wikivoyage.org/wiki/Roma'),'https://wikivoyage.org/wiki/Roma');
  assert.equal(safeSourceUrl(' https://it.wikipedia.org/wiki/Luce '), 'https://it.wikipedia.org/wiki/Luce');

  // Scheme checks: http, javascript, intent, data
  assert.equal(safeSourceUrl('http://it.wikipedia.org/wiki/Luce'), undefined, 'http scheme must be rejected');
  assert.equal(safeSourceUrl('javascript:alert(1)'), undefined, 'javascript scheme must be rejected');
  assert.equal(safeSourceUrl('intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end'), undefined, 'intent scheme must be rejected');
  assert.equal(safeSourceUrl('data:text/html,<b>hello</b>'), undefined, 'data scheme must be rejected');
  assert.equal(safeSourceUrl('file:///etc/passwd'), undefined, 'file scheme must be rejected');

  // Host checks: foreign hosts, subdomains spoofing, invalid domains
  assert.equal(safeSourceUrl('https://evil.com'), undefined, 'evil.com must be rejected');
  assert.equal(safeSourceUrl('https://it.wikipedia.org.evil.com/wiki/Luce'), undefined, 'subdomain spoofing must be rejected');
  assert.equal(safeSourceUrl('https://notwikipedia.org/wiki/Luce'), undefined, 'notwikipedia.org must be rejected');
  assert.equal(safeSourceUrl('https://notwikivoyage.org/wiki/Roma'), undefined, 'notwikivoyage.org must be rejected');
  assert.equal(safeSourceUrl('https://wikipedia.com/wiki/Luce'), undefined, 'wikipedia.com must be rejected');
  assert.equal(safeSourceUrl('https://google.com'), undefined, 'google.com must be rejected');

  // Falsy / invalid inputs
  assert.equal(safeSourceUrl(''), undefined);
  assert.equal(safeSourceUrl(null), undefined);
  assert.equal(safeSourceUrl(undefined), undefined);
  assert.equal(safeSourceUrl('not a url'), undefined);
});
