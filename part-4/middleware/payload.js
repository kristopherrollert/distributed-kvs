const vc = require('../src/vc');
const rag = require('../src/repair');
const kvs = require('../src/kvs');
const view = require('../src/view');
const shard = require('../src/shard');

// TODO: include payload in reject calls
// TODO: get repair set up
function middleware(req, res, next) {
    const key = req.params.key || '';
    const their_payload = JSON.parse(req.body.payload);
    const their_vc = their_payload['vc'] || vc.init();
    const their_timestamp = vc.timestamp();
    const our_payload = kvs.getPayload(key);
    const our_vc = our_payload.vc;
    const our_timestamp = our_payload.timestamp;
    let check = vc.compare(our_vc, their_vc);
    const method = req.method;


    console.log('Our VC is ' + check + ' to their VC');

    // compare timestamps, set check to either greater or less than
    if (check == 'CONCURRENT') {
        check = our_timestamp > their_timestamp ? 'GREATER' : 'LESSER';
        console.log('After comparing time stamps, our VC is ' + check + ' than their VC')
    }

    // run read repair asynchoronously & 'Error, payload too old'
    if (method == 'GET' && check == 'LESSER') {
        console.log('Our vc is too old, so fail and run read repair');
        let key_data = kvs.get(key)[1];
        console.log('VC', our_vc);
        var ragPromise = new Promise((resolve) => resolve(rag.repair(key, our_vc, view.getMyIP(), our_timestamp, key_data[0])));
        ragPromise.then(function(data) {
            if (!('error' in data)) {
                next();
            }
            else if (!(req.originalUrl.includes('search'))) {
                let failureResp = {
                    'result': 'Error',
                    'msg': 'Payload out of date',
                    'payload': kvs.getPayload(key)
                };
                res.status(400).send(failureResp);
            }
            else {
                next();
            }
        });
    }
    // ignore (TODO: include payload)
    else if ((method == 'PUT' || method == 'DELETE') && check == 'GREATER') {
        console.log('they are trying to put a value with an out of date payload');
        let failureResp = {
            'result': 'Error',
            'msg': 'Payload out of date',
            'payload': kvs.getPayload(key)
        };
        res.status(400).send(failureResp);
    }
    else {
        next()
    }

}

module.exports.middleware = middleware;
