const request = require('request');

const shard = require('../src/shard');
const system = require('../src/system');

/*
 * Implements hashing and routing to the correct nodes
 */

function middleware(req, res, next) {
    const key = req.params.key || '';
    const keyHash = system.keyHash(key, shard.numShards());

    if (keyHash != shard.getMyShard()) {
        let ip = shard.getRandIP(keyHash);
        request({
            url: "http://" + ip + req.originalUrl,
            method: req.method,
            json: {
                val: req.body.val,
                payload: req.body.payload
            }
        }, (err, res2, body) => {
            res.status(res2.statusCode).send(body);
        });
    }
    else {
        next();
    }
}


module.exports.middleware = middleware;
