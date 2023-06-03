const { readFile } = require('node:fs/promises');
const { writeFile } = require('node:fs');
const R = require('ramda');
const { Buffer } = require('node:buffer');

async function readFormat(input) {
    let count = R.pick(['month', 'day', 'finishedNum', 'peopleNum', 'percent', 'group0', 'group1', 'group2', 
    'group0-percent', 'group1-percent', 'group2-percent', 'group-3', 'group-2', 'group-1'])(input)
    let format = await readFile('./assets/notify.txt', { encoding: 'utf8' });
    R.keys(count).forEach(key => {
        format = format.replaceAll('{' + key + '}', count[key]);
    });
    return format;
}

async function write(str) {
    const data = new Uint8Array(Buffer.from(str));
    writeFile('./dist/noti.txt', data, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
}

module.exports = {
    readFormat,
    write
}
