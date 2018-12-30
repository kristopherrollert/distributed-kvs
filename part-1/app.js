const express = require('express')
const app = express()
const port = 8080

app.route('/hello')
    .get(function (req, res) {
        res.send('Hello world!')
    })
    .post(function (req, res) {
        res.status(405).send('Method Not Allowed')
    })

app.route('/test')
    .get(function (req, res) {
        res.send('GET request received')
    })
    .post(function (req, res) {
        res.send('POST message received: ' + req.query.msg)
    })

app.listen(port, () => console.log(`Listening on port ${port}!`))
