import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
async function preparePages(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await preparePages(path);
    else if (entry.name.endsWith('.html')) {
      const html = await readFile(path, 'utf8');
      await writeFile(path, html.replace('<!-- production-noscript -->', '<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=2355104858564681&amp;ev=PageView&amp;noscript=1"></noscript>'));
    }
  }
}
await preparePages('dist');
console.log('Built PuraClear into dist/');
