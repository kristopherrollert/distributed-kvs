/*
 * These routes are for the /view endpoints to control which machines are part of the system
 */
const routes = require('express').Router();
const request = require('request');

const shard = require('../src/shard');
const ipList = require('../src/view');

function formatIPArr(ips) {
    let ipString = '';
    for (let i in ips) {
        ipString = ipString + ips[i] + ',';
    }
    return ipString.slice(0, -1);
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

        const newLocation = shard.getNextNodeLocation();
        shard.putIP(newLocation, ip);


        if (result) {
            if (newChange === "true") {
                ipList.sendViewChangeToOthers(oldIPList, "PUT", ip);
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
        //TODO put shard rebalance code here
        const ip = req.body.ip_port;
        const newChange = req.body.newChange || "true";
        const result = ipList.delete(ip);
        const newIPList = ipList.getOtherIps();

        if (result) {
            if (newChange === "true") {
                ipList.sendViewChangeToOthers(newIPList, "DELETE", ip);

                shardList = shard.deleteIP(ip);
                if (shardList)
                    shard.sendShardListToAll();
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
