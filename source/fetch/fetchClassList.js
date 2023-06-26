const R = require('ramda');
const {writeFile} = require('node:fs');
const {argv} = require('node:process');

let cookie = argv[2];

console.log(cookie)

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
      "cookie": "",
      "Referer": "https://elearning.e-chinalife.com/console/library/teacher/audit/managementWorkGroup/formal",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  };
  let url = 'https://elearning.e-chinalife.com/api/training/implement?page=0&size=500&userGroupIds=98202&planYear=2023';
  let colName = {
    'id': 'ID',
    'name': '班级名称',
    'namePath': '所属组织',
    'startDate': '开始日期',
    'endDate': '结束日期',
    'displayName': '执行人',
    'regPersonNumber':'人数',
    'address':'培训地点',
    'isPublished':'是否发布',
    'isArchived':'是否结班'
  };
  
  let setCookie = R.assocPath(['headers', 'cookie']);
  
  let getPickInfo = R.map(r => {
    let temp = {};
    temp = R.pick(R.keys(colName))(r);
    temp.namePath = R.path(['userGroup', 'namePath'])(r);
    temp.displayName = R.path(['performer','displayName'])(r);
    temp['startDate'] = new Date(temp['startDate']);
    temp['endDate'] = new Date(temp['endDate']);
    temp['isPublished'] = temp['isPublished'] ? '是' : '否';
    temp['isArchived'] = temp['isArchived'] ? '是' : '否';
    return temp;
  });
  
  let transToChinese = R.map(r => {
    let temp = {};
    R.forEachObjIndexed((val, key) => temp[colName[key]] = val)(r);
    return temp;
  }
  );
  
  fetch(url, setCookie(cookie, options))
                  .then(res => res.json())
                  .then(R.prop('content'))
                  .then(getPickInfo)
                  .then(transToChinese)
                  .then(tran => {
                    writeFile('./data/classList.json', new Uint8Array(Buffer.from(JSON.stringify(tran))), err => {
                      if (err) throw err;
                      console.log('finished');
                    })
                  });  