const Excel = require("exceljs");
const R = require("ramda");
const { getSourceData, rowsToArr } = require('./utils');
const { resolve } = require('node:path');
const { writeFile, readFile } = require('node:fs/promises');

let inputData = await readFile(resolve('./data/data.json'), { encoding: 'utf8' })
  .then(JSON.parse)
  .then(R.prop('personInfos'));

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

await writeFile(resolve('./data/data.json'), new Uint8Array(Buffer.from(JSON.stringify({ personInfos }))))

let diffData = R.difference(personInfos, inputData)
let addActiveList = diffData.filter(d => d['18'] === 'y' && R.propEq('18', 'n')(R.find(R.propEq('2', d[2]), inputData)))
let addGroups = R.pipe(
  R.groupBy(R.prop('1')), 
  R.map(R.count(R.identity))
)(addActiveList);

let wb = new Excel.Workbook()
await wb.xlsx.readFile('./assets/各单位6月导师活跃度.xlsx')
let sh1 = wb.worksheets[0];
let sh2 = wb.worksheets[1];
let sh3 = wb.worksheets[6];
let colNo = sh1.getColumn(2).values.slice(5, 5 + 14)
colNo.forEach((val, idx) => {
  let row = sh1.getRow(idx + 5);
  let data = result[val];
  row.getCell(3).value = data['peopleNum'];
  row.getCell(4).value = data['activeNum'];
  row.getCell(5).value = addGroups[val] ? addGroups[val] : 0;
  row.getCell(8).value = data['scoreLte10'];
  row.getCell(9).value = data['supervisorNum'];
  row.getCell(10).value = data['supervisorActiveNum'];
})
let numColNo = sh2.getColumn(2).values.slice(2, sh2.rowCount + 1)
numColNo.forEach((val, idx) => {
  let row = sh2.getRow(idx + 2);
  let data = R.find(R.propEq('2', val), personInfos);
  row.getCell(8).value = data['17'];
  row.getCell(9).value = data['18'] === 'y' ? '是' : '否';
})
sh3.getColumn(1).values = addActiveList.map(val => val[1] + val[3]);
await wb.xlsx.writeFile('./dist/active.xlsx');
