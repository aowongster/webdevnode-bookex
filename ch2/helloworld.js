var http = require('http');
var fs = require('fs');

function serveStaticFile(res, path, contentType, responseCode){
  if(!responseCode)
    responseCode = 200;
  fs.readFile(__dirname + path, function(err,data){
    if(err){
      res.writeHead(500, {'Content-Type': 'text/plain' });
      res.end('500 - Internal Error');
    }
    else {
      res.writeHead(responseCode, {'Content-Type': contentType});
      res.end(data);
    }
  });
};

http.createServer(function(req,res){
  var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
  switch(path) {
    case '':
      serveStaticFile(res, '/public/home.html', 'text/html');
      break;
    case '/about':
      serveStaticFile(res, '/public/about.html', 'text/html');
      break;
    case '/img/logo.jpg':
      serveStaticFile(res, '/public/img/logo.jpg', 'image/jpeg');
      break;
    case '/img/kitty.gif':
      serveStaticFile(res, '/public/img/kitty.gif', 'image/gif');
      break;
    default:
      serveStaticFile(res, '/public/notfound.html', 'text/html', 404);
      break;
  }
}).listen(8088);

console.log('Server started on localhost: 8088, press ctrl-c');