
import fs from 'fs';
import path from 'path';

const appPath = '/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src/App.tsx';
const content = fs.readFileSync(appPath, 'utf-8');

const regex = /import\("@\/(.*?)"\)/g;
let match;
const problematicFiles = [];

while ((match = regex.exec(content)) !== null) {
  const relativePath = match[1];
  const possiblePaths = [
    path.join('/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src', relativePath + '.tsx'),
    path.join('/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src', relativePath + '.ts'),
    path.join('/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src', relativePath + '/index.tsx'),
    path.join('/Applications/XAMPP/xamppfiles/htdocs/MyTogether/MyTogether-AdminPanel/src', relativePath + '/index.ts'),
  ];

  const filePath = possiblePaths.find(p => fs.existsSync(p));
  if (filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    if (!fileContent.includes('export default')) {
      problematicFiles.push(relativePath);
    }
  } else {
    // Already checked in previous script, but just in case
    console.log('File not found:', relativePath);
  }
}

console.log('Problematic Files (no export default):', problematicFiles);
