const R = require('ramda');

const countByPathLte = level => R.count(R.pipe(
    R.pathOr(0, [6, '完成']), R.lte(level)));
const countByPathEq = R.count(
    R.pathEq([5, '22.销售人员互联网营销宣传合规性要求'], '完成'));
const countByIdt = R.count(R.identity);

let groupByList = (propIndexs, input) => {
    let index = propIndexs[0];
    let r = R.groupBy(R.prop(index), input);
    if (propIndexs.length > 1) {
        R.keys(r).forEach(k => r[k] = groupByList(propIndexs.slice(1), r[k]));
    }
    return r;
};

let countState = input => {
    let result = Object.create(null);
    R.forEachObjIndexed((groupValue, group) => {
        let state = Object.create(null);
        result[group] = state;
        let peopleNum = 0;
        let finishedNum = 0;
        R.forEachObjIndexed((channelValue, channel) => {
            peopleNum += countByIdt(channelValue);
            state[channel] = Object.create(null);
            state[channel][20] = countByPathLte(20)(channelValue);
            state[channel][33] = countByPathLte(33)(channelValue);
            finishedNum += state[channel][33];
            state[channel]['22'] = countByPathEq(channelValue);
            state[channel]['peopleNum'] = countByIdt(channelValue);
        })(groupValue);
        state['peopleNum'] = peopleNum;
        state['finishedNum'] = finishedNum;
        state['percent'] = round(finishedNum/peopleNum*100, 1);
    })(input);
    let charts = R.sort(R.descend(R.prop(1)),R.toPairs(R.mapObjIndexed((value, key, obj) => value.percent)(result)))
    let finishedNum = R.sum(R.pluck('finishedNum', R.values(result)));
    let peopleNum = R.sum(R.pluck('peopleNum', R.values(result)));
    result['finishedNum'] = finishedNum;
    result['peopleNum'] = peopleNum;
    result['percent'] = round(finishedNum/peopleNum*100, 1);
    R.forEachObjIndexed((value, key) => {
        result['group' + key] = value[0];
        result['group' + key + '-percent'] = value[1];
    })(charts.slice(0,3));
    R.forEachObjIndexed((value, key) => {
        result['group' + String(Number(key) - 3)] = value[0];
    })(charts.slice(charts.length - 3, charts.length));
    let date = new Date();
    result['month'] = date.getMonth() + 1;
    result['day'] = date.getDate();
    return result;
};

function round(number, precision) {
    return Math.round(+number + 'e' + precision) / Math.pow(10, precision);
    //same as:
    //return Number(Math.round(+number + 'e' + precision) + 'e-' + precision);
}

module.exports = {
    groupByList,
    countState
}