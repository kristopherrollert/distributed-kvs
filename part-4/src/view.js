const request = require('request');

var ipList = [];
var my_ip;

function get() {
    return ipList;
}

function init(ips, ip) {
    ipList = ips;
    my_ip = ip;
}

function getMyIP() {
    return my_ip;
}

function getMyPort() {
    return my_ip.split(':')[1];
}

function put(ip) {
    if (ipList.includes(ip)) {
        return false;
    }
    else {
        ipList.push(ip);
        return true;
    }
}

function del(ip) {
    if (ipList.includes(ip)) {
        ipList.splice(ipList.indexOf(ip), 1);
        return true;
    }
    else {
        return false;
    }
}

function randIP() {
    let other_ips = getOtherIps();
    let randNum = Math.floor(Math.random() * other_ips.length);
    return other_ips[randNum];
}

function getOtherIps() {
    let other_ips = ipList.slice();
    other_ips.splice(other_ips.indexOf(my_ip), 1);
    return other_ips;
}

function printAll() {
    console.log(ipList);
}

function checkIn(ip) {
    return ipList.includes(ip);
}


// assumes callback takes err, res, body
function sendToAllOtherNodes(route, body, method, callback) {
    let view = get();
    for (index in view) {
        let ip = view[index];
        if (ip == getMyIP())
            continue;
        else {
            request({
                url: "http://" + ip + route,
                method: method,
                json: body
            }, (err, res, body) => callback(err, res, body));
        }
    }
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


module.exports.get = get;
module.exports.put = put;
module.exports.init = init;
module.exports.delete = del;
module.exports.randIP = randIP;
module.exports.getMyIP = getMyIP;
module.exports.checkIn = checkIn;
module.exports.printAll = printAll;
module.exports.getMyPort = getMyPort;
module.exports.getOtherIps = getOtherIps;
module.exports.sendToAllOtherNodes = sendToAllOtherNodes;
module.exports.sendViewChangeToOthers = sendViewChangeToOthers;
