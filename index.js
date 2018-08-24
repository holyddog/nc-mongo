const express = require('express');
const app = express();
const path = require('path');
const routes = require('express').Router();

routes.get('/*', function (req, res) {
  	res.sendFile(path.join(__dirname + '/dist/index.html'));
});

app.use(express.static(path.join(__dirname, '/dist')));
app.use('/', routes);

app.listen(3207, function () {
  	console.log('App started on port 3207');
});