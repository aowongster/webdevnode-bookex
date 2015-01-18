var express = require('express');
var http = require('http');
var logger = require('morgan');
var formidable = require('formidable');
var bodyParser = require('body-parser');
var fortune = require('./lib/fortune.js');
var weather = require('./lib/weather.js');
var credentials = require('./credentials.js');
var Vacation = require('./models/vacations.js');
var VacationInSeasonListener = require('./models/vacationInSeasonListener.js')
var mongoose = require('mongoose');

// copy pasta db building:
Vacation.find(function(err, vacations){ if(vacations.length) return;
  new Vacation({
    name: 'Hood River Day Trip',
    category: 'Day Trip',
    sku: 'HR199',
    description: 'Spend a day sailing on the Columbia and ' +
    'enjoying craft beers in Hood River!',
    priceInCents: 9995,
    tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'], inSeason: true,
    available: true,
    packagesSold: 0,
  }).save();

  new Vacation({
    name: 'Oregon Coast Getaway',
    category: 'Weekend Getaway',
    sku: 'OC39',
    description: 'Enjoy the ocean air and quaint coastal towns!', priceInCents: 269995,
    tags: ['weekend getaway', 'oregon coast', 'beachcombing'], inSeason: false,
    available: true,
    packagesSold: 0,
  }).save();
  new Vacation({
    name: 'Weekend in Bend',
    category: 'Weekend Getaway',
    sku: 'B99',
    description: 'Experience the thrill of skiing and hiking in the high desert.', priceInCents: 289995,
    tags: ['weekend getaway', 'bend', 'high desert', 'hiking', 'skiing'], inSeason: true,
    available: false,
    packagesSold: 0,
    notes: 'The tour guide is currently recovering fro a skiing accident.',
  }).save();
});

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

app.get('/vacations', function(req,res){
    Vacation.find({ available: true}, function(err, vacations){
      var context = {
        vacations: vacations.map(function(vacation){
                     return {
                      sku: vacation.sku,
                      name: vacation.name,
                      description: vacation.description,
                      price: vacation.getDisplayPrice(),
                      inSeason: vacation.inSeason,
                     };
                  })
      };
      res.render('vacations', context);
      });
});

app.post('/vacations', function(req, res){
    Vacation.find({ sku: req.body.purchaseSku }, function(err, vacations){
      if(err || !vacations.length) {
        req.session.flash = {
          type: 'warning',
          intro: 'Oops!',
          message: 'Something went wrong with you reservation; '+
            'please <a href="/contact">contact us</a>',
        };
        return res.redirect(303, '/vacations');
      }
      vacations[0].packagesSold++;
      vacations[0].save();
      req.session.flash = {
        type: 'success',
        intro: 'Thank you! ',
        message: 'Your vacation has been booked.',
      };
      res.redirect(303, '/vacations');
    });
});

// mongoose db form handlers
app.get('/notify-me-when-in-season', function(req,res){
  res.render('notify-me-when-in-season', {sku: req.query.sku});
});

app.post('/notify-me-when-in-season', function(req, res){
    VacationInSeasonListener.update(
      {email: req.body.email},
      {$push: {skus: req.body.sku} },
      {upsert: true}
      , function(err){
        if(err){
          req.session.flash = {
            type:'danger',
            intro: 'Ooops!',
            message: 'There was an error processing your request.',
          };
          return res.redirect(303, '/vacations');
        }
      req.session.flash = {
        type: 'success',
        intro: 'Thank you!',
        message: 'You will be notified when this vacation is in season.',

      };
      return res.redirect(303, '/vacations');

    });
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
