const {getWorkbook} = require('./utils');
const R = require('ramda');

async function write(reg, totalStates) {
    let dist = await getWorkbook("./assets/学习追踪表.xlsx");
    let distSheet = dist.worksheets[0];
    let nameCol = distSheet.getColumn(2);
    
    let groupRowList = nameCol.values.slice(6, 6 + 14)
    
    R.range(6, 6 + 14).forEach(rowNum => {
      let group = groupRowList[rowNum - 6];
      let row = distSheet.getRow(rowNum);
      let data = totalStates[group];
      row.getCell(11).value = R.pathOr(null, ['营销', 'peopleNum'], data);
      row.getCell(12).value = R.pathOr(null, ['营销', '22'], data);
      row.getCell(13).value = R.pathOr(null, ['营销', '20'], data);
      row.getCell(14).value = R.pathOr(null, ['营销', '33'], data)
      row.getCell(19).value = R.pathOr(null, ['收展', 'peopleNum'], data);
      row.getCell(20).value = R.pathOr(null, ['收展', '22'], data)
      row.getCell(21).value = R.pathOr(null, ['收展', '20'], data);
      row.getCell(22).value = R.pathOr(null, ['收展', '33'], data);
    });
    
    await dist.xlsx.writeFile("./dist/工作簿11.xlsx");
    
    let detail = await getWorkbook("./assets/明细.xlsx");
    let detailSh = detail.worksheets[0];
    
    let lessonsColNumList = detailSh.getRow(1).values.slice(5, 5 + 33);
    
    R.range(2, detailSh.rowCount + 1).forEach(rowNum => {
      let row = detailSh.getRow(rowNum);
      let name = row.getCell(1).value;
      let states = reg.find(r => r[1] === name)[5];
      R.forEachObjIndexed((lessonsName, colNum) => {
        colNum = Number(colNum) + 5;
        row.getCell(colNum).value = states[lessonsName];
      })(lessonsColNumList);
    });
    
    await detail.xlsx.writeFile("./dist/明细1.xlsx")
  }

  module.exports = {
    write
  }