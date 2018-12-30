const request = require('request');
const kvs = require('./kvs');
const vc = require('./vc');
const view = require('./view');
const shard = require('./shard');


/*
 * Implements read repair and gossip
 */

function repairNodeMessage(options) {
    return new Promise((resolve, reject) => {
        let r = request(options, function (err, res, body) {
            if (typeof res !== 'undefined' && !(body['error'])) {
                let body2 = JSON.parse(body);
                if (!('error' in body2)) {
                    resolve(body2['entry']);
                    return;
                }
                else {
                    reject({'error': 'rejected'});
                    return;
                }
            }
            resolve(false);
        });
        setTimeout(function () {
            r.abort();
            reject({'error': 'timeout'});
            return;
        }, 200);
    });
}


// pretend we have a view
// on send, increment vc from whatever node this is happening at
// assuming timestamps are date objects
// assuming nodes send writes to all other nodes on receive
// async function repair(key, vectorclock, ip, timestamp, value) {
function repair(key, vectorclock, ip, timestamp, value) {
    let maxValue = value;
    let maxTimestamp = timestamp;
    let maxVC = vectorclock;
    let answer;

    // var views = view.get();

    let promises = [];

    let otherIps = shard.getMembers(shard.getMyShard());

    otherIps.forEach((node) => {
        let options = {
            url: "http://" + node + "/system/getEntry/" + key,
            method: 'GET',
            payload: kvs.getPayload(key)
        };

        promises.push(repairNodeMessage(options));
    });


    return Promise.all(promises).then(function(results) {
        for (let index in results) {
            let res = results[index];
            if (res && !('error' in res)) {
                let check = vc.compare(maxVC, res[1]);
                if (check == 'LESSER') {
                    maxVC = res[1];
                    maxValue = res[0];
                    maxTimestamp = res[2];
                }
                else if (check == 'CONCURRENT') {
                    if (res[2] > maxTimestamp) {
                        maxVC = vc.merge(maxVC, res[1]);
                        maxValue = res[0];
                        maxTimestamp = res[2];
                    }
                }
            }
        }

        if (maxVC === vectorclock) {
            return {'error': 'did not update'};
        }

        let payload = JSON.stringify({
            "vc": maxVC,
            "timestamp": maxTimestamp
        });

        otherIps.forEach((node) => {
            if (node == ip) {
                kvs.put(key, maxValue, maxVC, maxTimestamp);
            }
            else {
                let options = {
                    url: "http://" + node + "/system/repair/" + key,
                    method: 'PUT',
                    json: {
                        val: maxValue,
                        vc: maxVC,
                        timestamp: maxTimestamp
                    }
                };

                request(options);
            }
        });
        answer = {
            'statusCode': 200,
            'results': {
                'maxValue': maxValue,
                'payload': payload
            }
        };

        return answer;
    }).catch(function(error) {
        console.log("Promise Rejected!!");
        console.log(error);
        return {'error': 'Promise Rejected in repair.js!'};
    });
}

function gossip() {
    const ourDict = kvs.getDict();
    const friend = shard.getRandIP(shard.getMyShard());

    if (!friend) return;

    let startTheirGossipOptions = {
        url: "http://" + friend + "/system/gossip",
        method: 'PUT',
        json: {
            dict: ourDict
        }
    };



    request(startTheirGossipOptions, function (err, res, body) {
        if (err && err['code'] !== 'ECONNREFUSED')
            console.log('Bad Error in repair.js', err);
    });

    let getTheirKVSOptions = {
        url: "http://" + friend + "/system/getKVS",
        method: 'GET'
    };

    request(getTheirKVSOptions, function (err, res, body) {
        if (!err) updateOurDict(JSON.parse(body)['dict']);
    });
}

function updateOurDict(their_dict) {
    let our_dict = kvs.getDict();
    for (let key in their_dict) {
        let [their_value, their_vc, their_timestamp] = their_dict[key];
        if (!our_dict[key]) // if we don't even have their key
            our_dict[key] = their_dict[key]
        else {
            let [our_value, our_vc, our_timestamp] = our_dict[key];
            let check = vc.compare(our_vc, their_vc);
            if (check == 'LESSER' || (check == 'CONCURRENT' && our_timestamp < their_timestamp)) {
                our_dict[key] = their_dict[key]
            }
        }
    }

    kvs.setDict(our_dict); // may be unneeded
}

module.exports.repair = repair;
module.exports.gossip = gossip;
module.exports.updateOurDict = updateOurDict;
