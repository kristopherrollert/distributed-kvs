const app = require('express')();
const bodyParser = require('body-parser');

// local modules for routes
const kvs_routes = require('./routes/kvs');
const view_routes = require('./routes/view');
const system_routes = require('./routes/system');

// local modules for functions
const repair = require('./src/repair');
const view_functions = require('./src/view');

// parsing system information
const ipPort = process.env.IP_PORT || '';
const [my_ip, my_port] = ipPort.split(":");
console.log(ipPort);
const currentView = ("VIEW" in process.env) ? process.env.VIEW.split(',') : [];

// default encoding middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// setting routes
app.use('/view', view_routes);
app.use('/system', system_routes);
app.use('/keyValue-store', kvs_routes);

// system initialization code
view_functions.init(currentView, ipPort); // set all ips and my ip
setInterval(repair.gossip, 1000) // run gossip every 1000 ms

app.listen(port=8080, () => console.log(`Listening on port ${port}!`));
