import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(currentDir, '..');
const publicDir = path.join(pluginRoot, 'public');

async function main() {
  await fs.mkdir(publicDir, { recursive: true });

  // Cloudflare Pages _headers
  const headersContent = `/*
  Access-Control-Allow-Origin: *
`;
  await fs.writeFile(path.join(publicDir, '_headers'), headersContent);
  console.log('Generated public/_headers');

  // EdgeOne Pages edgeone.json
  const edgeoneContent = {
    headers: [
      {
        source: "/*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*"
          }
        ]
      }
    ]
  };
  await fs.writeFile(path.join(publicDir, 'edgeone.json'), JSON.stringify(edgeoneContent, null, 2));
  console.log('Generated public/edgeone.json');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
