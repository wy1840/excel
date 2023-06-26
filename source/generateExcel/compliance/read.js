const { getSourceData } = require('./utils');
const R = require('ramda');
const { readFile } = require('node:fs/promises');
const { rowsToArr } = require('./utils');

async function readInfo() {
    const info = await readFile('./info.json', { encoding: 'utf8' });
    return JSON.parse(info);
}

async function readTestData() {
    let { lessonsList } = await readInfo();
    let source = await getSourceData("../../../assets/源.xlsx", 0, /南宁/, 4).then(rowsToArr)
    let reg = await getSourceData('../../../assets/简易版花名册.xlsx', 0).then(rowsToArr);
    reg.forEach(empl => {
        let lessons = source.filter(r => r[2] === empl[1]);
        let lesList = R.pluck(5)(lessons);
        let stateList = R.pluck(6, lessons);
        let states = R.zipObj(lesList, stateList);
        let newStates = {};
        R.forEach(key => newStates[key] = '未学习',
            R.difference(lessonsList, R.keys(states)));
        let totalStates = R.mergeAll([states, newStates]);
        empl.push(totalStates);
    });
    reg.forEach(r => r.push(R.countBy(R.identity)(R.values(r[5]))));
    return {reg, source};
}

exports.readInfo = readInfo;
exports.readTestData = readTestData;