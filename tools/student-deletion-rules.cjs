// Wrap every client write grant. Admin OAuth cleanup bypasses these client rules.
const fs=require('node:fs');
const GUARD="auth != null && root.child('users').child(auth.uid).exists() && root.child('users').child(auth.uid).child('deletionPending').val() !== true";
function protect(rules) {
    for(const [key,value]of Object.entries(rules)) {
        if(key==='.write'&&value!==false) {
            if(!String(value).includes("child('deletionPending')"))rules[key]=`(${GUARD}) && (${value})`;
        } else if(value&&typeof value==='object'&&!Array.isArray(value))protect(value);
    }
    if(rules.users?.$uid) {
        const user=rules.users.$uid;
        const guard="data.child('deletionPending').val() !== true";
        if(!String(user['.write']).includes(guard))user['.write']=`(${user['.write']}) && (${guard})`;
        // Descendant write grants can otherwise override denial at /users/$uid.
        const freeze=(node,depth)=>{
            for(const [key,value]of Object.entries(node)) {
                if(key==='.write'&&value!==false) {
                    const parent='data'+'.parent()'.repeat(depth);
                    const condition=parent+".child('deletionPending').val() !== true";
                    if(!String(value).includes(condition))node[key]=`(${value}) && (${condition})`;
                } else if(key[0]!=='.'&&value&&typeof value==='object')freeze(value,depth+1);
            }
        };freeze(user,0);
    }
    return rules;
}
module.exports={protect,GUARD};
if(require.main===module) {
    const path=process.argv[2]||'database.rules.patched.json';
    const data=JSON.parse(fs.readFileSync(path,'utf8'));protect(data.rules);
    fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');console.log('Updated deletion guards:',path);
}
