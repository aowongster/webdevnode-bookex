var express = require('express');
var http = require('http');
var fortune = require('./lib/fortune.js');

// handlebars vs jade

var app = express();
var handlebars = require('express3-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);

app.use(express.static(__dirname +'/public'));
// routes

app.get('/', function(req, res){
  res.render('home');
});

app.get('/about', function(req, res){
  res.render('about', { fortune: fortune.getFortune()});
});

app.use(function(req, res, next){
  res.status(404);
  res.render('404');
});


http.createServer(app).listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl -c to terminate.');
});
