import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// One Astro project, two sites: Draper Real Estate at "/" and
// Living in the Heights at "/heights/". Map each domain at the host.
export default defineConfig({
  integrations: [react()],
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
