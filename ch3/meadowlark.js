var express = require('express');
var http = require('http');
var logger = require('morgan');
var formidable = require('formidable');
var bodyParser = require('body-parser');
var fortune = require('./lib/fortune.js');
var weather = require('./lib/weather.js');
var credentials = require('./credentials.js');
var mongoose = require('mongoose');


// handlebars vs jade

var app = express();
var handlebars = require('express3-handlebars').create({
  defaultLayout:'main',
  helpers: {
    section: function(name, options){
      if(!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);

app.use(require('cookie-parser')('law badly personal seldom'));
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
      }));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname +'/public'));
app.use(function(req, res, next){
  res.locals.showTests = app.get('env') !== 'production' &&
    req.query.test === '1';
  if(!res.locals.partials) res.locals.partials = {};
  res.locals.partials.weather = weather.getWeatherData();

  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

var options = {
  server: {
    socketOptions: { keepAlive: 1}
  }
};
switch(app.get('env')){
  case 'development':
    app.use(logger('dev'));
    mongoose.connect(credentials.mongo.development.connectionString, options);
    break;
  case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, options);
    app.use(logger({path: __dirname + '/log/requests.log'}));
    break;
  default:
    throw new Error('unknown execution environment: ' +app.get('env'));
}

// routes
app.get('/', function(req, res){ res.render('home'); }); app.get('/about', function(req, res){
  res.render('about', {
    fortune: fortune.getFortune(),
    pageTestScript: '/qa/tests-about.js'
  });
});

app.get('/tours/hood-river', function(req,res){
  res.render('tours/hood-river');
});

app.get('/tours/oregon-coast', function(req,res){
  res.render('tours/oregon-coast');
});
app.get('/tours/request-group-rate', function(req,res){
  res.render('tours/request-group-rate');
});

app.get('/inject', function(req,res){
  res.render('inject');
});

app.get('/jsonreader', function(req,res){
  res.render('jsonreader');
});

app.get('/ajax/madLib', function(req, res){
  res.json({
    animal: 'squirrel',
    bodyPart: 'tail',
    adjective: 'bushy',
    noun: 'heck'
  });
});

app.get('/enter', function(req, res){
  res.render('enter');
});

app.get('/formtest', function(req, res){
  res.render('formtest');
});

app.get('/contest/vacation-photo', function(req, res) {
  var now = new Date();
  res.render('vacation-photo-contest', {year: now.getFullYear(), month: now.getMonth() });
});

// end get routes
app.post('/process', function(req, res){
  if(req.xhr || req.accepts('hson,html') ==='json'){
    res.send({success: true});
  }
  else {
    res.redirect(303, '/thank-you');
  }
});

app.post('/upload', function(req, res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    if(err) return res.redirect(303, '/error');
    console.log('received fields:');
    console.log(fields);
    console.log('received files:');
    console.log(files);
    res.redirect(303, '/thank-you');
    });
});


function vacationPhotoContest(email, year, month, photoPath){
  // TODO more later
}

var formidable = require('formidable');

app.post('/contest/vacation-photo/:year/:month', function(req, res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    if(err) return res.redirect(303, '/error');
    if(err) {
      res.session.flash = {
        type: 'danger',
        intro: 'Ooops!',
        message: "There was an error processing your submissions",
      };
      return res.redirect(303, '/contest/vacation-photo');
    }
    var photo = files.photo;
    var dir = __dirname + '/data/vacation-photo-contest/' + Date.now();
    var path = dir + '/' + photo.name;
    fs.mkdirSync(dir);
    fs.renameSync(photo.path, dir + '/' + photo.name);
    vacationPhotoContest(fields.email,
      req.params.year, req.params.month, path);
    req.session.flash = {
      type: 'sucess',
      intro: 'Good Luck!',
      message: 'You have been entered into the contest.',
    };
    return res.redirect(303, '/contest/vacation-photo/entries');
  });
});

// catch all 404 handler
app.use(function(req, res, next){
  res.status(404);
  res.render('404');
});

function startServer(){
  http.createServer(app).listen(app.get('port'), function(){
    console.log( 'Express started on http://localhost:' +
      app.get('port') + '; press Ctrl -c to terminate.');
  });
}

if(require.main === module){
  startServer();
} else {
  module.exports = startServer;
}
