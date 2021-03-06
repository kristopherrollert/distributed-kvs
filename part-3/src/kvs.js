const sizeof = require('object-sizeof');
const vc = require('./vc')

/*
 * Our Key Value Store
 * All functions return an array that includes the status code associated with
 * the executed action as well as another spot for data.
 *
 */

/*
 * dict['demo-key'] = (value, payload, timestamp)
 */
var dict = {};

function put(key, value, vc, timestamp) {
    if (key.length < 1 || key.length > 200)
        return [400, {
            'msg': "Error",
            'error': "Key not valid",
            'payload': {'vc': vc, 'timestamp': timestamp}
    }];
    else if (sizeof(value) > 1000000)
        return [413, {
            'msg': "Object too large. Size limit is 1MB",
            'payload': {'vc': vc, 'timestamp': timestamp}
    }];
    else if (value.length < 1) {
        return [400, {
            'msg': "Error",
            'error': "Value is missing",
            'payload': {'vc': vc, 'timestamp': timestamp}
        }]
    }
    else if (key in dict) {
        dict[key] = [value, vc, timestamp];
        console.log(dict);
        return [201, {
            'msg': "Updated successfully",
            'replaced': true,
            'payload': {'vc': vc, 'timestamp': timestamp}
        }];
    }
    else {
        dict[key] = [value, vc, timestamp];
        console.log(dict);
        return [200, {
            'msg': "Added successfully",
            'replaced': false,
            'payload': {'vc': vc, 'timestamp': timestamp}
        }]
    }
}

function get(key, payload) {
    if (key.length < 1 || key.length > 200)
        return [400, {msg: "Key not valid"}];
    else if (key in dict && dict[key][0] != null) {
        return [200, {
            'result': "Success",
            'value': dict[key][0],
            'payload' : getPayload(key)
        }];
    }
    else {
        return [404, {
            'result': "Error",
            'msg': "Key does not exist",
            'payload': getPayload(key)
        }];
    }
}

function del(key, vc, timestamp) {
    if (key in dict) {
        dict[key] = [null, vc, timestamp];
        return [200, {
            'result': "Success",
            'msg'   : "Key deleted",
            'payload': {'vc': vc, 'timestamp': timestamp}
        }];
    }
    else {
        return [404, {
            'result': "Error",
            'msg': "Key does not exist",
            'payload': {'vc': vc, 'timestamp': timestamp}
        }]
    }
}


function search(key) {
    if (key.length < 1 || key.length > 200)
        return [400, {msg: "Key not valid"}];
    else if (key in dict && dict[key][0] != null) {
        return [200, {
            'result'  : 'Success',
            'isExists' : true,
            'payload' : getPayload(key)
        }];
    }
    else {
        return [200, {
            'result': 'Success',
            'isExists': false,
            'payload' : getPayload(key)
        }];
    }
}

function getPayload(key) {
    if (key in dict)
        return {'vc' : dict[key][1], 'timestamp': dict[key][2]}
    else
        return {'vc': vc.init(), 'timestamp': 0}
}

function setPayload(key, vc, timestamp) {
    if (key in dict)
        dict[key] = [dict[key][0], vc, timestamp];
}

function getDict() {
    return dict;
}

function setDict(newDict) {
    dict = newDict;
}

module.exports.put = put;
module.exports.get = get;
module.exports.delete = del;
module.exports.search = search;
module.exports.getDict = getDict;
module.exports.setDict = setDict;
module.exports.setPayload = setPayload;
module.exports.getPayload = getPayload;
