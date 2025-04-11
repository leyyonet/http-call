import * as fs from "node:fs";

const src = '../src/assets';
if (fs.existsSync(src)) {
    const dest = '../dist/assets';
    fs.cpSync(src, dest, {recursive: true});
    console.log('Assets are copied')
}
