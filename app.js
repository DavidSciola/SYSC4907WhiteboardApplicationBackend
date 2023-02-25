const express = require("express");
const app = express();
app.use(express.json());
// app.use(allowCrossDomain)
//var cors = require('cors')
// app.use(cors())

const cors = require('cors');
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", '*');
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
//   next();
// });

//setup postgres database
const {Pool} = require("pg");
const pool = new Pool({
//connectionString: "postgres://ngrlvutctwjhjn:85401b377bf90c8263a5e523708a0556bc84c982c1f34a04db4799864f98a05c@ec2-18-214-134-226.compute-1.amazonaws.com:5432/d4iu7lthoumkia",
connectionString: "postgres://ktveaiixprtkcb:62daebc5bdad97b0cc6cd2518bf96df1cdbad8f712081af9389d545f8be025dc@ec2-35-168-194-15.compute-1.amazonaws.com:5432/d9k73qtv1jck4t",
ssl: {
rejectUnauthorized: false
}
});

//dummy test endpoint
app.get("/", function (req, res) {
  var query_param = req.query.queryparam1;
  var header = req.headers['header1'];
  const body = req.body.json;

  res.send("query param:" + query_param + " header:" + header + " body:" + req.body["name"]);

  pool.query(`SELECT * FROM Users;`, (err, queryResult) => {
    if (err) {
        console.log("Error - Failed to select all from Users");
        console.log(err);
    }
    else{
        console.log(queryResult.rows);
    }
  });
});

//receive username (carleton email) and password and then check if valid
app.get("/login", function (req, res) {
  console.log("logging in...")

  var email = req.headers["id"];
  var password = req.headers["password"];


  // var query = 
  // `
  // DO $$
  // BEGIN
  // IF EXISTS (SELECT FROM user_accounts WHERE ID='bob@cmail.carleton.ca') THEN
  //   SELECT FROM user_accounts;
  // ELSE
  //   RAISE EXCEPTION 'id does not exist'; 
  // END IF;
  // END $$;
  // `

  //first check if a user row exists with matching ID
  var query = `SELECT * FROM user_accounts WHERE ID = '`+email+`';`;
  pool.query(query, (err, queryResult) => {

  console.log(queryResult.rows);
  console.log(queryResult.rowCount);

  //if user with ID exists then check if password matches
  if(queryResult.rowCount != 0){
    console.log("user exists");

    query = `SELECT * FROM user_accounts WHERE password = '`+password+`' AND ID = '`+email+`';`;
    pool.query(query, (err, queryResult2) => {
      if(queryResult2.rowCount != 0){
        console.log("password matches");
        console.log(queryResult2.rows[0]['role']);
        res.json({
          status: "valid",
          role: queryResult2.rows[0]['role']
        })

      }else{
        console.log("password does not match");
        res.json({
          status: "invalid_password"
        })
      }

    });

  //else user with ID does not exist and we can return "no user with ID found"
  }else{
    console.log("user does not exist");
    res.json({
      status: "invalid_ID"
    })
  }
  });
});

//register a new username (carleton email) and password
app.post("/login", function (req, res) {
  console.log("registering...");

  var email = req.body["id"];
  var password = req.body["password"];

  //first check if ID already exists
  var query = `SELECT * FROM user_accounts WHERE ID = '`+email+`';`;
  pool.query(query, (err, queryResult) => {
    if(queryResult.rowCount != 0){
      res.json({
        status: "ID_already_exists"
      })

    //username input validation
    }else if(email.length <= 5 || email.length >= 50){
      //todo, check if its a carleton email + check for invalid chars?
      res.json({
        status: "invalid_ID"
      })

    //password input validation
    }else if(password.length <= 5 || password.length >= 30){
      //todo, check if its a carleton email + check for invalid chars? + force special char?
      res.json({
        status: "invalid_password"
      })
    
    //else everything is valid and we can register
    }else{
      query = `INSERT INTO user_accounts(ID, password, role) VALUES('`+email+`', '`+password+`', 'student');`;
      pool.query(query, (err, queryResult) => {});
      res.json({
        status: "registered_user"
      })
    }
  });
});


app.get("/session", function (req, res) {
  //if public

  //else if private

  //return all public/private sessions within date range
});

app.post("/session", function (req, res) {
  console.log("creating session...");

  var date = req.body["date"];
  var startTime = req.body["startTime"];
  var endTime = req.body["endTime"];
  var course = req.body["course"];
  var description = req.body["description"];
  var numParticipants = req.body["numParticipants"];
  var sessionType = req.body["sessionType"];

  //if public session
  if(sessionType == 'public'){
    console.log("public");
  }

  var query = `INSERT INTO sessions(description, session_type, course_code, start_time, end_time, date, person_limit, status) 
  VALUES ('`+description+`', '`+sessionType+`', '`+course+`', '`+startTime+`', '`+endTime+`', '`+date+`', `+numParticipants+`, 'pending')`;

  pool.query(query, (err, queryResult) => {
    if (err) {
        console.log("Error - Failed to select all from Users");
        console.log(err);
    }
    else{
        console.log(queryResult);
    }
  });

  //else if private
  //TODO

  res.send("testing...");

});



app.listen(process.env.PORT || 5000);