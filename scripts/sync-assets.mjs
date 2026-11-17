// Copies image assets from design/ into public/ (public copies are git-ignored).
import { cpSync, mkdirSync, rmSync } from 'node:fs';
const ds = 'design/_ds/organic-3bf144cd-0f77-4d21-b523-8671b888de01/styles.css';
rmSync('public/img', { recursive: true, force: true });
rmSync('public/heights', { recursive: true, force: true });
mkdirSync('public/heights', { recursive: true });
cpSync('design/img', 'public/img', { recursive: true });
cpSync('design/living-in-the-heights/assets', 'public/heights/assets', { recursive: true });
mkdirSync('public/ds', { recursive: true });
cpSync(ds, 'public/ds/organic.css');
console.log('assets synced');
