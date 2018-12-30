const express = require('express');
const app = express();
const kvs = require('./routes/kvs');
const forward = require('./routes/forward');
const bodyParser = require('body-parser');
const port = 8080;

let mainIP = process.env.MAINIP;

//TODO rename /keyValue-store

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

if (!("MAINIP" in process.env)) {
    // connects all routes from the ./routes folder for a kvs
    app.use('/keyValue-store', kvs)
}
else {
    // connects routes from ./routes folder for the forwarder
    app.use('/keyValue-store', forward)
}

// starts the server
app.listen(port, () => console.log(`Listening on port ${port}!`));
