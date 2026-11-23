// node build.js <srcdir> <out.html> [--public]
// --public: version for anyone (no account sync, no personal checkpoint, "not official" notice)
const fs = require('fs'), path = require('path');
const dir = process.argv[2], out = process.argv[3], pub = process.argv.includes('--public');
const read = f => fs.readFileSync(path.join(dir, f), 'utf8').trim();
const data = (pub ? 'window.DBT_PUBLIC = true;\n\n' : '') + ['q-base.js', 'q-d1a.js', 'q-d1b.js', 'q-d2-d4.js', 'q-d3.js', 'q-d5.js', 'q-d6-d7.js', 'q-checkpoint.js', 'q-certsafari.js', 'q-certsafari2.js', 'p2-d1.js', 'p2-d2-d4.js', 'p2-d5-d7.js', 'p2-fix.js'].map(read).join('\n\n');
const html = read('head.html') + '\n\n<script>\n' + data + '\n</script>\n\n<script>\n' + read('app.js') + '\n</script>\n';
fs.writeFileSync(out, html);
console.log('built', out, pub ? '(public)' : '(personal)', (html.length / 1024).toFixed(1) + ' KB');
