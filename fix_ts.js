const fs = require('fs');
const glob = require('glob');

const files = glob.sync('d:/Projects/Hyperlocal-Inventory/Frontends/market-place/src/**/*.tsx');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace (sn: string) with (sn: any) in map functions
    content = content.replace(/\.map\(\s*\(\s*sn\s*:\s*string\b/g, '.map((sn: any');
    content = content.replace(/\.map\(\s*\(\s*s\s*:\s*string\b/g, '.map((s: any');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated TS types in ${file}`);
    }
});
