import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: 'Aurysian Tools',
    favicon: './src/assets/favicon.png',
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
});
