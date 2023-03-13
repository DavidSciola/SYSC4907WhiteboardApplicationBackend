const express = require("express");
const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors({origin:'*'}));


//setup postgres database
const {Pool} = require("pg");
const pool = new Pool({
//connectionString: "postgres://ngrlvutctwjhjn:85401b377bf90c8263a5e523708a0556bc84c982c1f34a04db4799864f98a05c@ec2-18-214-134-226.compute-1.amazonaws.com:5432/d4iu7lthoumkia",
connectionString: "postgres://wyscaqraqmexio:f2b1bc3c7f250a769140209da8f3f23c291dd7ce6fa666607e8c39ffd9c26a0c@ec2-50-17-35-205.compute-1.amazonaws.com:5432/dbcv0451fifb7f",
ssl: {
rejectUnauthorized: false
}
});

var dayMap = new Map();
dayMap.set("Sunday", 0);
dayMap.set("Monday", 1);
dayMap.set("Tuesday", 2);
dayMap.set("Wednesday", 3);
dayMap.set("Thursday", 4);
dayMap.set("Friday", 5);
dayMap.set("Saturday", 6);

var timeMap = new Map();
timeMap.set("8:30", 0)
timeMap.set("9:00", 1)
timeMap.set("9:30", 2)
timeMap.set("10:00", 3)
timeMap.set("10:30", 4)
timeMap.set("11:00", 5)
timeMap.set("11:30", 6)
timeMap.set("12:00", 7)
timeMap.set("12:30", 8)
timeMap.set("13:00", 9)
timeMap.set("13:30", 10)
timeMap.set("14:00", 11)
timeMap.set("14:30", 12)
timeMap.set("15:00", 13)
timeMap.set("15:30", 14)
timeMap.set("16:00", 15)
timeMap.set("16:30", 16)
timeMap.set("17:00", 17)

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

  var origin = req.headers["Origin"];

  var email = req.headers["id"];
  var password = req.headers["password"];

  console.log("id: " + email)
  console.log("password: " + password)

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

//create new session
app.post("/session", function (req, res) {
  console.log("creating session...");

  var date = req.body["date"];
  var startTime = req.body["startTime"];
  var endTime = req.body["endTime"];
  var course = req.body["course"];
  var description = req.body["description"];
  var numParticipants = req.body["numParticipants"];
  var sessionType = req.body["sessionType"];
  var sessionStatus = req.body["sessionStatus"];
  var userID = req.body["userID"]
  var sessionID = 0

  var query = `INSERT INTO sessions(description, session_type, course_code, start_time, end_time, date, person_limit, status) 
  VALUES ('`+description+`', '`+sessionType+`', '`+course+`', '`+startTime+`', '`+endTime+`', '`+date+`', `+numParticipants+`, '`+sessionStatus+`')
  RETURNING session_id`;

  pool.query(query, (err, queryResult) => {
    if (err) {
        console.log("Error - Failed to select all from Users");
        console.log(err);
    }
    else{
        console.log(queryResult);
        sessionID = queryResult.rows[0].session_id

        query = `INSERT INTO user_sessions(ID, session_ID, attended) VALUES ('`+userID+`',`+sessionID+`, false);`

        pool.query(query, (err, queryResult) => {
          if (err) {
              console.log("Error - Failed to insert into user_sessions table");
              console.log(err);
          }
          else{
              console.log(queryResult);
          }
        });
    }
  });

  res.send("created session");
});

//fetch all sessions (this includes private sessions user associated with user, 
// public sessions user has registered for and public sessions user has not registered for)
app.get("/session", function (req, res) {
  console.log("fetching all sessions...");

  var currentUserId = req.headers['user_id'];
  var data = {};

  // step 1, fetch private sessions that user is associated with
  var query1 = `SELECT * FROM sessions INNER JOIN user_sessions ON sessions.session_id = user_sessions.session_id WHERE sessions.session_type = 'private' AND id = '`+currentUserId+`';`;
  pool.query(query1, (err, queryResult) => {
    data['private_sessions'] = queryResult.rows;

    // step 2, fetch public sessions that user has registered for
    var query2 = `SELECT * FROM sessions INNER JOIN user_sessions ON sessions.session_id = user_sessions.session_id WHERE sessions.session_type = 'public' AND id = '`+currentUserId+`';`;
    pool.query(query2, (err, queryResult) => {
      data['registered_public_sessions'] = queryResult.rows;

          // step 3, fetch public sessions that user has HAS NOT registered for
          //var query3 = `SELECT * FROM sessions INNER JOIN user_sessions ON sessions.session_id = user_sessions.session_id WHERE sessions.session_type = 'public' AND id != '`+currentUserId+`';`;
          var query3 = `SELECT * FROM sessions INNER JOIN user_sessions ON sessions.session_id = user_sessions.session_id AND session_type = 'public' AND sessions.session_ID NOT IN (SELECT session_id FROM user_sessions WHERE id = '`+currentUserId+`');`;
          pool.query(query3, (err, queryResult) => {
            data['unregistered_public_sessions'] = queryResult.rows;

            // step 4, send combined results from steps 1,2 and 3
            const jsonContent = JSON.stringify(data);
            res.send(jsonContent);
        
          });
    });
  });
});

//create new session
app.post("/register-session", function (req, res) {
  var registerOrUnregister = req.body["registerOrUnregister"];
  var userID = req.body["userid"];
  var sessionID = req.body["sessionid"];

  if(registerOrUnregister == "register"){
    console.log("registering user " + userID + " for session " + sessionID);
    var query = `INSERT INTO user_sessions(ID, session_ID, attended) VALUES ('`+userID+`', `+sessionID+`, false);`;
    pool.query(query, (err, queryResult) => {
      if (err) {
          console.log("Error - Failed to insert into user_sessions table");
          console.log(err);
      }
      else{
          console.log(queryResult);
      }
    });

  }else{
    console.log("unregistering user " + userID + " for session " + sessionID);
    var query = `DELETE FROM user_sessions WHERE session_id = '`+sessionID+`' AND id = '`+userID+`';`;
    pool.query(query, (err, queryResult) => {
      if (err) {
          console.log("Error - Failed to delete from user_sessions table");
          console.log(err);
      }
      else{
          console.log(queryResult);
      }
    });
  }

  res.send("action successful");
});

//fetch all requested sessions
app.get("/requested-sessions", function (req, res) {
  console.log("fetching all requested sessions...");

  var query = `SELECT * FROM sessions INNER JOIN user_sessions ON sessions.session_id = user_sessions.session_id
  WHERE sessions.status = 'requested';`;

  pool.query(query, (err, queryResult) => {
    if (err) {
        console.log("Error - Failed to select sessions with status = requested");
        console.log(err);
    }
    else{
        console.log(queryResult.rows);
        
        //return json with all requested sessions
        const responseData = {
          results: queryResult.rows
        }

        const jsonContent = JSON.stringify(responseData);
        res.send(jsonContent);
    }
  });
});

//fetch all students
app.get("/students", function (req, res) {
  console.log("fetching all students...");

  var query = `SELECT * FROM user_accounts WHERE role = 'student';`;

  pool.query(query, (err, queryResult) => {
    if (err) {
        console.log("Error - Failed to select users with role = student");
        console.log(err);
    }
    else{
        console.log(queryResult.rows);
        
        //return json with all requested sessions
        const responseData = {
          results: queryResult.rows
        }

        const jsonContent = JSON.stringify(responseData);
        res.send(jsonContent);
    }
  });
});

//fetch all scholars
app.get("/scholars", function (req, res) {
  console.log("fetching all scholars...");

  var query = `SELECT * FROM user_accounts WHERE role = 'scholar';`;

  pool.query(query, (err, queryResult) => {
    if (err) {
        console.log("Error - Failed to select users with role = scholar");
        console.log(err);
    }
    else{
        console.log(queryResult.rows);
        
        //return json with all requested sessions
        const responseData = {
          results: queryResult.rows
        }

        const jsonContent = JSON.stringify(responseData);
        res.send(jsonContent);
    }
  });
});

function setAvailability(userID, date, startTime, endTime, dayOfWeek) {
  var dateString = date.toDateString();
  console.log("date: " + dateString);
  var query = `SELECT * FROM availability WHERE id = '` + userID + `' AND start_of_week = '` + dateString + `';`;
  pool.query(query, (err, queryResult) => {
    if (err) {
        console.log("Error - Failed to get existing availability of user");
        console.log(err);
        res.send("action unsuccessful");
    }
    else{
        console.log(queryResult.rows);
        
        if (queryResult.rows.length == 0) {
          var availability = {
            0: ["F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F"],
            1: ["F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F"],
            2: ["F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F"],
            3: ["F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F"],
            4: ["F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F"],
            5: ["F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F"],
            6: ["F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F","F"]
          }

          for (var i = timeMap.get(startTime); i < timeMap.get(endTime); i++) {
            availability[dayOfWeek][i] = "T";
          }

          console.log("date: " + dateString);
          query = `INSERT INTO availability(id, start_of_week, availability) VALUES('`+userID+`', '`+dateString+`', '`+JSON.stringify(availability)+`');`
        } else {
          var availability = JSON.parse(queryResult.rows[0].availability);
          for (var i = timeMap.get(startTime); i < timeMap.get(endTime); i++) {
            availability[dayOfWeek][i] = "T";
          }

          query = `UPDATE availability SET availability = '`+JSON.stringify(availability)+`' WHERE id = '` + userID + `' AND
          start_of_week = '` + dateString + `';`
        }

        pool.query(query, (err, queryResult) => {
          if (err) {
            console.log("Error - Failed to set availability");
            console.log(err);
            res.send("action unsuccessful");
          } else {
            console.log(queryResult);
            res.send("action successful");
          }
        });
    }
  });
}

//set availability
app.post("/availability", function (req, res) {
  console.log("setting availability...");

  var userID = req.body["userID"];
  var day = req.body["day"];
  var date = req.body["date"];
  var startTime = req.body["startTime"];
  var endTime = req.body["endTime"];
  
  //recurring
  if (day) {
    var currentDate = new Date();
    var dayOfWeek = currentDate.getDay();
    var month = currentDate.getMonth();
    var year = currentDate.getFullYear();
    currentDate.setDate(currentDate.getDate() - dayOfWeek);

    var endDate;
    if (month >= 8) {
      endDate = new Date(year, 11, 31);
    } else if (month >= 4) {
      endDate = new Date(year, 7, 31);
    } else {
      endDate = new Date(year, 3, 30);
      console.log(endDate);
    }

    for (var tempDate = currentDate; tempDate < endDate; tempDate.setDate(tempDate.getDate() + 7)) {
      console.log("loop:" + tempDate);
      setAvailability(userID, tempDate, startTime, endTime, dayMap.get(day));
    }
  }
  
  //single occurence
  if (date) {
    var requestDate = new Date(date);
    var dayOfWeek = requestDate.getDay();
    requestDate.setDate(requestDate.getDate() - dayOfWeek);

    //var query = `INSERT INTO availability(id, start_of_week, availability) VALUES('`+userID+`', '`+date+`', '`+json.stringify(availability)+`')
    //ON CONFLICT (id) DO UPDATE SET availability = 'ab'`;

    setAvailability(userID, requestDate, startTime, endTime, dayOfWeek);
  }
});

app.listen(process.env.PORT || 5000 || 3000);