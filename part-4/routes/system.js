// This folder is for functions only for use between nodes (no client usage)
const routes = require('express').Router();

const kvs = require('../src/kvs');
const view = require('../src/view');
const shard = require('../src/shard');
const system = require('../src/system');
const repair = require('../src/repair');

routes.get('/getKVS', function(req, res) {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7) + ':' + view.getMyPort();
    }
    if(shard.checkInShard(ip, shard.getMyShard()))
        res.send({'dict': kvs.getDict()});
    else
        res.send({"error": "BLOCKED - received from dead node"});
});

routes.get('/getEntry/:key', function(req, res) {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7) + ':' + view.getMyPort();
    }
    if(shard.checkInShard(ip, shard.getMyShard())) {
        const item = req.params.key || '';
        const entry = kvs.getDict()[item];
        if (!(entry))
            res.send({'error': 'key not found'});
        else
            res.send({'entry': entry});
    }
    else {
        res.send({'error': 'BLOCKED - received from dead node'});
    }
});


routes.put('/gossip', function(req, res) {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7) + ':8080';
    }
    if (shard.checkInShard(ip, shard.getMyShard())){
        repair.updateOurDict(req.body['dict']);
    }
    res.send({"error": "BLOCKED - received from dead node"});
});

routes.put('/updateEverything', function(req, res) {
    const shardList = req.body.shardList;
    const newDict = req.body.dict;
    const first = req.body.first;
    const numShards = req.body.numShards;

    kvs.updateDictionary(newDict);
    //TODO doesn't exist
    shard.updateShardList(shardList);

    res.send({msg: 'success'});

    system.updateEverything(shardList, newDict, numShards, first);
});

routes.put('/updateDictionary', function(req, res) {
    const newDict = req.body.dict;
    const first = req.body.first;
    kvs.updateDictionary(newDict);

    res.send({msg: 'success'});

    system.forwardDictionary(newDict, first);
});

routes.put('/updateShardLists', function(req, res) {
    system.sendToAllOtherNodes('/updateShardList', req.body, 'PUT', () => {});
    res.send({msg: 'success'});
});

routes.put('/updateShardList', function(req, res) {
    shardList = req.body.shardList;
    shard.updateShardList(shardList);
    res.send({msg: 'success'});
})

routes.put('/repair/:key', function(req, res) {
    const item = req.params.key || '';
    kvs.put(item, req.body['val'], req.body['vc'], req.body['timestamp']);
    res.send({});
});


module.exports = routes;
