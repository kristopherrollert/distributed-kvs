const routes = require('express').Router();

const vc = require('../src/vc');
const kvs = require('../src/kvs');
const view = require('../src/view');
const system = require('../src/system');
const pl = require('../middleware/payload');
const hashing = require('../middleware/hashing');

routes.use('/search/:key', hashing.middleware);
routes.use('/search/:key', pl.middleware);

routes.get('/search/:key', function (req, res) {
    // const shardId = JSON.parse(req.body.owner);
    const item = req.params.key || '';
    const [statusCode, data] = kvs.search(item);
    res.status(statusCode).send(data)
});

routes.use('/:key', hashing.middleware);
routes.use('/:key', pl.middleware);

routes.route('/:key')
    .get(function (req, res) {
        console.log('getting key')
        const key = req.params.key || '';
        let payload = JSON.parse(req.body.payload);
        // const shardId = JSON.parse(req.body.owner);
        const [statusCode, data] = kvs.get(key, payload);
        payload['vc'] = vc.increment(payload['vc'] || vc.init(), view.getMyIP());
        payload['timestamp'] = vc.timestamp();
        data['payload'] = payload;
        //TODO same as above, need to add shardId
        res.status(statusCode).send(data);
    })
    .put(function (req, res) {
        const key = req.params.key || '';
        const value = req.body.val || '';
        console.log('Putting key value:', key, value);
        let payload = JSON.parse(req.body.payload);
        let newVC = vc.increment(payload['vc'] || vc.init(), view.getMyIP());
        let timestamp = vc.timestamp();
        const [statusCode, data] = kvs.put(key, value, newVC, timestamp);
        res.status(statusCode).send(data);

        // send every other node the write
        const body = {
            val: value,
            payload: JSON.stringify({
                'vc' : newVC,
                'timestamp' : timestamp
            }),
            internal: true
        };
        if (!req.body.internal) {
            system.sendToAllOtherNodes("/keyValue-store/" + key, body, 'PUT', (err, res, body) => {
                if (err) console.log(err);
            });
        }

    })
    .delete(function (req, res) {
        const key = req.params.key || '';
        let payload = JSON.parse(req.body.payload);
        payload['vc'] = vc.increment(payload['vc'] || vc.init(), view.getMyIP());
        payload['timestamp'] = vc.timestamp();
        const [statusCode, data] = kvs.delete(key,
            vc.increment(payload['vc'] || vc.init(), view.getMyIP()),
            vc.timestamp());
        data['payload'] = payload;
        res.status(statusCode).send(data);

        const body = {
            payload: JSON.stringify({
                'vc' : payload['vc'],
                'timestamp' : ['timestamp']
            }),
            internal: true
        };
        if (!req.body.internal) {
            system.sendToAllOtherNodes("/keyValue-store/" + key, body, 'DELETE', (err, res, body) => {
                if (err) console.log(err);
            });
        }

    });

module.exports = routes;
