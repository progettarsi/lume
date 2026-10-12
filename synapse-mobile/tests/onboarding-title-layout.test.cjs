const {test}=require('node:test'),assert=require('node:assert/strict');
const {revealedTitleLines}=require('../.test-build/onboardingTitleLayout');

test('typing and erasing retain the final word wrapping and centered line positions',()=>{
 const title='Una scoperta alla volta',lines=[{text:'Una scoperta alla ',x:18,y:0,width:280,height:43},{text:'volta',x:112,y:43,width:92,height:43}];
 for(let count=0;count<=Array.from(title).length;count++){
  const painted=revealedTitleLines(title,lines,count);
  assert.deepEqual(painted.map(({x,y,width,height})=>({x,y,width,height})),lines.map(({x,y,width,height})=>({x,y,width,height})));
  assert.equal(painted[1].text,Array.from('volta').slice(0,Math.max(0,count-18)).join(''));
 }
 assert.equal(revealedTitleLines(title,lines,20)[0].text,'Una scoperta alla ');
 assert.equal(revealedTitleLines(title,lines,20)[1].text,'vo');
});

test('native line offsets preserve explicit breaks and Unicode characters',()=>{
 const title='Àlex 🧑🏽‍🚀\ntutto per te',first='Àlex 🧑🏽‍🚀',lines=[{text:first+'\n',x:0,y:0,width:180,height:43},{text:'tutto per te',x:0,y:43,width:200,height:43}];
 const count=Array.from(first).length+3,painted=revealedTitleLines(title,lines,count);
 assert.equal(painted[0].text,first);assert.equal(painted[1].text,'tu');
});
