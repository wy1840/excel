const Excel = require("exceljs");
const R = require("ramda");
const { writeFile } = require('node:fs')
const { Buffer } = require('node:buffer');
const { getWorkbook, getSourceData, rowsToArr } = require('./utils');

async function run() {
  let source = await getSourceData("./assets/源.xlsx", 0, /南宁/, 4).then(rowsToArr)
  let reg = await getSourceData('./assets/简易版花名册.xlsx', 0).then(rowsToArr)
  let lessonsList = R.dropRepeats(R.pluck(5)(source).sort());
  let groupList = R.dropRepeats(R.pluck(3)(reg).sort());
  let levelList = [1, 10, 33];
  let channelList = ['营销', '收展'];
  
  let result = {}
  result['groupList'] = groupList;
  result['lessonsList'] = lessonsList;
  result['levelList'] = levelList;
  result['channelList'] = channelList;
  
  JSON.stringify(result);
  
  const inputData = new Uint8Array(Buffer.from(JSON.stringify(result)));
  writeFile('info.json', inputData, (err) => {
    if (err) throw err;
    console.log('The file has been saved');
  });
}

run();
