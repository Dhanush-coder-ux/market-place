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

    // Replace {sn} when used inside a tag
    content = content.replace(/>\{sn\}<\/span>/g, '>{typeof sn === \'object\' ? (sn.name || sn.id) : sn}</span>');
    
    // Replace key={sn} when it could be an object
    content = content.replace(/key=\{sn\}/g, 'key={typeof sn === \'object\' ? (sn.id || sn.name) : sn}');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
