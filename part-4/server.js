const app = require('express')();
const bodyParser = require('body-parser');

// local modules for routes
const kvs_routes = require('./routes/kvs');
const view_routes = require('./routes/view');
const system_routes = require('./routes/system');
const shard_routes = require('./routes/shard');

// local modules for functions
const repair = require('./src/repair');
const view_functions = require('./src/view');
const shard_functions = require('./src/shard');

// parsing system information
const ipPort = process.env.IP_PORT || '';
const [my_ip, my_port] = ipPort.split(":");
const currentView = ("VIEW" in process.env) ? process.env.VIEW.split(',') : [];
const numShards = process.env.S || '';

// default encoding middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// setting routes
app.use('/view', view_routes);
app.use('/system', system_routes);
app.use('/keyValue-store', kvs_routes);
app.use('/shard', shard_routes);

// system initialization code
view_functions.init(currentView, ipPort); // set all ips and my ip
shard_functions.init(currentView, numShards);
setInterval(repair.gossip, 2000); // run gossip every 1000 ms


app.listen(port=8080, () => console.log(`Listening on port ${port} and ip ${my_ip}!`));
