/*
 * These routes are for the /view endpoints to control which machines are part of the system
 */
const routes = require('express').Router();
const ipList = require('../src/view');
const request = require('request');


function formatIPArr(ips) {
    let ipString = '';
    for (let i in ips) {
        ipString = ipString + ips[i] + ',';
    }
    return ipString.slice(0, -1);
}

function sendViewChangeToOthers(ipsToChange, method, newIP) {
    for (let i in ipsToChange) {
        let options = {
            url: "http://" + ipsToChange[i] + "/view",
            method: method,
            json: {
                "newChange": "false",
                "ip_port": newIP

            }
        };

        request(options);
    }
}

routes.route('/')
    .get(function (req, res) {
        let ips = ipList.get();
        const body = {
            //May need to be reformatted
            'view'  : formatIPArr(ips)
        };
        res.status(200).send(body);
    })
    .put(function (req, res) {
        const ip = req.body.ip_port || '';

        const newChange = req.body.newChange || "true";
        const oldIPList = ipList.getOtherIps();

        const result = ipList.put(ip);

        if (result) {
            if (newChange === "true") {
                sendViewChangeToOthers(oldIPList, "PUT", ip);
            }

            const body = {
                'result': 'Success',
                'msg'   : 'Successfully added ' + ip + ' to view'
            };
            res.status(200).send(body);
        }
        else {
            const body = {
                'result': 'Error',
                'msg'   : ip + ' is already in view',
            };
            res.status(404).send(body);
        }
    })
    .delete(function (req, res) {
        const ip = req.body.ip_port;
        const newChange = req.body.newChange || "true";
        console.log("removing " + ip);
        const result = ipList.delete(ip);
        const newIPList = ipList.getOtherIps();

        if (result) {
            if (newChange === "true") {
                sendViewChangeToOthers(newIPList, "DELETE", ip);
            }

            const body = {
                'result': 'Success',
                'msg'   : 'Successfully removed ' + ip + ' from view'
            };
            res.status(200).send(body);
        }
        else {
            const body = {
                'result': 'Error',
                'msg'   : ip + ' is not in current view'
            };
            res.status(404).send(body);
        }
    });

module.exports = routes;
