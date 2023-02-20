const express = require("express");
const app = express();
app.use(express.json());

app.get("/", function (req, res) {
  var query_param = req.query.queryparam1;
  var header = req.headers['header1'];
  const body = req.body.json;

  res.send("query param:" + query_param + " header:" + header + " body:" + req.body["name"]);

  const {Pool} = require("pg");
  const pool = new Pool({
  connectionString: "postgres://ngrlvutctwjhjn:85401b377bf90c8263a5e523708a0556bc84c982c1f34a04db4799864f98a05c@ec2-18-214-134-226.compute-1.amazonaws.com:5432/d4iu7lthoumkia",
  ssl: {
  rejectUnauthorized: false
  }
  });

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


app.get("/login", function (req, res) {
  res.send("GET logging in...");
});

app.post("/login", function (req, res) {
  res.send("POST logging in...");
});


app.listen(process.env.PORT || 5000);