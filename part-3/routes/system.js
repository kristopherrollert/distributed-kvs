// This folder is for functions only for use between nodes (no client usage)
const routes = require('express').Router();
const kvs = require('../src/kvs');
const repair = require('../src/repair');
const view = require('../src/view');

routes.get('/getKVS', function(req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7) + ':' + view.getMyPort();
    }
    if(view.checkIn(ip))
        res.send({'dict': kvs.getDict()});
    else
        res.send({"error": "BLOCKED - received from dead node"});
});

routes.get('/getEntry/:key', function(req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7) + ':' + view.getMyPort();
    }
    if(view.checkIn(ip)) {
        const item = req.params.key || '';
        const entry = kvs.getDict()[item];
        res.send({'entry': entry});
    }
    else
        res.send({"error": "BLOCKED - received from dead node"});
});

routes.put('/gossip', function(req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7) + ':8080';
    }
    if (view.checkIn(ip)){
        repair.updateOurDict(req.body['dict']);
    }
    res.send({"error": "BLOCKED - received from dead node"});
});

routes.put('/repair/:key', function(req, res) {
    const item = req.params.key || '';
    kvs.put(item, req.body['val'], req.body['vc'], req.body['timestamp']);
    res.send({});
});


module.exports = routes;
