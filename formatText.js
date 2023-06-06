const { readFile } = require('node:fs/promises');
const { writeFile } = require('node:fs');
const R = require('ramda');
const { Buffer } = require('node:buffer');

async function readFormat(input, filePath) {
    let format = await readFile(filePath, { encoding: 'utf8' });
    R.keys(input).forEach(key => {
        format = format.replaceAll('{' + key + '}', input[key]);
    });
    return format;
}



async function write(str, filePath) {
    const data = new Uint8Array(Buffer.from(str));
    writeFile(filePath ,data, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
}

module.exports = {
    readFormat,
    write
}
