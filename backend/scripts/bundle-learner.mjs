import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=(await readdir(root+'learner-assets')).filter(n=>/\.(html|js|css)$/.test(n));
const assets={};for(const n of files)assets[n]=await readFile(root+'learner-assets/'+n,'utf8');
await writeFile(root+'dist/server/index.js',(await readFile(root+'worker/index.js','utf8'))+'\n'+(await readFile(root+'worker/learner.js','utf8'))+'\nconst LEARNER_ASSETS='+JSON.stringify(assets)+';\n');
console.log('Bundled unchanged learning content with account storage.');
