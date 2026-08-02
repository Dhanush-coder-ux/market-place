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

    content = content.replace(/\.map\(\s*\(\s*sn\s*:\s*string\b/g, '.map((sn: any');
    content = content.replace(/\.map\(\s*\(\s*s\s*:\s*string\b/g, '.map((s: any');
    
    // Some might be like `.map((sn: string, idx: number)` -> `.map((sn: any, idx: number)`
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated TS types in ${file}`);
    }
});
