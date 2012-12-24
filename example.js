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

var model = {
    '' : "public",
    "public" : {
        "fragment" : {
            "columns" : {
                "id" : {
                    "type" : 'INTEGER',
                    "pkey" : true,
                    "auto" : true // automatically generated, don't try to insert or update
                },
                "x" : 'INTEGER',
                "y" : 'INTEGER',
                "title": {
                    "type" : 'VARCHAR',
                    "length" : 63,
                    "default" : "sometitle"
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
                    "local" : [ 'owner' ],
                    "schema" : 'public',
                    "table" : 'account',
                    "foreign" : [ 'nick' ]
                }
            }
        },
        "account" : {
            "columns" : {
                "id": {
                    "type": 'INTEGER',
                    "pkey": true,
                    "auto": true
                },
                "nick" : {
                    "type": 'VARCHAR',
                    "length": 63,
                    "unique": true
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

var driver = worm.drive('pg', {
  host : '/var/run/postgresql',
  database: 'kwarque'
});

var port = worm.describe({
    id:1,
    // free form transformation: provide both ways to allow for either insert or retrieve
    xz: t.rename("x", t.transform(function(x) {return x + 1;}, function(x) {return x - 1;})),
    yobj: t.bloat({ // opposite of flatten: creates an object {y: val} as property yobj of parent
        y:1
    }),
    sum: t.expr('"fragment".x + "fragment".y'), // String is interpreted as SQL expression.
    fragment_owner_fkey1 : t.flatten({ // flatten pushes all properties to parent object
        account: t.rename('nick'),    // rename changes name of property (original name is given as arg, so that same property can be rerefered to multiple times)
        alias234 : t.many({ // many denounces one-to-many relationship where first argument gives qualified name of fkey; result is array of objects
            title:1,
            text:1
        }),
        related : t.rename("alias234", t.enumerate("id")) // enumerate is same as many, but only one attribute is retrieved and a flat array (without nested objects) is created
    })
}).bind(model, 'fragment').where("fragment.x != ?").render(driver);

port.select([50], function(item) {
    //console.log(item);
    item.account = item.account + Math.floor(Math.random() * 100000);
    port.update(item, undefined, function(err) {
        if (err) console.log(err);
    });
}, function(err) {
    if (err) console.log(err);
});

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