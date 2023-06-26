const Excel = require("exceljs");
const R = require("ramda");
const { getSourceData, rowsToArr } = require('D:/text/vtcode/ejs/nodeAction/excel/source/generateExcel/compliance/utils');
const { resolve } = require('node:path');
const { writeFile, readFile } = require('node:fs/promises');

async function readData() {
  let inputData = await readFile(resolve("D:/text/vtcode/ejs/nodeAction/excel/data/data.json"), { encoding: 'utf8' })
    .then(JSON.parse)
    .then(R.prop('personInfos'));
  return inputData;
}

async function readScores() {
  let data = await getSourceData('D:/text/vtcode/ejs/nodeAction/excel/assets/讲师课时积分明细.xlsx', 0);
  let scores = R.pipe(
    rowsToArr,
    R.project([2, 14]),
    R.groupBy(R.prop('2')),
    R.mapObjIndexed(val => R.sum(R.pluck('14')(val)))
  )(data);
  return scores;
}

async function readPersonInfo(scores) {
  let data = await getSourceData('D:/text/vtcode/ejs/nodeAction/excel/assets/各单位6月导师活跃度.xlsx', 1);
  let personInfos = R.pipe(
    rowsToArr,
    R.project([1, 2, 3, 6, 10]),
    R.map(info => {
      let score = scores[info[2]];
      info['17'] = score ? score : 0;
      info['18'] = Number(info['17']) >= 15 ? "y" : "n";
      return info;
    })
  )(data);
  return personInfos;
}

function total(personInfos) {
  let groupByG = R.pipe(
    R.groupBy(R.prop('1')),
    R.map(R.reject(R.isNil))
  )(personInfos);
  let byActive = R.propEq('18', 'y');
  let byScoreLte10 = R.propEq('17', 10);
  let bySupervisor = R.pipe(R.prop('10'), R.test(/主管/));
  let result = R.map(val => {
    let total = Object.create(null);
    total['peopleNum'] = val.length;
    total['activeNum'] = R.count(byActive)(val);
    total['scoreLte10'] = R.count(byScoreLte10)(val);
    total['supervisorNum'] = R.count(bySupervisor)(val);
    total['supervisorActiveNum'] = R.pipe(R.filter(bySupervisor), R.count(byActive))(val);
    return total;
  })(groupByG);
  return result;
}


function getDiff(personInfos, inputData) {
  let diffData = R.difference(personInfos, inputData)
  let addActiveList = diffData.filter(d => d['18'] === 'y' && R.propEq('18', 'n')(R.find(R.propEq('2', d[2]), inputData)))
  let addGroups = R.pipe(
    R.groupBy(R.prop('1')), 
    R.map(R.count(R.identity))
  )(addActiveList);
  return { addGroups, addActiveList}
}

async function copySheet(sourceFilePath, sourceSheetIdx, targetSheet) {
  let wb = new Excel.Workbook();
  await wb.xlsx.readFile(sourceFilePath);
  let sh = wb.worksheets[sourceSheetIdx];
  let rows = sh.getRows(0, sh.rowCount + 1);
  rows.forEach((row, idx) => 
                  row.values.forEach(
                    (val, colIdx) => targetSheet.getRow(idx).getCell(colIdx).value = val));
}

async function writeExcel(result, addGroups, personInfos, addActiveList) {
  let wb = new Excel.Workbook()
  await wb.xlsx.readFile('D:/text/vtcode/ejs/nodeAction/excel/assets/各单位6月导师活跃度.xlsx')
  let sh1 = wb.worksheets[0];
  let sh2 = wb.worksheets[1];
  let sh3 = wb.worksheets[4];
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
  await copySheet('D:/text/vtcode/ejs/nodeAction/excel/assets/讲师课时积分明细.xlsx', 0, wb.worksheets[2]);
  await copySheet('D:/text/vtcode/ejs/nodeAction/excel/assets/讲师积分汇总.xlsx', 0, wb.worksheets[3]);
  await wb.xlsx.writeFile('D:/text/vtcode/ejs/nodeAction/excel/dist/active.xlsx');
}


async function run() {
  let previowData = await readData();
  let scores = await readScores();
  let personInfos = await readPersonInfo(scores);
  let result = total(personInfos);
  await writeFile(resolve('D:/text/vtcode/ejs/nodeAction/excel/data/data.json'), new Uint8Array(Buffer.from(JSON.stringify({ personInfos }))));
  let { addActiveList, addGroups } = getDiff(personInfos, previowData);
  await writeFile(resolve('D:/text/vtcode/ejs/nodeAction/excel/data/previous.txt'), new Uint8Array(Buffer.from(addActiveList.map(R.pipe(R.props([1,3]), R.join(''))).join('\n')))); 
  await writeExcel(result, addGroups, personInfos, addActiveList);
}

run();