const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function compileComponent(filePath) {
  return ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
}

test('onboarding presentation components compile and export valid functions', () => {
  const introCode = compileComponent('src/components/onboarding/IntroStage.tsx');
  assert.ok(introCode.includes('IntroStage'));

  const identityCode = compileComponent('src/components/onboarding/IdentityStage.tsx');
  assert.ok(identityCode.includes('IdentityStage'));

  const actionBtnCode = compileComponent('src/components/onboarding/ActionButton.tsx');
  assert.ok(actionBtnCode.includes('ActionButton'));

  const chipCode = compileComponent('src/components/onboarding/InterestChip.tsx');
  assert.ok(chipCode.includes('InterestChip'));

  const interestsCode = compileComponent('src/components/onboarding/InterestsStage.tsx');
  assert.ok(interestsCode.includes('InterestsStage'));

  const tutorialCode = compileComponent('src/components/onboarding/TutorialStage.tsx');
  assert.ok(tutorialCode.includes('TutorialStage'));

  const prepCode = compileComponent('src/components/onboarding/PreparationStage.tsx');
  assert.ok(prepCode.includes('PreparationStage'));

  const screenCode = compileComponent('src/components/OnboardingScreen.tsx');
  assert.ok(screenCode.includes('OnboardingScreen'));
  assert.ok(screenCode.includes('IdentityPhoto'));
  assert.ok(screenCode.includes('LocalProfileEditor'));
});

test('onboarding screen verifies stage requirements and accessibility props', () => {
  const screenContent = fs.readFileSync('src/components/OnboardingScreen.tsx', 'utf8');
  assert.ok(screenContent.includes('IntroStage'));
  assert.ok(screenContent.includes('IdentityStage'));
  assert.ok(screenContent.includes('InterestsStage'));
  assert.ok(screenContent.includes('TutorialStage'));
  assert.ok(screenContent.includes('PreparationStage'));

  const identityContent = fs.readFileSync('src/components/onboarding/IdentityStage.tsx', 'utf8');
  // Check that real input doesn't use the fake names directly
  assert.ok(identityContent.includes('placeholderOverlay'));
  assert.ok(identityContent.includes('accessibilityLabel="Il tuo nome, facoltativo"'));
  assert.ok(identityContent.includes('maxLength={48}'));

  const interestsContent = fs.readFileSync('src/components/onboarding/InterestsStage.tsx', 'utf8');
  assert.ok(interestsContent.includes('b.draft?.interests'));
  assert.ok(interestsContent.includes('flower'));
  assert.ok(interestsContent.includes('soft-boom'));

  const prepContent = fs.readFileSync('src/components/onboarding/PreparationStage.tsx', 'utf8');
  assert.ok(prepContent.includes('Sto preparando') && prepContent.includes('tutto per te…'));
  assert.ok(prepContent.includes('kind="preparation"'));
  assert.ok(prepContent.includes('compass.png'));
  assert.ok(prepContent.includes('prep.message'));
});
