import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../public/ambassador.js',import.meta.url),'utf8');
async function submit(response) {
  let handler,resets=0;
  const button={disabled:false,innerHTML:'Submit'};
  const status={};
  const form={reportValidity:()=>true,querySelector:()=>button,addEventListener:(_,fn)=>handler=fn,reset:()=>resets++};
  const document={querySelector:s=>({'#ambassador':{},'#ambassador-form':form,'#ambassador-status':status}[s]||null),querySelectorAll:()=>[]};
  vm.runInNewContext(source,{document,FormData:class {entries(){return [['name','QA']][Symbol.iterator]();}},AbortSignal,fetch:async()=>{if(response instanceof Error)throw response;return response;}});
  await handler({preventDefault(){}});
  return {resets,button,status};
}
test('Ambassador keeps answers when service returns HTTP 200 with failure',async()=>{
  const r=await submit({ok:true,json:async()=>({success:false})});
  assert.equal(r.resets,0);assert.match(r.status.textContent,/could not be sent/);assert.equal(r.button.disabled,false);
});
test('Ambassador resets answers only after explicit service acceptance',async()=>{
  const r=await submit({ok:true,json:async()=>({success:'true'})});assert.equal(r.resets,1);assert.match(r.status.textContent,/review/);
});
test('Ambassador recovers after timeout without losing answers',async()=>{
  const r=await submit(new Error('Timeout'));assert.equal(r.resets,0);assert.equal(r.button.disabled,false);
});
