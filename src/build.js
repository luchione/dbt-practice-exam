// node build.js <srcdir> <out.html> [--public] [--lang=en|pt-BR] [--fragment]
//   --public    the version for anyone: browser storage only, "unofficial" notice, About block, language link
//   --lang      language of the page (html lang attribute), default en
//   --fragment  no <!doctype>/<html>/<head> wrapper (for publishing as a claude.ai artifact, which adds its own)
// Without --public you get the personal version, which also syncs the history to the Claude account
// when opened as a claude.ai artifact.
//
// English:    node src/build.js src index.html --public
// Portuguese: node src/build.js src-pt pt/index.html --public --lang=pt-BR
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), flag = n => args.includes('--' + n);
const [dir, out] = args.filter(a => !a.startsWith('--'));
const lang = (args.find(a => a.startsWith('--lang=')) || '--lang=en').slice(7);
const pub = flag('public');
const read = f => fs.readFileSync(path.join(dir, f), 'utf8').trim();
const FILES = ['q-base.js', 'q-d1a.js', 'q-d1b.js', 'q-d2-d4.js', 'q-d3.js', 'q-d5.js', 'q-d6-d7.js', 'q-checkpoint.js', 'q-extra1.js', 'q-extra2.js', 'p2-d1.js', 'p2-d2-d4.js', 'p2-d5-d7.js'];
const data = (pub ? 'window.DBT_PUBLIC = true;\n\n' : '') + FILES.map(read).join('\n\n');
const scripts = '<script>\n' + data + '\n</script>\n\n<script>\n' + read('app.js') + '\n</script>\n';
const page = read('head.html');
let html;
if (flag('fragment')) html = page + '\n\n' + scripts;
else {
  const cut = page.indexOf('<header');   // head.html holds the <head> elements first, then the body markup
  html = '<!doctype html>\n<html lang="' + lang + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    page.slice(0, cut).trim() + '\n</head>\n<body>\n' + page.slice(cut).trim() + '\n\n' + scripts + '</body>\n</html>\n';
}
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, html);
console.log('built', out, pub ? '(public)' : '(personal)', lang, flag('fragment') ? 'fragment' : 'document', (html.length / 1024).toFixed(1) + ' KB');
