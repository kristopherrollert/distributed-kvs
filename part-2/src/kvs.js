const sizeof = require('object-sizeof');

/*
 * Our Key Value Store
 * All functions return an array that includes the status code associated with
 * the executed action as well as another spot for data.
 *
 * TODO: double check that the sizeof works
 */
var dict = {};

function put(key, value) {
    if (key.length < 1 || key.length > 200)
        return [400, {
            msg: "Error",
            error: "Key not valid"
    }];
    else if (sizeof(value) > 1000000)
        return [413, {
            msg: "Object too large. Size limit is 1MB"
    }];
    else if (value.length < 1) {
        return [400, {
            msg: "Error",
            error: "Value is missing"
        }]
    }
    else if (key in dict) {
        dict[key] = value;
        return [201, {
            msg: "Updated successfully",
            replaced: 1
        }];
    }
    else {
        dict[key] = value;
        return [201, {
            msg: "Added successfully",
            replaced: 0
        }]
    }
}

function get(key) {
    if (key.length < 1 || key.length > 200)
        return [400, {msg: "Key not valid"}];
    else if (key in dict) {
        return [200, {
            msg: "Success",
            value: dict[key],
            isExist: 'true'
        }];
    }
    else {
        return [404, {
            msg: "Error",
            error: "Key does not exist",
            isExist: 'false'
        }];
    }
}

function del(key) {
    if (key in dict) {
        delete dict[key];
        return [200, {
            msg: "Success",
        }];
    }
    else {
        return [404, {
            msg: "Error",
            error: "Key does not exist"
        }]
    }
}

function check(key) {
    if (key.length < 1 || key.length > 200)
        return [400, {msg: "Key not valid"}];
    else if (key in dict) {
        return [200, {
            'result': 'True',
            'msg': 'Key Found'
        }];
    }
    else {
        return [404, {
            'result': 'False',
            'msg': 'Key not Found'
        }];
    }
}

function search(key) {
    if (key.length < 1 || key.length > 200)
        return [400, {msg: "Key not valid"}];
    else if (key in dict) {
        return [200, {
            'msg': 'Success',
            'isExist': 'true'
        }];
    }
    else {
        return [404, {
            'msg': 'Error',
            'isExist': 'false'
        }];
    }
}


module.exports.put = put;
module.exports.get = get;
module.exports.delete = del;
module.exports.check = check;
module.exports.search = search;
