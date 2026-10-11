import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/checkout.js';
async function run({body,method='POST',origin='https://www.shoppuraclear.com',contentType='application/json'}={}) {
  const req={method,headers:{host:'www.shoppuraclear.com',origin,'content-type':contentType},body};
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(value){this.body=JSON.parse(value)}};
  await handler(req,res);return res;
}
test('malformed JSON returns a client error, not an upstream error',async()=>assert.equal((await run({body:'{'})).statusCode,400));
test('platform JSON parser errors become safe client errors',async()=>{
  const req={method:'POST',headers:{host:'www.shoppuraclear.com','content-type':'application/json'},get body(){throw Object.assign(new Error('Invalid JSON'),{statusCode:400});}};
  const res={setHeader(){},end(value){this.body=JSON.parse(value)}};
  await handler(req,res);assert.equal(res.statusCode,400);assert.match(res.body.error,/valid checkout/);
});
test('parsed and string oversized bodies are both rejected',async()=>{
  const body={extra:'x'.repeat(5000)};
  for(const value of [body,JSON.stringify(body)]) assert.equal((await run({body:value})).statusCode,413);
});
test('rejects foreign origins, wrong methods and content types before Shopify',async()=>{
  assert.equal((await run({body:{lines:[]},origin:'https://example.org'})).statusCode,403);
  assert.equal((await run({method:'GET'})).statusCode,405);
  assert.equal((await run({body:'',contentType:'text/plain'})).statusCode,415);
});
