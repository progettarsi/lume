const test = require('node:test');
const assert = require('node:assert/strict');
const { articleStatus, aiFailure } = require('../.test-build/readerStatus.js');

function createFixture(overrides = {}) {
  return {
    id: 'art-1',
    title: 'Test Title',
    category: 'general',
    paragraphs: ['Paragraph 1'],
    preview: ['Preview line'],
    source: 'https://example.com/source',
    fetchedAt: 1700000000000,
    ...overrides,
  };
}

test('1 complete article returns undefined both online/offline despite a content issue', () => {
  const base = createFixture({
    complete: true,
    contentIssue: 'Qualche errore',
    contentIssueKind: 'content',
  });
  const fixtureSnapshot = JSON.parse(JSON.stringify(base));

  assert.equal(articleStatus(base, true), undefined);
  assert.equal(articleStatus(base, false), undefined);
  assert.deepEqual(base, fixtureSnapshot);
});

test('2 incomplete offline with content issue produces offline kind/article action and exact offline message', () => {
  const article = createFixture({
    complete: false,
    contentIssue: 'Errore generico',
    contentIssueKind: 'content',
  });

  const expected = {
    kind: 'offline',
    message: 'L’anteprima è disponibile offline. L’approfondimento non è ancora stato scaricato.',
    action: 'article',
  };

  assert.deepEqual(articleStatus(article, false), expected);
});

test('3 online content issue preserves custom issue, source action, plus empty issue uses exact content fallback', () => {
  const customArticle = createFixture({
    complete: false,
    contentIssue: 'Voce non supportata specificata.',
    contentIssueKind: 'content',
  });
  assert.deepEqual(articleStatus(customArticle, true), {
    kind: 'content',
    message: 'Voce non supportata specificata.',
    action: 'source',
  });

  const emptyArticle = createFixture({
    complete: false,
    contentIssue: '',
    contentIssueKind: 'content',
  });
  assert.deepEqual(articleStatus(emptyArticle, true), {
    kind: 'content',
    message: 'Approfondimento non disponibile per questa voce.',
    action: 'source',
  });
});

test('4 online limit produces exact busy message, network kind and article action', () => {
  const article = createFixture({
    complete: false,
    contentIssueKind: 'limit',
  });

  const expected = {
    kind: 'network',
    message: 'La fonte è momentaneamente occupata. L’anteprima resta disponibile.',
    action: 'article',
  };

  assert.deepEqual(articleStatus(article, true), expected);
});

test('5 online network, absent issue and offline issue kinds produce exact generic network fallback, ignoring a custom contentIssue for these kinds', () => {
  const expected = {
    kind: 'network',
    message: 'Non è stato possibile scaricare l’approfondimento. L’anteprima resta disponibile.',
    action: 'article',
  };

  const networkKindArticle = createFixture({
    complete: false,
    contentIssue: 'Ignorato',
    contentIssueKind: 'network',
  });
  assert.deepEqual(articleStatus(networkKindArticle, true), expected);

  const absentIssueArticle = createFixture({
    complete: false,
    contentIssue: 'Ignorato',
  });
  assert.deepEqual(articleStatus(absentIssueArticle, true), expected);

  const offlineKindArticle = createFixture({
    complete: false,
    contentIssue: 'Ignorato',
    contentIssueKind: 'offline',
  });
  assert.deepEqual(articleStatus(offlineKindArticle, true), expected);
});

test('6 aiFailure preserves the supplied message after exact original-readable prefix and yields ai kind/action; also test empty message', () => {
  const withMsg = aiFailure('Riprova più tardi.');
  assert.deepEqual(withMsg, {
    kind: 'ai',
    message: 'Il testo originale resta leggibile. Riprova più tardi.',
    action: 'ai',
  });

  const emptyMsg = aiFailure('');
  assert.deepEqual(emptyMsg, {
    kind: 'ai',
    message: 'Il testo originale resta leggibile. ',
    action: 'ai',
  });
});
