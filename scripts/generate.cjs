const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '../build');

function get(dir, base = dir, result = {}) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const relDir = '/' + path.relative(base, dir).replace(/\\/g, '/');
    const dirKey = relDir === '/' ? '/' : relDir.replace(/\/$/, '');

    result[dirKey] = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            get(path.join(dir, entry.name), base, result);
        } else {
            result[dirKey].push(entry.name);
        }
    }

    return result;
}

const fileMap = get(dist);

fs.writeFileSync('build/files.json', JSON.stringify(fileMap, null, 2));
