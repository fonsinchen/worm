
if (typeof Object.create !== 'function') {
    Object.create = function (obj) {
        var F = function() {};
        F.prototype = obj;
        return new F();
    };
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

            // TODO: use Object.create and add the driver and the structure to it
            var structure;
            var worm = function(table, descriptor) {
                return {
                    where : function() {return this;},
                    limit : function() {return this;},
                    order : function() {return this;},
                    select : function() {},
                    insert : function() {},
                    update : function() {},
                    "delete" : function() {}
                }
            };

            if (options.structure === undefined) {
                return require('db-meta').connect(driverName, {
                    connection : d.getConnection()
                }, function(err, meta) {
                    meta.collect(function(err, s) {
                        if (err) return callback(err);
                        structure = s;
                        return callback(worm);
                    });
                });
            } else {
                structure = options.structure;
                return callback(worm);
            }
        });
    } catch (e) {
        console.log(e);
        callback(new Error('Unsupported driver: ' + driverName));
    }
};

