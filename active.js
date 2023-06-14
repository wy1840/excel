const Excel = require("exceljs");
const R = require("ramda");
const { getSourceData, rowsToArr } = require('./utils');
const { writeFile, readFile } = require('node:fs/promises');

let inputData = await readFile('./data.json', { encoding: 'utf8' }).then(JSON.parse).then(R.prop('personInfos'));
readFile('./data.json', 'utf8', (err, data) => {
  if (err) throw err;
  inputData = JSON.parse(data);
});

let data = await getSourceData('./assets/讲师课时积分明细.xlsx', 0);
let scores = R.pipe(
  rowsToArr,
  R.project([2, 14]),
  R.groupBy(R.prop('2')),
  R.mapObjIndexed(val => R.sum(R.pluck('14')(val)))
)(data);
data = await getSourceData('./assets/各单位6月导师活跃度.xlsx', 1);
let personInfos = R.pipe(
  rowsToArr,
  R.project([1, 2, 3, 6, 15]),
  R.map(info => {
    let score = scores[info[2]];
    info['17'] = score ? score : 0;
    info['18'] = Number(info['17']) >= 15 ? "y" : "n";
    return info;
  })
)(data);
let groupByG = R.pipe(
  R.groupBy(R.prop('1')),
  R.map(R.reject(R.isNil))
)(personInfos);
let byActive = R.propEq('18', 'y');
let byScoreLte10 = R.propEq('17', 10);
let bySupervisor = R.pipe(R.prop('15'), R.test(/主管/));
let result = R.map(val => {
  let total = Object.create(null);
  total['peopleNum'] = val.length;
  total['activeNum'] = R.count(byActive)(val);
  total['scoreLte10'] = R.count(byScoreLte10)(val);
  total['supervisorNum'] = R.count(bySupervisor)(val);
  total['supervisorActiveNum'] = R.pipe(R.filter(bySupervisor), R.count(byActive))(val);
  return total;
})(groupByG);

let outputData = new Uint8Array(Buffer.from(JSON.stringify({ personInfos })));

async function write(outputData) {
  try {
    const controller = new AbortController();
    const { signal } = controller;
    const data = new Uint8Array(Buffer.from(outputData));
    const promise = writeFile('./data.json', data, { signal });
  
    // Abort the request before the promise settles.
    controller.abort();
  
    await promise;

    console.log('finished');
  } catch (err) {
    // When a request is aborted - err is an AbortError
    console.error(err);
  }
}

let diffData = R.difference(personInfos, inputData)
let addActiveList = diffData.filter(d => d['18'] === 'y' && R.propEq('18', 'n')(R.find(R.propEq('2', d[2]), inputData)))