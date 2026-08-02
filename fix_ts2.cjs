const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else if (dirPath.endsWith('.tsx')) {
            callback(dirPath);
        }
    });
}

walkDir('d:/Projects/Hyperlocal-Inventory/Frontends/market-place/src', function(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/\(sn\.name \|\| sn\.id\)/g, '((sn as any).name || (sn as any).id)');
    content = content.replace(/\(s\.name \|\| s\.id\)/g, '((s as any).name || (s as any).id)');
    content = content.replace(/\(sn\.id \|\| sn\.name\)/g, '((sn as any).id || (sn as any).name)');
    content = content.replace(/\(s\.id \|\| s\.name\)/g, '((s as any).id || (s as any).name)');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated AS ANY in ${file}`);
    }
});
