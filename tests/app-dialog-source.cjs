const fs=require('fs');const path=require('path');
const b=require(path.join(process.env.WORKSPACE_NODE_MODULES||'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright/lib/transform/babelBundle.js'));
const counts={};
for(const file of fs.readdirSync('js').filter(f=>f.endsWith('.js'))){
 const source=fs.readFileSync('js/'+file,'utf8');
 b.traverse(b.babelParse(source,file),{CallExpression(p){
 const c=p.node.callee;
 const native=c.type==='Identifier'&&!p.scope.getBinding(c.name)?c.name:c.type==='MemberExpression'&&c.object.name==='window'?c.property.name:null;
 if(['alert','confirm','prompt'].includes(native))throw Error('Native dialog remains in '+file+':'+p.node.loc.start.line);
 if(c.type==='MemberExpression'&&c.object.name==='AppDialog'){
   const name=c.property.name;counts[name]=(counts[name]||0)+1;
   if(['confirm','prompt'].includes(name)&&p.parent.type!=='AwaitExpression')throw Error('Unawaited decision in '+file+':'+p.node.loc.start.line);
 }
 }});
}
for(const f of ['index.html','student.html','teacher.html']){
 const s=fs.readFileSync(f,'utf8');if(!s.includes('js/app-dialog.js')||!s.includes('css/app-dialog.css'))throw Error('Missing common UI '+f);
}
console.log('PASS: all scripts parse, no native dialog calls, every decision awaited, shared UI loaded on all entry pages.',counts);
