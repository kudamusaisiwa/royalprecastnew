import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function incrementBuild() {
  try {
    // Update package.json
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Increment build number
    const currentBuild = parseInt(pkgJson.buildNumber) || 0;
    pkgJson.buildNumber = (currentBuild + 1).toString();
    
    // Write updated package.json
    fs.writeFileSync(packagePath, JSON.stringify(pkgJson, null, 2) + '\n');
    
    console.log(`Build number incremented to ${pkgJson.buildNumber}`);
  } catch (error) {
    console.error('Error incrementing build number:', error);
    process.exit(1);
  }
}

incrementBuild();