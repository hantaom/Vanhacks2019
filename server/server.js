var express = require('express');
var bodyParser = require("body-parser");
var exec = require('child_process').exec, child;
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
  res.sendfile("index.html");
});

child = exec('java -jar ./sample.jar',
  function (error, stdout, stderr){
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if(error !== null){
      console.log('exec error: ' + error);
    }
    return
});

app.post('/request',function(req,res){

  var user_name=req.body.user;
  var password=req.body.password;
  console.log("User name = "+user_name+", password is "+password);
  res.end("yes");
});

app.listen(3000);
console.log('Listening on port 3000...');

try {

} catch {



  console.log("error");



  
}