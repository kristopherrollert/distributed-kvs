const routes = require('express').Router();
const kvs = require('../src/kvs.js');

routes.route('/')
    .get(function (req, res) {
        res.send('GET empty received');
    });

routes.get('/isKeyExists', function (req, res) {
    const item = req.body.item || '';
    const [statusCode, data] = kvs.check(item);
    res.status(statusCode).send(data)
});

routes.get('/getValue', function (req, res) {
    const item = req.body.item || '';
    const [statusCode, data] = kvs.get(item);
    res.status(statusCode).send(data)
});

routes.get('/search/:key', function(req, res) {
    const item = req.params.key || '';
    const [statusCode, data] = kvs.search(item);
    res.status(statusCode).send(data)
})

routes.route('/:key')
    .get(function (req, res) {
        const key = req.params.key || '';
        const [statusCode, data] = kvs.get(key);
        res.status(statusCode).send(data);
    })
    .put(function (req, res) {
        const key = req.params.key || '';
        const value = req.body.val || '';
        const [statusCode, data] = kvs.put(key, value);
        res.status(statusCode).send(data);
    })
    .delete(function (req, res) {
        const key = req.params.key || '';
        const [statusCode, data] = kvs.delete(key);
        res.status(statusCode).send(data)
    });

module.exports = routes;
