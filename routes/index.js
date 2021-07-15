var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient
const uri = <Your MongoDB URL>;

/* API documentation */
router.get('/api-docs',function(req,res,next){
	res.status(200).sendFile(__dirname+"/docs.html");
});

/* GET home page. */
router.get('/', async function(req, res, next) {
    
    await MongoClient.connect(uri, (err, client) => {
        if (err) return console.error(err)
          console.log('Connected to Vehicles Database');
          const db = client.db('vehicles');
          const detailsCollection = db.collection('details');
          detailsCollection.find().toArray(function(err, result) {  
            if (err) {res.status(501).send("mongo_server_error")}
            var html = `
                        <!DOCTYPE HTML>
                        <html>
                            <head>
                                <title>Valet Parking</title>
								<script>
									function openForm() {
										document.getElementById("myForm").style.display = "block";
									}
									function closeForm() {
										document.getElementById("myForm").style.display = "none";
									}
								</script>
								<style>
									body{
										color: #363860;
										font-family: Arial, Helvetica, sans-serif;
									}
									td,th{
										padding: 25px;
										border-bottom: 1px solid #ddd;
										text-align: center;
									}
									tr:hover {background-color: #f5f5f5;}
									.button {
										cursor: pointer;
										background-color: #0070FD; 
										border: none;
										color: white;
										padding: 15px 20px;
										text-align: center;
										text-decoration: none;
										display: inline-block;
										font-size: 16px;
									}
									.checkout{
										font-weight: bold;
										cursor: pointer;
										color: #0070FD;
										padding: 0;
										border: none;
										background: none;
									}
									.vtype{
										color: #FD7800;
										background-color: #FFE0B2;
										border-radius: 25px;
										font-size: 0.95em;
										padding: 0;
									}
								</style>
                            </head>
                            <body>
                                <center>
									<h1>Valet Parking</h1>
									<h3>Dashboard</h3>
                                        <button  onclick="openForm()" value="Check In" class="button">+ Check In</button>
                                <div id="myForm" style="display:none">
									<h1>Vehicle Check-In</h1>
									<form onsubmit="alert('Vehicle will not be added if it already exists.');" action="/add_vehicle" method="POST">
										<table>
										<tr><th><label for="vehicle_no">Vehicle Number</label></th><th><label for="vehicle_type">Vehicle Type</label></th></td>
										<tr><td><input placeholder="Enter vehicle number" type="text" pattern="^[A-Z]{2}[\-][0-9]{2}[\-][A-Z]{1,2}[\-][0-9]{4}$" name="veh_no" required></td>
											<td>
												<select id="veh_type" name="veh_type" required>
													<option value="">Select</option>
													<option value="4-Wheeler">4-Wheeler</option>
													<option value="2-Wheeler">2-Wheeler</option>
												</select>
											</td>
										</tr>
										<tr><th><label for="vehicle_model">Vehicle Model</label></th><th><label for="phone_no">Phone Number</label></th></tr>
										<tr>
											<td><input placeholder="Enter vehicle model" type="text" name="veh_model" required></td>
											<td><input type="tel" name="phone" required pattern="[6789][0-9]{9}" placeholder="Enter phone number"> </td>
										</tr>
										<tr><th>
										<label for="customer_name">Customer Name</label>
										</th></tr>
										<tr><td>
										<input type="text" name="cust_name" placeholder="Enter name" required>
										</td>
										<td><input type="submit"  value="Check In" class="button"></td>
										</tr>
										</table>
										
									</form>
									<br><br>
									<button onclick="closeForm()">Close Check In</button>
								</div>
                                <table><tr><th>Vehicle Number</th><th>Vehicle Model</th><th>Vehicle Type</th><th>Phone</th><th>Check In</th><th>Actions</th></tr>`
            for(i=0;i<result.length;i++){
                //console.log(result[i]);
                html+=`<tr><td>`+ result[i].vehicle_no.split("-").join(" ") + "</td><td>" + result[i].vehicle_model+"</td><td class='vtype'>"+result[i].vehicle_type+"</td><td>"+result[i].phone+"</td><td>"+result[i].check_in+
                        `</td><td><form method="POST" action="/checkout_get_details">
                            <input type="hidden" name="veh_no" value=`+(result[i].vehicle_no.toString())+`>
                            <input type="submit" value="Check Out" class="checkout">
                        </form><td></tr>`
            }
            html+= `</table>
                </center> 
                </body>
            </html>
            `
	        res.status(200).send(html);
          });  
    })
      
    
	
     
});

router.post('/add_vehicle',function(req,res,next){
	var vehicle_no = req.body.veh_no;
	var vehicle_type = req.body.veh_type;
	var vehicle_model = req.body.veh_model;
	var phone = req.body.phone;
	var customer_name = req.body.cust_name;
	var vehicle = {
		"vehicle_no" : vehicle_no,
		"vehicle_type" : vehicle_type,
		"vehicle_model" : vehicle_model,
		"phone" : phone,
        "check_in": new Date().toLocaleString(),
		"customer_name" : customer_name
	}
	//console.log(vehicle);
	MongoClient.connect(uri, (err, client) => {
		if (err) return console.error(err)
			console.log('Connected to Vehicles Database');
			const db = client.db('vehicles');
			const detailsCollection = db.collection('details');
			var object = {"vehicle_no" : vehicle_no};
			detailsCollection.findOne(object, function(error, result) {
			if (!error) {
				if (result) {
					console.log("Vehicle exists");
					res.status(202).redirect("/");
				} 
				else {
				console.log("Vehicle not exists");
				detailsCollection.insertOne(vehicle)
				.then(result=>{
					res.status(201).redirect("/");
				})
				.catch(err=> console.log(err))
				
				}
			} else {
				console.log("MongoDB error");
				res.status(501).send("mongo_error");
			}
		});
	});
	
});

router.post("/checkout_get_details",async function(req,res,next){
    console.log(req.body.veh_no);
	var html = `<!DOCTYPE html>
				<html>
				<head>
					<style>
						div{
							padding: 12px 0px;
							background-color: #C6E5FF;
							border-radius : 15px;
							width: 15%;
						}
						#amount{
							color: #3272F4;
						}
						td,th{
							padding: 15px;
							text-align: left;
						}
						body{
							color: #363860;
							font-family: Arial, Helvetica, sans-serif;
						}
						.button {
							cursor: pointer;
							border-radius:12px;
							background-color: #0070FD; 
							border: none;
							color: white;
							padding: 15px 20px;
							text-align: center;
							text-decoration: none;
							font-size: 16px;
						}
					</style>
				</head>
					<body>
						<center>
						<h2>Check Out</h2>
						<table>
							<tr>
								<td>Customer Name</td><td>Phone Number</td><td>Vehicle Number</td><td>Vehicle Type</td>
							</tr>
							<tr>`
	await MongoClient.connect(uri, (err, client) => {
		if (err) return console.error(err)
		  console.log('Connected to Vehicles Database');
		  const db = client.db('vehicles');
		  const detailsCollection = db.collection('details');
		  var object = {vehicle_no: req.body.veh_no};
		  detailsCollection.findOne(object, function(error, result) {
		  if (!error) {
			if (result) {
				console.log("Item exists");
				//console.log(result);
				html+="<th>"+result.customer_name+"</th><th>"+result.phone+"</th><th>"+result.vehicle_no.split("-").join(" ")+"</th><th>"+result.vehicle_type+"</th>";
				html+=`
							</tr>
							<tr>
								<td>Vehicle Model</td><td>Check In</td><td>Check Out</td><td>Duration</td>
							</tr>
							<tr>`
				var check_in_time = new Date(result.check_in).getTime()
				//console.log(check_in_time);
				var curr_time = new Date().toLocaleString()
				var check_out_time = new Date(curr_time).getTime()
				//console.log(check_out_time);
				var diff =(check_out_time - check_in_time) / 1000;
				diff /= (60 * 60);
				duration =  Math.abs(Math.round(diff));
				var amount_to_pay;
				if(duration==0){
					amount_to_pay = 30;
				}
				else{
					amount_to_pay = 30;
					amount_to_pay+= (duration-1)*20;
				}
				//console.log(duration)			
				html+=	"<th>"+result.vehicle_model+"</th><th>"+result.check_in.split(",").join("<br>")+"</th><th>"+curr_time.split(",").join("<br>")+"</th><th>"+duration+" hours</th></tr></table>";						
				html+=`<div id="to_pay">
							<h3>To Pay</h3>
							<h1 id='amount'> Rs.`+amount_to_pay+`</h1>
					   </div>
					   <br><br>
					   <form onsubmit="alert('Payment Successful\\nYour vehicle will reach you in next 5 minutes.');" method="POST" action="/checkout" >
					   		<input type="text" name="vehicle_no" value=`+ result.vehicle_no+` hidden>
					   		<input type="submit" onclick="pay()" value="Proceed to pay" class="button"/>
					   </form>
					   <br>
					   <button onclick="window.history.back()" >Cancel</button>
					   </center>
					   </body>
					</html>`
				res.status(200).send(html);
			} 
			else {
				console.log("Vehicle not exists");
				res.status(404).send("vehicle_not_exists");
			}
		  } else {
			console.log("MongoDB error");
			res.status(501).send("mongo_error");
		  }
		});
	  })
    //res.send(req.body.id);
});

router.post('/checkout',function(req,res,next){
	console.log(req.body.vehicle_no);
	MongoClient.connect(uri, (err, client) => {
		if (err) return console.error(err)
		  console.log('Connected to Database');
		  const db = client.db('vehicles');
		  const detailsCollection = db.collection('details');
		  var vehicle = {vehicle_no : req.body.vehicle_no};
		  detailsCollection.deleteOne(vehicle, function(error, result) {
		  if (!error) {
			if (result) {
		 		 console.log("Vehicle deleted");
				res.status(202).redirect("/");
			} 
			else {
				console.log("Vehicle not exists");
				res.status(404).send("wrong_creds");
			}
		  } else {
				console.log("MongoDB error");
				res.status(501).send("mongo_error");
		  }
		});
	  })
});

module.exports = router;