/* instantiating app and db conn */
var express = require('express');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json'))
var app = express();
    app.listen(8080);

var mysql      = require('mysql');
var connection = mysql.createConnection(config);

var async = require('async');

/* routes */
app.get('/queues', function (req, res) {
	connection.query('select id, name from queues', function(err,rows,fields){
		res.send(JSON.stringify(rows));
	});
})

/* curl */
var curl = require('curl');

//create new queue
app.post('/queues', function (req, res) {
	if(!req.param('name')){
		res.send('error');
		return;
	}
	connection.query("insert into queues set ?", {name:req.param('name')}, function(e,result){
		if(!e && result.insertId) res.send({status:'ok',id:result.insertId});
		else throw e;
	});
})


//edit existing queue
app.put('/queues/:id', function (req, res) {
	console.log(req.params.id);
  connection.query("update queues set name = ? where id = ?", [req.param('name'), req.params.id],function(e,result){
		if(!e) res.send({status:'ok'});
		else throw e;
	});
})

//delete queue 
app.delete("/queues/:id", function(req,res){
	connection.query("delete from queues where id = ?", [req.params.id],function(e,result){
    if(!e) res.send({status:'ok'});
    else throw e;
  });
})

//publish message
app.post("/queues/:id/messages",function(req,res){
	if(req.params.id && req.param('body')){
		var msg_body = req.param('body');
		connection.query("insert into messages set ?", {queue_id:req.params.id, message: msg_body, created:'now()'},function(e,r){
			if(!e && r.insertId){	
			  async.parallel([
					function(callback){
						res.send({status:'ok'});
					},
					function(callback){
						connection.query("select * from consumers where queue_id = ? ",[req.params.id],function(e,rows){
							async.forEach(rows,function(row){
									async.series([function(cb){
										connection.query("insert into message_sent set ?",{message_id:r.insertId,queue_id:req.params.id,consumer_id:row.id}, function(e,r){
											cb();
										});
									},function(cb){
										console.log("posting to "+row.callback_url);
										curl.post(row.callback_url,msg_body,function(err){
												if(err) console.log(err); 
										});
										cb();
									},function(cb){
										connection.query("update message_sent set has_been_sent=1 where message_id = ? and consumer_id = ?", [r.insertId, row.id]);
									  cb();
									},function(){
										console.log(row.callback_url + " msg sent ");
									}]);
								},function(err){
									if(!err) console.log("messages sent");
									else console.log(err);
								});
							})
					}]);		
			}else{
					console.log(e);
				  res.send({status:'error',error:'bad server'});
			}
		});
	}
});

//add consumer
app.post("/queues/:id/consumers",function(req,res){
	if(req.params.id && req.param('callback_url')){
	  connection.query("insert into consumers set ?", {queue_id:req.params.id,callback_url:req.param('callback_url')}, 
			function(e,result){
  	  	if(!e && result.insertId) res.send({status:'ok'});
    		else throw e;
  		})
	}
	else{
		res.send({status:'error',error:'bad request'});	
	}	
})

//list of consumers
app.get("/queues/:id/consumers",function(req,res){
	connection.query('select id, queue_id, callback_url from consumers where queue_id= ?', [req.params.id], function(err,rows,fields){
 		if(err) console.log(err);
	   res.send(JSON.stringify(rows));
  });	
})

//delete consumer
app.delete("/queues/:id/consumers/:consumer_id",function(req,res){
	if(req.params.id && req.params.consumer_id){
		connection.query("delete from consumers where id = ?", [req.params.consumer_id],function(e,result){
  	  if(!e) res.send({status:'ok'});
    	else throw e;
  	});
	}else{
		res.send({status:'error',error:'bad request'});
	}
})


