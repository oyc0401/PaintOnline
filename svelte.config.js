import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-node only supports node environments, such as Replit Autoscale or Reserved VM.
    // If you'd like to change your Replit Deployment type, see https://kit.svelte.dev/docs/building-your-app
    // for more information on SvelteKit Adapters
    adapter: adapter({
      out: 'build'
    }),
    vite: {
      resolve: {
        alias: {
          $store: path.resolve('./src/store')
        }
      }
    }
  },
  preprocess: vitePreprocess(),
  
};

export default config;
