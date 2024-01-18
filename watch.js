import fs from 'fs';
import cp from 'child_process'

process.chdir("src");

console.log(cp.execSync("node make.js").toString());
fs.watch(".", {
  recursive: true
}, () => {
  console.log(cp.execSync("node make.js").toString());
})