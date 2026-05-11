import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('loads versioned css and app module to avoid mixed PWA caches', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(indexHtml, /href="styles\.css\?v=\d+"/);
  assert.match(indexHtml, /src="app\.js\?v=\d+"/);
});

test('precache includes the same versioned css and app module urls', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const serviceWorker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const cssUrl = indexHtml.match(/href="(styles\.css\?v=\d+)"/)?.[1];
  const appUrl = indexHtml.match(/src="(app\.js\?v=\d+)"/)?.[1];

  assert.ok(cssUrl);
  assert.ok(appUrl);
  assert.equal(serviceWorker.includes(`'./${cssUrl}'`), true);
  assert.equal(serviceWorker.includes(`'./${appUrl}'`), true);
});
