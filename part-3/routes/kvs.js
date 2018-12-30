const routes = require('express').Router();
const kvs = require('../src/kvs');
const pl = require('../middleware/payload');
const vc = require('../src/vc');
const view = require('../src/view');

routes.use('/search/:key', pl.middleware);

routes.get('/search/:key', function(req, res) {
    const key = req.params.key || '';
    var payload = JSON.parse(req.body.payload);
    const [statusCode, data] = kvs.search(key);
    if (data['isExists'])
        payload['vc'] = vc.increment(payload['vc'] || vc.init(), view.getMyIP());
    else
        payload['vc'] = vc.init()
    payload['timestamp'] = vc.timestamp();
    data['payload'] = payload;

    kvs.setPayload(key, payload['vc'], payload['timestamp']);
    res.status(statusCode).send(data)
});

routes.use('/:key', pl.middleware);

routes.route('/:key')
    .get(function (req, res) {
        const key = req.params.key || '';
        var payload = JSON.parse(req.body.payload);
        const [statusCode, data] = kvs.get(key, payload);
        payload['vc'] = vc.increment(payload['vc'] || vc.init(), view.getMyIP());
        payload['timestamp'] = vc.timestamp();
        data['payload'] = payload;
        kvs.setPayload(key, payload['vc'], payload['timestamp']);
        res.status(statusCode).send(data);
    })
    .put(function (req, res) {
        const key = req.params.key || '';
        const value = req.body.val || '';
        console.log('Putting key value:', key, value);
        var payload = JSON.parse(req.body.payload);
        var newVC = vc.increment(payload['vc'] || vc.init(), view.getMyIP());
        var timestamp = vc.timestamp();
        if (!req.body.internal)
            newVC = vc.increment(newVC, view.getMyIP());

        const [statusCode, data] = kvs.put(key, value, newVC, timestamp);
        res.status(statusCode).send(data);

        if (!req.body.internal) {
            // send every other node the write
            const body = {
                val: value,
                payload: JSON.stringify({
                    'vc' : newVC,
                    'timestamp' : timestamp
                }),
                internal: true
            };

            view.sendToAllOtherNodes("/keyValue-store/" + key, body, 'PUT', (err, res, body, ip) => {
                if (err)
                    console.log(err);
            });
        }
    })
    .delete(function (req, res) {
        const key = req.params.key || '';
        var payload = JSON.parse(req.body.payload);
        var newVC = vc.increment(payload['vc'] || vc.init(), view.getMyIP());
        var timestamp = vc.timestamp();
        const [statusCode, data] = kvs.delete(key, newVC, vc.timestamp());
        res.status(statusCode).send(data);

        if (!req.body.internal) {
            let updateVC = vc.increment(newVC, view.getMyIP());
            kvs.setPayload(key, updateVC, timestamp);
            // send every other node the write
            const body = {
                payload: JSON.stringify({
                    'vc' : updateVC,
                    'timestamp' : timestamp
                }),
                internal: true
            };

            view.sendToAllOtherNodes("/keyValue-store/" + key, body, 'DELETE', (err, res, body, ip) => {
                if (err)
                    console.log(err);
            });
        }

    });

module.exports = routes;
