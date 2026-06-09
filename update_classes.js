const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('page.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const newContent = content.replace(/className=\"!w-(\d+)\"/g, 'className=\"w-full sm:!w-$1\"');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated ' + fullPath);
      }
    }
  }
}
processDir('c:/Users/araj1/Desktop/weekly market/Weekly-Market/app/admin');
