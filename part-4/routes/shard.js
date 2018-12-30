const routes = require('express').Router();

const view = require('../src/view');
const shardList = require('../src/shard');

//get my shard id
routes.get('/my_id', function (req, res) {
    const id = shardList.getMyShard();
    const body = {
        'id': id
    };
    res.status(200).send(body);
});

//get list of all shards
routes.get('/all_ids', function (req, res) {
    const shards = shardList.get();
    const body = {
        'shard_ids': formatShardArr(shards),
        'result': 'Success'
    };
    res.status(200).send(body);
});

// get members of shard
routes.get('/members/:id', function (req, res) {
    const id = req.params.id;
    const members = shardList.getMembers(id);
    if (members) {
        const body = {
            'members': formatShardArr(members),
            'result': 'Success'
        };
        res.status(200).send(body);
    }
    else {
        const body = {
            'msg': `No shard with id ${id}`,
            'result': 'Error'
        };
        res.status(404).send(body);
    }
});

routes.get('/count/:id', function (req, res) {
    const id = req.params.id;
    const count = shardList.count(id);
    if (count) {
        const body = {
            'Count': count,
            'result': 'Success'
        };
        res.status(200).send(body);
    }
    else {
        const body = {
            'msg': `No shard with id ${id}`,
            'result': 'Error'
        };
        res.status(404).send(body);
    }
});

routes.put('/changeShardNumber', function (req, res) {
    const num = JSON.parse(req.body.num);
    const numNodes = view.get().length
    console.log('got this message')
    if (num <= 0) {
        const body = {
            "msg": "Must have at least one shard",
            "result": "Error"
        }
        res.status(400).send(body);
    }
    else if (num > numNodes) {
        const body = {
            "msg": `Not enough nodes for ${num} shards`,
            "result": "Error"
        }
        res.status(400).send(body);
    }
    else if ((num * 2) > numNodes) {
        const body = {
            "msg": `Not enough nodes. ${num} shards result in a nonfault tolerant shard`,
            "result": "Error"
        }
        res.status(400).send(body);
    }
    else {
        shardList.updateShardCount(num);
        const body = {
            "result": "Success",
            "shard_ids": shardList.getStringShardIds()
        }
        res.status(200).send(body);
    }

});

function formatShardArr(shards) {
    let shardString = '';
    for (let i in shards) {
        shardString = shardString + shards[i] + ',';
    }
    return shardString.slice(0, -1);
}

module.exports = routes;
