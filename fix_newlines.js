const fs = require('fs');
let file = 'tests/unit/import/dedupeEngine.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\n/g, '\n');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed literal newlines');
