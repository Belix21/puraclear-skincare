import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
const html = await readFile('public/index.html', 'utf8');
await writeFile('dist/index.html', html.replace('<!-- production-noscript -->', '<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=2355104858564681&amp;ev=PageView&amp;noscript=1"></noscript>'));
console.log('Built PuraClear into dist/');
