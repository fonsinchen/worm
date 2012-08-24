
var driver = null;

var worm = {
    /**
     * Select things from the database.
     * @param table Main table to select from.
     * @param criteria A criteria object to narrow the query (or null to select
     *  everything).
     * @param descriptor Nested object that describes what to select from the main
     *  and possibly secondary tables and how to transform the result.
     * @param callback Will be called with (err, result) for each object constructed
     *  from a row of the main table.
     */
    "select" : function(table, criteria, descriptor, callback) {

    },

    "insert" : function(table, object, descriptor, callback) {

    },

    "update" : function(table, object, criteria, descriptor, callback) {

    },

    "delete" : function(table, criteria, descriptor, callback) {

    }
}

module.exports = function (driverName, options, callback) {
    if (arguments.length < 3) {
        callback = options;
        options = {};
    }

    try {
        require(require('path').join(__dirname, 'drivers', driverName))
                .connect(options, function(err, d) {
            if (err) return callback(err);
            driver = d;
            if (options.structure === undefined) {
                return require('db-meta').connect(driverName, {
                    connection : d.getConnection()
                }, function(err, meta) {
                    meta.collect(function(err, structure) {
                        if (err) return callback(err);
                        d.setStructure(structure);
                        return callback(worm);
                    });
                });
            } else {
                return callback(worm);
            }
        });
    } catch (e) {
        console.log(e);
        callback(new Error('Unsupported driver: ' + driverName));
    }
};

