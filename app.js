/**
 * Module dependencies.
 */

var express = require('express');
var mongoose = require('mongoose');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: 'my secret'}));

app.use(function (req, res, next) {
    if (req.session.loggedIn) {
        res.locals.authenticated = true;

        User.findById(req.session.loggedIn, function (err, doc) {
            if (err) return next(err);
            res.locals.me = doc;
            console.log(res.locals.me);
            next();
        });

    } else {
        res.locals.authenticated = false;
        next();
    }
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

var Schema = mongoose.Schema;


var User = mongoose.model('EUser', new Schema({
    first: String,
    last: String,
    email: {type: String, unique: true },
    password: {type: String, index: true}
}));


app.get('/', routes.index);

app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', function (req, res) {
    User.findOne({ email: req.body.user.email, password: req.body.user.password}, function (err, doc) {
        if (err) return next(err);
        if (!doc) return res.send('<p>没有找到用户</p>');
        req.session.loggedIn = doc._id.toString();
        res.redirect('/');
    })
});

app.get('/signup', function (req, res) {
    res.render('signup');
});

app.post('/signup', function (req, res, next) {
    var user = new User(req.body.user).save(function (err) {
        if (err) return next(err);
    });
    res.redirect('/login/' + req.body.user.email);
});

app.get('/logout', function (req, res) {
    req.session.loggedIn = null;
    res.redirect('/');
});


app.get('/login/:signupEmail', function (req, res) {
    res.render('login', { signupEmail: req.params.signupEmail });
});


mongoose.connect('mongodb://172.16.2.219/my-website');
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});


//var server = new mongodb.Server('172.16.2.219', 27017);
//var db = new mongodb.Db('my-website', server).open(function (err, client) {
//    if (err) throw err;
//    console.log('connect to mongodb');
//    app.users = new mongodb.Collection(client, 'users');
//    client.ensureIndex('users', 'email', function (err) {
//        if (err) throw err;
//    });
//    client.ensureIndex('users', 'password', function (err) {
//        if (err) throw err;
//    });
//
//    http.createServer(app).listen(app.get('port'), function () {
//        console.log('Express server listening on port ' + app.get('port'));
//    });
//});



