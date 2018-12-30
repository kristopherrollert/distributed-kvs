const request = require('request');

const kvs = require('./kvs');
const view = require('./view');

let shardList;
let my_shard;

function get() {
    return Object.keys(shardList);
}

function init(ips, numShards) {
    shardList = {};
    let m = 0;
    ips.forEach((ip) => {
        if (view.getMyIP() == ip)
            my_shard = m;
        shardList[m] = (shardList[m] == undefined) ? [ip] : shardList[m].concat(ip);
        m = (m + 1) % numShards;
    });
}

function getNextNodeLocation() {
    let loc, minElements;
    Object.keys(shardList).forEach((id) => {
        if (!minElements || shardList[id].length < minElements) {
            loc = id;
            minElements = shardList[id].length;
        }
    });
    return loc;
}


function getMyShard() {
    return my_shard;
}

function updateShardList(newShardList) {
    shardList = newShardList;
    my_shard = parseInt(getShardForIP(view.getMyIP()));
}

function putIP(shard, ip) {
    if (shard in shardList && shardList[shard].includes(ip)) {
        return false;
    }
    else {
        shardList[shard].push(ip);
        return true;
    }
}

function getMembers(id){
    return shardList[id] || null;
}

function getShardList() {
    return shardList;
}

function getRandIP(shard) {
    let other_shards = [];
    if(shardList[shard].length > 1){
        other_shards = getOtherMembers(shard);
    }
    else{
        other_shards = shardList[shard];
    }
    let randNum = Math.floor(Math.random() * other_shards.length);
    return other_shards[randNum];
}

function getOtherMembers(shard) {
    let other_shards = shardList[shard].slice();
    other_shards.splice(other_shards.indexOf(view.getMyIP()), 1);
    return other_shards;
}

function printAll() {
    console.log(shardList);
}

function checkIn(shard) {
    return shardList.includes(shard);
}

function count(shard){
    if (shard in shardList) {
        let count = 0;
        for (let ip in shardList[shard]) {
            let getTheirKVSOptions = {
                url: "http://" + ip + "/system/getKVS",
                method: 'GET'
            };

            request(getTheirKVSOptions, function (err, res, body) {
                if (!err) count = updateCount(count, JSON.parse(body)['dict']);
            });
        }
        return count;
    }
    else {
        return null;
    }
}

function updateCount(count, new_dict) {
    return count + Object.keys(new_dict).length;
}

function numShards() {
    return Object.keys(shardList).length;
}

function getShardForIP(ip) {
    for (let shard in shardList) {
        if (shardList[shard].includes(ip))
            return shard;
    }
    return -1;
}

function deleteIP(ip) {
    let shard = getShardForIP(ip);
    shardList[shard].splice(shardList[shard].indexOf(ip), 1);
    if (shardList[shard].length < 2) {
        updateShardCount(numShards() - 1);
        return false;
    }
    else {
        return shardList;
    }
}

function sendShardListToAll() {
    for (let shard in shardList) {
        let theirIp = shardList[shard][0];
        request({
            url: 'http://' + theirIP + '/system/updateShardLists',
            method: 'PUT',
            json: {
                shardList: shardList,
            }
        });
    }
}

function updateShardCount(numShards) {
    init(view.get(), numShards);
    let splitDict = kvs.splitDictionary(numShards);

    for (let shard in shardList) {
        let theirIP = shardList[shard][0];
        request({
            url: "http://" + theirIP + '/system/updateEverything',
            method: "PUT",
            json: {
                dict: splitDict[shard],
                shardList: shardList,
                numShards: numShards,
                first: true
            }
        }, (err, res, body) => {
            for (let oldKey in splitDict[shard]) {
                kvs.removeKey(oldKey);
            }
        });
    }
}

function checkInShard(ip, shardNum) {
    return shardList[shardNum].includes(ip);
}

function getStringShardIds() {
    return Object.keys(shardList).join();
}

module.exports.get = get;
module.exports.init = init;
module.exports.putIP = putIP;
module.exports.count = count;
module.exports.checkIn = checkIn;
module.exports.deleteIP = deleteIP;
module.exports.printAll = printAll;
module.exports.getRandIP = getRandIP;
module.exports.numShards = numShards;
module.exports.numShards = numShards;
module.exports.getRandIP = getRandIP;
module.exports.getMembers = getMembers;
module.exports.getMyShard = getMyShard;
module.exports.getMyShard = getMyShard;
module.exports.getMembers = getMembers;
module.exports.checkInShard = checkInShard;
module.exports.getShardList = getShardList;
module.exports.getOtherMembers = getOtherMembers;
module.exports.updateShardList = updateShardList;
module.exports.updateShardCount = updateShardCount;
module.exports.getStringShardIds = getStringShardIds;
module.exports.sendShardListToAll = sendShardListToAll;
module.exports.getNextNodeLocation = getNextNodeLocation;
