const R = require('ramda')
const {readTestData} = require('./read')
const {groupByList, countState} = require('./handle')
const format = require('./formatText')
const {write} = require('./writeSheet');
const notiFilePath = './assets/notify.txt';
const notiDistFilePath = './dist/noti.txt';
const deduchFilePath = './assets/deduct-money.txt';
const deduchDistFilePath = './dist/dedu.txt';
async function run() {
    let {reg} = await readTestData()
    let grouped = groupByList([3, 4], reg)
    let counted = countState(grouped)
    let input1 = R.pick(['month', 'day', 'finishedNum', 'peopleNum', 'percent', 'group0', 'group1', 'group2', 
                    'group0-percent', 'group1-percent', 'group2-percent', 'group-3', 'group-2', 'group-1'])(counted);
    let input2 = R.range(0, 14).map(idx => ['group{%}', 'group{%}-num', 'group{%}-money'].map(key => key.replace('{%}', idx)));
    input2 = R.mergeAll(counted.notchCharts.map(group => R.zipObj(input2.shift(), group.concat([group[1] * 100]))));
	input2.groupNumTol = R.sum(R.values(R.pickBy((value, key) => key.endsWith('num'), input2)));
	input2.groupMoneyTol = R.sum(R.values(R.pickBy((value, key) => key.endsWith('money'), input2)));
    let format1 = await format.readFormat(input1, notiFilePath);
    await format.write(format1, notiDistFilePath);
    let format2 = await format.readFormat(input2, deduchFilePath);
    await format.write(format2, deduchDistFilePath);
    await write(reg, counted);
}
run();
