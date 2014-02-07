
/**
 * Module dependencies.
 */

var express = require('express');
var mongodb = require('mongodb');
var routes = require('./routes');
var user = require('./routes/user');
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
app.use(function (req,res,next){
    console.log('bbbbb');
    if (req.session.loggedIn){
        console.log('已登录');
        res.locals.authenticated = true;
        app.users.findOne({_id : {ObjectId: req.session.loggedIn}},function(err, doc){
            if(err) return next(err);

            next();
        });
    } else {
        console.log('未登录');
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

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/login', function(req,res){
    res.render('login');
});

app.post('/login', function(req,res){
   app.users.findOne({ email: req.body.user.email, pasword: req.body.user.password}, function (err,doc){
       if (err) return next(err);
       if (!doc) return res.send('<p>没有找到用户</p>');
       req.session.loggedIn = doc._id.toString();
       res.redirect('/');
   })
});

app.get('/signup', function(req,res){
    res.render('signup');
});

app.post('/signup', function(req, res ,next){
    app.users.insert(req.body.user,function(err, doc){
        if(err) return next(err);
        console.log(doc);
        res.redirect('/login/'+doc[0].email);
    });
});

app.get('/logout', function(req, res){
    req.session.loggedIn = null;
    res.redirect('/');
});


app.get('/login/:signupEmail',function(req, res){
    res.render('login',{ signupEmail: req.params.signupEmail });
});


var server = new mongodb.Server('127.0.0.1',27017);
new mongodb.Db('my-website',server).open(function (err,client){
    if(err) throw err;
    console.log('connect to mongodb');
    app.users = new mongodb.Collection(client,'users');
    client.ensureIndex('users', 'email', function (err){
        if(err) throw err;
    });
    client.ensureIndex('users', 'password', function (err){
        if(err) throw err;
    });

    http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });
});



