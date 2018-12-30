const request = require('request');
const kvs = require('./kvs');
const vc = require('./vc');
const view = require('./view');


/*
 * Implements read repair and gossip
 */

function repairNodeMessage(options) {
    return new Promise((resolve, reject) => {
        var r = request(options, function (err, res, body) {
            if(typeof res !== 'undefined') {
                let bodyParsed = JSON.parse(body);
                if (!('error' in bodyParsed)) {
                    resolve(bodyParsed['entry']);
                    return;
                }
                else {
                    reject({'error': 'timeout'});
                }
                return;
            }
            resolve(false);
        });
        setTimeout(function () {
            r.abort();
            reject({'error': 'timeout'});
            return;
        }, 200);
    }).catch(function(error) {
        console.log(error);
    });
}


// pretend we have a view
// on send, increment vc from whatever node this is happening at
// assuming timestamps are date objects
// assuming nodes send writes to all other nodes on receive
// async function repair(key, vectorclock, ip, timestamp, value) {
function repair(key, vectorclock, ip, timestamp, value) {
    var maxValue = value;
    var maxTimestamp = timestamp;
    var maxVC = vectorclock;
    var answer;

    var views = view.get();

    var promises = [];

    console.log('IN Read Repair: beginning')

    views.forEach((node) => {
        let options = {
            url: "http://" + node + "/system/getEntry/" + key,
            method: 'GET',
            payload: kvs.getPayload(key)
        };

        promises.push(repairNodeMessage(options));
    });


    return Promise.all(promises).then(function(results) {
        for(index in results) {
            res = results[index];
            console.log('RES: ', res);
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
        console.log('MAXVC: ', maxVC);

        if (maxVC === vectorclock) {
            return {'error': 'did not update'};
        }
        else {
            let payload = JSON.stringify({
                "vc": maxVC,
                "timestamp": maxTimestamp
            });

            views.forEach((node) => {
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
            console.log('RAN READ REPAIR');
            return answer;
        }
    });
}

function gossip() {
    const ourDict = kvs.getDict();
    const friend = view.randIP();

    if (!friend) return;

    let startTheirGossipOptions = {
        url: "http://" + friend + "/system/gossip",
        method: 'PUT',
        json: {
            dict: ourDict
        }
    };

    request(startTheirGossipOptions, function (err, res, body) {
        if (err && err['code'] != 'ECONNREFUSED')
            console.log('Bad Error in repair.js', err);
    });

    let getTheirKVSOptions = {
        url: "http://" + friend + "/system/getKVS",
        method: 'GET'
    }

    request(getTheirKVSOptions, function (err, res, body) {
        if (!err) updateOurDict(JSON.parse(body)['dict']);
    });
}

function updateOurDict(their_dict) {
    var our_dict = kvs.getDict();
    for (key in their_dict) {
        let [their_value, their_vc, their_timestamp] = their_dict[key];
        if (!our_dict[key]) // if we don't even have their key
            our_dict[key] = their_dict[key]
        else {
            let [our_value, our_vc, our_timestamp] = our_dict[key];
            var check = vc.compare(our_vc, their_vc);
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
