const R = require('ramda')
const {readTestData} = require('./read')
const {groupByList, countState, pickFormatInfo} = require('./handle')
const format = require('./formatText')
const {write} = require('./writeSheet');
const notiFilePath = '../../../assets/notify.txt';
const notiDistFilePath = '../../../dist/noti.txt';
const deduchFilePath = '../../../assets/deduct-money.txt';
const deduchDistFilePath = '../../../dist/dedu.txt';
async function run() {
    let {reg} = await readTestData()
    let grouped = groupByList([3, 4], reg)
    let counted = countState(grouped)
    let input = pickFormatInfo(counted);
    let format1 = await format.readFormat(input.notiFormatKeys, notiFilePath);
    await format.write(format1, notiDistFilePath);
    let format2 = await format.readFormat(input.deduFormatKeys, deduchFilePath);
    await format.write(format2, deduchDistFilePath);
    await write(reg, counted);
}
run();
