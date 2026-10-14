const fs=require('fs'),crypto=require('crypto');
const {makeEdition,wordCount,editionFingerprint,boundedParagraphs}=require('../.test-build/edition');
const {paragraphsFromExtract,generalAudienceScore}=require('../.test-build/text');
const root='releases/qa/discovery-2026-10-14',dir=root+'/sources';
const overrides=JSON.parse(fs.readFileSync('docs/discovery-overrides.json','utf8').replace(/^\uFEFF/,''));
const drafts=[];for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort()){
 const {candidate:c,page:p}=JSON.parse(fs.readFileSync(dir+'/'+file));let paragraphs=paragraphsFromExtract(p.extract);if(overrides[file]?.paragraphCount)paragraphs=paragraphs.slice(0,overrides[file].paragraphCount);
 if(generalAudienceScore(p.title,paragraphs)<.45)continue;
 const revision=p.revisions?.[0]?.revid,url=p.fullurl||'https://it.wikipedia.org/wiki/'+encodeURIComponent(p.title);
 const a=makeEdition({id:'wiki:'+p.pageid,title:p.title,category:c.category,source:url,revision,paragraphs,preview:[],fetchedAt:0,complete:true,textVersion:3},true);if(!a)continue;
 const position=p.extract.indexOf(a.preview[0].slice(0,70)),headings=[...p.extract.slice(0,Math.max(0,position)).matchAll(/^={2,}\s*(.*?)\s*={2,}$/gm)];
 a.provenance={provider:'wikipedia',title:p.title,url,revision,section:headings.at(-1)?.[1]||'Introduzione',license:'https://creativecommons.org/licenses/by-sa/4.0/',attribution:'Wikipedia e suoi contributori'};
 a.edition.continuation=boundedParagraphs(a.edition.continuation,180-wordCount(a.preview.join(' ')));
 const edit=overrides[file]?.edition;
 if(edit){if(edit.title)a.title=edit.title;a.preview=edit.preview;a.edition.continuation=edit.continuation;}
 a.edition.sourcePassages=edit?.evidence||[...a.preview,...a.edition.continuation];
 a.paragraphs=[...a.preview,...a.edition.continuation];
 const raw=p.extract.replace(/\s+/g,' '),all=a.paragraphs;
 if(a.edition.sourcePassages.some(t=>!raw.includes(t.replace(/\s+/g,' '))))continue;
 const words=wordCount(a.preview.join(' '));if(words<40||words>80)continue;
 drafts.push({file,article:a,report:{sourceSha256:crypto.createHash('sha256').update(p.extract).digest('hex'),exactPassages:!edit,evidencePassagesExact:true,previewWords:words,totalWords:wordCount(all.join(' ')),sourceRevision:revision,sourceUrl:url,semanticReview:'pending'}});
}
fs.writeFileSync(root+'/drafts.json',JSON.stringify(drafts,null,2));console.log({drafts:drafts.length,byCategory:drafts.reduce((o,d)=>(o[d.article.category]=(o[d.article.category]||0)+1,o),{})});
