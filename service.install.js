var Service = require('node-windows').Service;

var svc = new Service({
    name: 'ECommerce NC Web',
    description: '',
    script: require('path').join(__dirname, 'index.js'),
    nodeOptions: []
});

svc.on('install', function() {
    svc.start();
});

svc.install();