var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'labtop1000',
    multipleStatements: true
});
db.connect(function (err) {
    if (err) { console.log('Loi ket noi database ', err); db.end(); }
    else console.log('Da ket noi database ');
});
module.exports = db;