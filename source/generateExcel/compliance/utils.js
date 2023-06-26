const Excel = require("exceljs");
const R = require("ramda");
const { readFile } = require('node:fs/promises');

async function getWorkbook(filename) {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(filename);
  return workbook;
}

async function getSourceData(filename, sheetIdx, cond, condCol) {
  let wb = await getWorkbook(filename);
  let sh = wb.worksheets[sheetIdx];
  let rowCount = sh.rowCount;
  const rows = sh.getRows(2, rowCount - 1);
  return cond ? rows.filter(r => cond.test(r.getCell(condCol)))
    : rows;

}

function rowsToArr(rows) {
  return rows.map(r => r.values);
}

exports.getWorkbook = getWorkbook;
exports.getSourceData = getSourceData;
exports.rowsToArr = rowsToArr;