
/**
 * Connect to a database, specifying the type (pg, mysql, ...), some options to
 * pass on to the DB connect method and a specification of the tables to map.
 * We need to know which fields and above all which foreign keys they have so
 * that we can figure out how to join them.
 */
module.exports = function(driverName, options, tables, callback) {
    var path = require('path');

    try {
        var driverPath = path.join(__dirname, 'drivers', driverName);
        var driver = require(driverPath);
        driver.connect(options, tables, callback);
    } catch (e) {
        console.log(e);
        callback(new Error('Unsupported driver: ' + driverName));
    }
};
