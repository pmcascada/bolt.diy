const {CHAPTERS}=require('../public/content.js');
const D=require('../public/db.js');
let n=0,bad=0;
for(const c of CHAPTERS)for(const l of c.lessons){
  for(const e of l.ex){n++;
    try{
      if(e.t==='code'&&!D.checkCode(e.solution,e)){console.log('CODE FAIL',e.id);bad++}
      if(e.t==='query'){const r=D.check(e.solution,e);if(!r.ok||!r.rows.length){console.log('Q FAIL',e.id,r.rows.length);bad++}}
      if(e.t==='quiz'&&!(e.a<e.opts.length)){console.log('quiz bad',e.id);bad++}
    }catch(x){console.log('ERR',e.id,x.message);bad++}
  }
  for(const x of l.examples||[]) if(x.run){try{const r=D.run(D.create(),x.sql);if(!r.length)console.log('empty example',l.id)}catch(er){console.log('EXERR',l.id,er.message);bad++}}
}
console.log(n,'exercises',bad,'bad');
if(bad)process.exit(1)
