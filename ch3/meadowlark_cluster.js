var cluster = require('cluster');

function startWorker(){
  var work = cluster.fork();
  console.log("Cluster: worker %d started", worker.id);
}

if(cluster.isMaster){
  require('os').cpus().forEach(function(){
    startWorker();
  });

  cluster.on('disconnect', function(worker){
    console.log('Cluster: worker %d disconnected from the cluster.', worker.id);

  });
} else {
  require('./meadowlark.js');
}
