const Excel = require("exceljs");
const R = require("ramda");
const { readFile } = require('node:fs/promises');
const { getWorkbook, getSourceData, rowsToArr } = require('./utils');

async function read() {
  const info = JSON.parse(await readFile('./info.json', { encoding: 'utf8' }));
  
  info.source = await getSourceData("./assets/源.xlsx", 0, /南宁/, 4).then(rowsToArr)
  info.reg = await getSourceData('简易版花名册（4月）.xlsx', 0).then(rowsToArr);

  return info;
}

function handle(info) {
  let { reg, source, lessonsList, channelList, groupList, levelList } = info;
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
  let stateFilter = (state, level) => {
    return R.filter(R.pipe(R.pathOr(0, [6, state]), R.lte(level)));
  }
  let groupFilter = group => R.filter(R.propEq(3, group));
  let countState = level => R.pipe(stateFilter('完成', level), R.count(R.identity));
  
  let totalStates = {};
  R.forEach(group => {
    let groupState = {};
    totalStates[group] = groupState;
    let groupChild = groupFilter(group)(reg);
    R.forEach(channel => {
      let channelState = {};
      groupState[channel] = channelState;
      let channelChild = R.filter(R.propEq(4, channel))(groupChild);
      R.forEach(level => {
        channelState[level] = countState(level)(channelChild);
      })(levelList);
      channelState['22'] = R.count(R.pathEq([5, '22.销售人员互联网营销宣传合规性要求'], '完成'), channelChild);
    })(channelList);
  })(groupList);
  return { reg, totalStates };
}

module.exports = {
  read,
  handle
}