var express = require('express');
var http = require('http');
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

// end routes

app.use(function(req, res, next){
  res.status(404);
  res.render('404');
});


http.createServer(app).listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl -c to terminate.');
});
