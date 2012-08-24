console.log('(x < ? AND y > ?) OR id = ?');
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
}

log(result, 0);