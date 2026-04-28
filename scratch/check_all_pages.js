
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = '/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src/pages';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const files = [];
walkDir(rootDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    files.push(filePath);
  }
});

console.log(`Checking ${files.length} files...`);

const results = [];
for (const file of files) {
  try {
    // Just a quick check to see if we can read and if it looks okay
    const content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('export')) {
        results.push({ file, error: 'No export found' });
    }
  } catch (e) {
    results.push({ file, error: e.message });
  }
}

console.log('Issues found:', results);
