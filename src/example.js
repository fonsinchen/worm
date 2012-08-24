

require('worm').connect('pg', {
    host : '/var/run/postgresql',
    database: 'kwarque'
}, function(worm) {
    worm.select('fragments', {
        id:1, x:1, y:1
    }).where('(x < ? AND y > ?) OR id = ?', [
        12, 13, 14
    ]).limit(10, 12).find(function(err, result) {
        
    });
});