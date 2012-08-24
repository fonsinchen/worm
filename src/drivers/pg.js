"use strict";

var pg = require('pg');

exports.connect = function (options, tables, callback) {
    var client = new pg.Client(options);
    client.connect(onConnect);
  
    function onConnect(err) {
        callback(err, new Driver(client, tables));
    }
};

function Driver(client, tables) {
  this.client = client;
  this.tables = tables;
}
