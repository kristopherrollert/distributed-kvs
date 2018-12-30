const crypto = require('crypto');
const request = require('request');

const shard = require('./shard');
const kvs = require('./kvs');

function keyHash(key, numShards) {
    let hash = crypto.createHash('MD4').update(key).digest('hex');
    return parseInt(hash, 16) % numShards;
}

function sendToAllOtherNodes(route, body, method, callback) {
    let view = shard.getOtherMembers(shard.getMyShard());
    for (let index in view) {
        let ip = view[index];

        let options = {
            url: "http://" + ip + route,
            method: method,
            json: body
        };

        request(options, (err, res, body) => callback(err, res, body));

    }
}

function appendDictionary(origDict, newDict) {
    for (let key in newDict) {
        origDict[key] = newDict[key];
    }
    return origDict;
}

function updateEverything(shardList, newDict, numShards, first) {
    // This section should be sending the dict I received from the master node to all other nodes, so I do not need to do it again after the first time
    if (first) {
        let body = {
            shardList: shardList,
            dict: newDict,
            first: false
        };
        sendToAllOtherNodes('/system/updateEverything', body, 'PUT', () => {});
        // next should become delete my keys eventually I think
        // maybe not though because this should be sending the keys within my own shard
    }
    // This section should be splitting my own dictionary and sending those keys to everyone else.
    else {
        let splitDict = kvs.splitDictionary(numShards);
        shardList = shard.getShardList();

        for (let shard in shardList) {
            let theirIP = shardList[shard][0];
            request({
                url: 'http://' + theirIP + 'system/updateDictionary',
                method: 'PUT',
                json: {
                    dict: splitDict[shard],
                    first: true
                }
            }, (err, res, body) => {
                for (let oldKey in splitDict[shard]) {
                    kvs.removeKey(oldKey);
                }
            });
        }
    }
}

function forwardDictionary(newDict, first) {
    if (first) {
        let body = {
            dict: newDict,
            first: false
        };
        sendToAllOtherNodes('/system/updateDictionary', body, 'PUT', () => {});
        // same here, I think next needs to be something but idk what
    }
}

module.exports.keyHash = keyHash;
module.exports.appendDictionary = appendDictionary;
module.exports.updateEverything = updateEverything;
module.exports.forwardDictionary = forwardDictionary;
module.exports.sendToAllOtherNodes = sendToAllOtherNodes;
