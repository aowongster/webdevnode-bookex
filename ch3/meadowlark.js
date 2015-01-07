var express = require('express');
var http = require('http');
var formidable = require('formidable');
var fortune = require('./lib/fortune.js');
var weather = require('./lib/weather.js');

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
app.use(require('body-parser')());
app.use(express.static(__dirname +'/public'));
app.use(function(req, res, next){
  res.locals.showTests = app.get('env') !== 'production' &&
    req.query.test === '1';

  if(!res.locals.partials) res.locals.partials = {};
  res.locals.partials.weather = weather.getWeatherData();
  next();
});

// routes
app.get('/', function(req, res){
  res.render('home');
});

app.get('/about', function(req, res){
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

// end routes
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

app.use(function(req, res, next){
  res.status(404);
  res.render('404');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl -c to terminate.');
});
