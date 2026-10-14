const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../src/design-system/tokens.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod.exports,module:mod});module.exports=mod.exports;
