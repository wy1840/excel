const R = require('ramda');
const Excel = require('exceljs');
const {argv} = require('node:process');

let outputFileName = './dist/acc.xlsx';

let cookie = argv[2];
let month = argv[3];

let checkKeys = ['offerName', 'userName', 'firstName', 'courseName', 'star', 'teachingPeriod', 'allowanceStandard', 'allowance'];

let withoutRead = (stream) =>
    // Respond with our stream
    new Response(stream, { headers: { 'Content-Type': 'application/json' } }).json()

let getContent = R.pipe(R.prop('body'), withoutRead, R.prop('content'));

let courseListUrl = "https://elearning.e-chinalife.com/api/teacher/audit/getManagementOfferCheckDetailsList?type=&courseName=&offerName=&userGroupId=98202&year=2023&month=" + month + "&flag=Y&size=50&page=0";

let allowanceUrl = offerId => "https://elearning.e-chinalife.com/api/teacher/audit/getManagementOfferTeacherCheckDetailsList?channel=&userName=&firstName=&type=&year=2023&month=" + month + "&flg=&offerId=" + offerId;

let options = {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Microsoft Edge\";v=\"114\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "username": "",
    "cookie": cookie,
    "Referer": "https://elearning.e-chinalife.com/console/library/teacher/audit/managementWorkGroup/formal",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
}

function write(filePath, data) {
  writeFile.writeFile(filePath, data, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
}

async function run() {
  let requestList = await fetch(courseListUrl, options)
                               .then(R.prop('body'))
                               .then(withoutRead)
                               .then(R.prop('content'))
                               .then(R.pluck('offerId'))
                               .then(courseIdList => courseIdList.map(id => fetch(allowanceUrl(id), options)
                                                      .then(R.prop('body'))
                                                      .then(withoutRead)
                                                      .then(R.prop('content'))
                                                      .then(R.project(checkKeys))));
  let allowanceList = await Promise.all(requestList).then(R.flatten);
  
  const wb = new Excel.Workbook();
  const sh = wb.addWorksheet('allowanceList');
  allowanceList.forEach(allowance => sh.addRow(R.values(allowance)));
  wb.xlsx.writeFile(outputFileName);
}

run();