const routes = require('express').Router();
// const http = require('http');
const request = require('request');

let mainIPFull = process.env.MAINIP;

routes.route('/')
    .get(function (req, res) {
        let options = {
            url: "http://" + mainIPFull + "/keyValue-store",
            method: 'GET'
        };

        request(options, function(err, fres, body) {
            res.status(fres.statusCode).send(body);
        })
    });

routes.get('/isKeyExists', function (req, res) {
    const item = req.body.item || '';
    let options = {
        url: "http://" + mainIPFull + "/keyValue-store/isKeyExists/" + item,
        method: 'GET'
    };

    request(options, function(err, fres, body) {
        res.status(fres.statusCode).send(body);
    })
});

routes.get('/getValue', function (req, res) {
    const item = req.body.item || '';
    let options = {
        url: "http://" + mainIPFull + "/keyValue-store/getValue" ,
        method: 'GET',
        json: {
            item: item
        }
    };

    request(options, function(err, fres, body) {
        res.status(fres.statusCode).send(body);
    })
});

routes.get('/search/:key', function(req, res) {
    const item = req.params.key || '';
    let options = {
        url: "http://" + mainIPFull + "/keyValue-store/search/" + item,
        method: 'GET'
    };

    request(options, function(err, fres, body) {
        res.status(fres.statusCode).send(body);
    });
});

routes.route('/:key')
    .get(function (req, res) {
        const key = req.params.key || '';
        let options = {
            url: "http://" + mainIPFull + "/keyValue-store/" + key,
            method: 'GET'
        };

        request(options, function(err, fres, body) {
            res.status(fres.statusCode).send(body);
        })

    })
    .put(function (req, res) {
        const key = req.params.key || '';
        const value = req.body.val || '';
        let options = {
            url: "http://" + mainIPFull + "/keyValue-store/" + key,
            method: 'PUT',
            json: {
                val: value
            }
        };

        request(options, function(err, fres, body) {
            res.status(fres.statusCode).send(body);
        })
    })
    .delete(function (req, res) {
        const key = req.params.key || '';
        let options = {
            url: "http://" + mainIPFull + "/keyValue-store/" + key,
            method: 'DELETE'
        };

        request(options, function(err, fres, body) {
            res.status(fres.statusCode).send(body);
        })
    });

module.exports = routes;
