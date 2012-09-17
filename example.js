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

var worm = require('worm');
var t = worm.transform;
var driver = worm.driver('pg', {
    host : '/var/run/postgresql',
    database: 'kwarque'
});

var model = {
    // other possibilities:
    // - anonymous default schema: assign the description to 0
    // - no schema support: just assign single schema to model and drop additional layer (0 property will be undefined)
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
            },
            "lkeys" : {
                "alias234" : {
                    "schema" : "public",
                    "table" : "fragment",
                    "name" : "fragment_owner_fkey1"
                }
            }
        }
    }
};

worm.describe({
    id:1,
    xz: t.rename("x", t.transform(function(x) {return x + 1;}, function(x) {return x - 1;})),
    // chaining: ???
    // free form transformation: provide both ways to allow for either insert or retrieve
    yobj: t.bloat({// opposite of flatten: creates an object {y: val} as property yobj of parent
        y:1
    }),
    sum: "x + y", // String is interpreted as SQL expression.
    fragment_owner_fkey1 : t.flatten({ // flatten pushes all properties to parent object
        owner: t.rename('account'),    // rename changes name of property (original name is given as arg, so that same property can be rerefered to multiple times)
        fragments : t.many("alias234", { // many denounces one-to-many relationship where first argument gives qualified name of fkey; result is array of objects
            title:1,
            text:1
        }),
        related : t.enumerate("alias234", "id"), // enumerate is same as many, but only one attribute is retrieved and a flat array (without nested objects) is created
        x : t.one(), // maybe get first of many objects
        y : t.aggregate() // do sth with many objects, creating one
    })
}).bind(model, 'fragment').where("(x != 50) AND (x = y)").render(driver).insert(stuff); // INSERT and UPDATE will be interesting ...
/*.select(function(err, result) {
    if (err) {
        console.log(err);
    } else {
        console.log(result);
    }
});*/

/*
 * The basic principle has to be:
 * SELECT <column aliases> FROM <tables with joins> WHERE <where conditions> LIMIT <limit> OFFSET <offset>
 * 
 * DELETE <table aliases> FROM <tables with joins> WHERE <where conditions> LIMIT <limit> OFFSET <offset>
 * 
 * update can be done on multiple tables at once, but there is no mass update syntax, so ...
 * UPDATE <table> SET <column=val>* WHERE <pkey=val> for each object with pkey
 * Objects missing pkeys have to be ignored. We could use limit and offset clauses but that
 * would be pretty arbitrary.
 *
 * insert is the most limited statement wrt joins, but you can do mass inserts on one table:
 * INSERT INTO <table> (<columns>) VALUES (<vals>)* for each table
 * However, for tables where we need the pkeys from the DB we should insert line by line and
 * check for the keys afterwards.
 * 
 * limit, offset and even where don't make much sense for update and insert. We
 * might warn about that. (Where could be used to prefilter the objects before
 * even handing them to the DB; we can evaluate SQL expressions after all ...)
 * In the end we need:
 * - aliased column names for SELECT
 * - aliased table names without joins for DELETE
 * - joins with conditions for SELECT and DELETE
 * - where conditions for SELECT and DELETE
 * - column=val statemetns for UPDATE
 * - pkey=val statements for UPDATE
 * - column list for INSERT
 * - value list for INSERT
 */