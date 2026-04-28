
import fs from 'fs';
import path from 'path';

const appPath = '/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src/App.tsx';
const content = fs.readFileSync(appPath, 'utf-8');

const regex = /import\("@\/(.*?)"\)/g;
let match;
const missingFiles = [];

while ((match = regex.exec(content)) !== null) {
  const relativePath = match[1];
  // Vite usually appends .tsx or .ts if missing
  const possiblePaths = [
    path.join('/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src', relativePath + '.tsx'),
    path.join('/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src', relativePath + '.ts'),
    path.join('/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src', relativePath + '/index.tsx'),
    path.join('/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src', relativePath + '/index.ts'),
  ];

  const exists = possiblePaths.some(p => fs.existsSync(p));
  if (!exists) {
    missingFiles.push(relativePath);
  }
}

console.log('Missing Files:', missingFiles);
