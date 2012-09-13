/*console.log('(x < ? AND y > ?) OR id = ?');
var result = (require('../sqlexpr.js').parse('(x < ? AND y > ?) OR id = ?'));

var log = function(r, ind) {
    var indent = '';
    for (var i = 0; i < ind; ++i) indent += ' ';
    if (typeof r === 'object') {
        if (r instanceof Array) {
            if (r.length === 0) {
                console.log(indent + '[]');
            } else {
                console.log(indent + '[');
                for (i = 0; i < r.length; ++i) log(r[i], ind + 1);
                console.log(indent + ']');
            }
        } else {
            console.log(indent + '{');
            for (i in r) {
                if (r.hasOwnProperty(i)) {
                    console.log(indent + i + ':');
                    log(r[i], ind + 1);
                }
            }
            console.log(indent + '}');
        }
    } else {
        console.log(indent + r);
    }
}*/

require('worm')('pg', {
    host : '/var/run/postgresql',
    database: 'kwarque',
    structure: {
        // other possibilities:
        // - anonymous default schema: assign the description to 0
        // - no schema support: just assign single schema to structure and drop additional layer (0 property will be undefined)
        // - no default schema: leave out the 0
        // point is: there cannot be any schema called 0 in the DB as they have to have string names...
        0 : "public",
        "public" : {
            "fragment" : {
                "columns" : {
                    "id" : {
                        "type" : 'INTEGER',
                        "pkey" : true
                    },
                    "x" : 'INTEGER',
                    "y" : 'INTEGER',
                    "title": {
                        "type" : 'VARCHAR',
                        "length" : 63
                    },
                    "text" : 'TEXT',
                    "time" : 'TIMESTAMP',
                    "updated" : 'TIMESTAMP',
                    "owner" : {
                        "type": 'VARCHAR',
                        "length": 63
                    }
                },
                "fkeys" : {
                    "fragment_owner_fkey1" : { 
                        "columns" : [ 'owner' ],
                        "foreign_schema" : 'public',
                        "foreign_table" : 'account',
                        "foreign_columns" : [ 'nick' ]
                    }
                }
            },
            "account" : {
                "columns" : {
                    "id": {
                        "type": 'INTEGER',
                        "pkey": true
                    },
                    "nick" : {
                        "type": 'VARCHAR',
                        "length": 63
                    },
                    "password" : {
                        "type" : 'VARCHAR',
                        "length" : 63
                    }
                }
            }
        }
    }
}, function(err, worm) {
    if (err) {
        console.log(err)
    } else {
        worm('fragment', {
            id:1,
            xz: worm.rename("x", worm.transform(function(x) {return x + 1;}, function(x) {return x - 1;})),
            // chaining: ???
            // free form transformation: provide both ways to allow for either insert or retrieve
            yobj: worm.bloat({// opposite of flatten: creates an object {y: val} as property yobj of parent
                y:1
            }),
            sum: "x + y", // String is interpreted as SQL expression.
            fragment_owner_fkey1 : worm.flatten({ // flatten pushes all properties to parent object
                owner: worm.rename('account'),    // rename changes name of property (original name is given as arg, so that same property can be rerefered to multiple times)
                fragments : worm.many("fragment.fragment_owner_fkey1", { // many denounces one-to-many relationship where first argument gives qualified name of fkey; result is array of objects
                    title:1,
                    text:1
                }),
                related : worm.enumerate(["fragment", "fragment_owner_fkey1"], "id"), // enumerate is same as many, but only one attribute is retrieved and a flat array (without nested objects) is created
                x : worm.one(), // maybe get first of many objects
                y : worm.aggregate() // do sth with many objects, creating one
            })
        }).where("(x != 50) AND (x = y)").select(function(err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log(result);
            }
        });
    }
})
