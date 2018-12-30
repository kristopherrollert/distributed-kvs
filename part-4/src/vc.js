const view = require('./view');

//initialize vc
function init(){
    let vc = {};
    view.get().forEach((node) => vc[node] = 0);
    return vc;
}

//increment clock for a node
function increment(vc, node) {
    vc[node] = 1 + ((node in vc) ? vc[node] : 0);
    return vc;
}

// Vector Clock 1 is ${RETURN} to Vector Clock 2
function compare(vc1, vc2) {
    let status = 'EQUAL';
    for (let node of view.get()) {
        if (!(node in vc1)) vc1[node] = 0;
        if (!(node in vc2)) vc2[node] = 0;

        if (vc2[node] > vc1[node]) {
            if (status == 'GREATER')
                return 'CONCURRENT';
            status = 'LESSER';
        } else if (vc2[node] < vc1[node]) {
            if (status == 'LESSER')
                return 'CONCURRENT';
            else status = 'GREATER';
        }
    }
    return status;
}

//merge two clocks
function merge(vc1, vc2) {
    let newVC = {};

    for (let node in view.get()) {
        if (!node in vc1) vc1[node] = 0;
        if (!node in vc2) vc2[node] = 0;

        if (vc1[node] >= vc2[node])
            newVC[node] = vc1[node];
        else
            newVC[node] = vc2[node];
    }
    return newVC;
}

function timestamp() {
    return new Date().getTime() / 1000;
}

module.exports.init = init;
module.exports.merge = merge;
module.exports.compare = compare;
module.exports.increment = increment;
module.exports.timestamp = timestamp;
