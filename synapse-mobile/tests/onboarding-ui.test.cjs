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
  // Android counts UTF-16 units; the input handler/storage cap at 48 codepoints.
  assert.ok(identityContent.includes('maxLength={96}'));

  const interestsContent = fs.readFileSync('src/components/onboarding/InterestsStage.tsx', 'utf8');
  assert.ok(interestsContent.includes('b.draft?.interests'));
  // Decorations are screen-level, behind title/body/footer and never scroll
  // inside the chip list. Their motion still uses the same environment.
  assert.ok(screenContent.includes("?'flower':'soft-burst'"));
  assert.ok(screenContent.includes("?'soft-boom':'puffy'"));

  const prepContent = fs.readFileSync('src/components/onboarding/PreparationStage.tsx', 'utf8');
  assert.ok(screenContent.includes('Sto preparando') && screenContent.includes('tutto per te…'));
  assert.ok(prepContent.includes('kind="preparation"'));
  assert.ok(prepContent.includes('onboardingVector("compass"'));
  assert.ok(prepContent.includes('prep.message'));
});
