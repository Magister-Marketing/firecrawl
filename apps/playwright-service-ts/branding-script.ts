import * as fs from 'fs';
import * as path from 'path';

let cachedScript: string | null = null;

/**
 * The brand-kit script Firecrawl's cloud engine injects through Chrome CDP,
 * bundled from the same source (`branding-script/`, copied verbatim from
 * apps/api) so this service can run it with `page.evaluate`. Built once per
 * process: tsc compiles the sources into dist/, esbuild bundles them into one
 * self-executing expression that returns `{ branding: {...} }`.
 */
export const getBrandingScript = (): string => {
  if (cachedScript) return cachedScript;
  // Development runs the .ts sources (tsx); the image runs tsc's .js output.
  let entryPoint = path.join(__dirname, 'branding-script', 'index.ts');
  if (!fs.existsSync(entryPoint)) {
    entryPoint = path.join(__dirname, 'branding-script', 'index.js');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const esbuild = require('esbuild');
  const result = esbuild.buildSync({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: '__extractBrandDesign',
    target: ['es2020'],
    write: false,
  });
  cachedScript = `(function __extractBrandDesign() {
${result.outputFiles[0].text}
return __extractBrandDesign.extractBrandDesign();
})();`;
  return cachedScript;
};
