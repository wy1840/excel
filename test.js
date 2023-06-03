const R = require('ramda')
const {readTestData} = require('./read')
const {groupByList, countState} = require('./handle')
const format = require('./formatText')
const {write} = require('./writeSheet');
async function run() {
    let {reg} = await readTestData()
    let grouped = groupByList([3, 4], reg)
    let counted = countState(grouped)
    console.log(counted);
    await format.readFormat(counted).then(format.write)
    await write(reg, counted);
}
run();