import { readFile, writeFile, mkdir, rm, copyFile, access, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = await readFile(path.join(root, 'worker/index.js'), 'utf8');
const marker = '`;\n\nconst DEFAULT_MISSION_RULES';
const end = source.indexOf(marker);
if (!source.startsWith('const html = `') || end < 0) {
  throw new Error('Não foi possível localizar o HTML do BarberXP.');
}
// A versão Pages usa o HTML extraído literalmente, incluindo escapes dos scripts.
const html = source.slice('const html = `'.length, end)
  .replaceAll('__USER_EMAIL__', 'edershow08@gmail.com')
  .replaceAll('__IS_LEADER__', 'true');
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
try {
  await cp(path.join(root, 'public'), dist, { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await writeFile(path.join(dist, 'index.html'), html);
await copyFile(path.join(root, 'sw.js'), path.join(dist, 'sw.js'));
const manifest = {
  name: 'BarberXP', short_name: 'BarberXP', start_url: '/', display: 'standalone',
  background_color: '#020617', theme_color: '#22c55e', icons: [],
};
for (const size of [192, 512]) {
  const filename = `icon-${size}.png`;
  try {
    await access(path.join(root, filename));
    await copyFile(path.join(root, filename), path.join(dist, filename));
    manifest.icons.push({ src: '/' + filename, sizes: `${size}x${size}`, type: 'image/png' });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    try {
      await access(path.join(dist, filename));
      manifest.icons.push({ src: '/' + filename, sizes: `${size}x${size}`, type: 'image/png' });
    } catch (missing) {
      if (missing.code !== 'ENOENT') throw missing;
    }
  }
}
try {
  await copyFile(path.join(root, 'manifest.webmanifest'), path.join(dist, 'manifest.webmanifest'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  try {
    await access(path.join(dist, 'manifest.webmanifest'));
  } catch (missing) {
    if (missing.code !== 'ENOENT') throw missing;
    await writeFile(path.join(dist, 'manifest.webmanifest'), JSON.stringify(manifest));
  }
}
console.log('BarberXP publicado em dist com Service Worker.');
