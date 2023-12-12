const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// user schema
const user_schema = new mongoose.Schema({
  username: { type: String, require: true },
});
// user model
const userModel = mongoose.model("Users", user_schema);

//user exercise
const exercises = new mongoose.Schema({
  user_id: { type: String, require: true },
  description: String,
  duration: Number,
  date: String,
  count: Number,
});

// exercise model
const exerciseModel = mongoose.model("exercises", exercises);

//add usersers to db
app.post("/api/users", async (req, res) => {
  let user = req.body;

  const userDoc = new userModel({
    username: user.username,
  });

  // await userDoc.save();
  // userModel
  //   .findOne({ username: user.username })
  //   .then((result) => {
  //     console.log("r", result);
  //     res.json(result);
  //   })
  //   .catch((e) => console.error(e));

  //note we can also save userDoc in a variable while saving it into db
  //and then  use the saved variable to send user info to client side
  const savedDoc = await userDoc.save();

  try {
    res.json(savedDoc);
  } catch (e) {
    res.json("Use informations are not saved in db");
  }
});

//get all the users
app.get("/api/users", (req, res) => {
  userModel
    .find({})
    .sort({ _id: -1 })
    .limit(5)
    .then((data) => {
      res.json(data);
    })
    .catch((e) => console.log(e));
});

//add an exercise based on the user's id
app.post(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    //add new exercice to the user object
    const id = req.params._id;
    //= req.body;

    const body = req.body;

    // let date = body.date;
    // if (date == "") {
    //   date = new Date().toDateString();
    // } else {
    //   date = new Date(date).toDateString();
    // }
    // body.date = date;

    //find the username by id
    const user = await userModel.findById(id);
    try {
      if (!user) {
        res.json("The user does not exist in db");
      } else {
        const exerciseDoc = new exerciseModel({
          user_id: user._id,
          description: body.description,
          duration: body.duration,
          date: body.date ? new Date(body.date) : new Date(),
        });

        const savedExercise = await exerciseDoc.save();

        const { description, duration, date } = savedExercise;

        res.json({
          _id: user._id,
          username: user.username,
          description: savedExercise.description,
          duration: savedExercise.duration,
          date: new Date(savedExercise.date).toDateString(),
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
);

//returieve all the  users and their exercises
app.get(
  "/api/users/:_id/logs",

  async (req, res) => {
    //Retrieve all the user's exercises.
    //Return obj with count prop for how many exo
    //that particular user has.
    //Obj should have desc, dur, and data

    let id = req.params._id;
    let { from, to, limit } = req.query;

    const user = await userModel.findById(id);
    const dateObj = {};
    if (!user) {
      res.json("Sorry, this user doesn't exist");
    } else {
      if (from) {
        dateObj["$gte"] = new Date(from).toDateString();
      }

      if (to) {
        dateObj["$lte"] = new Date(to).toDateString();
      }
    }

    let filt = { user_id: id };

    if (from || to) {
      filt.date = dateObj;
    }

    const exo = await exerciseModel.find(filt).limit(+limit ?? 200);

    const log = exo.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: new Date(e.date).toDateString(),
    }));

    res.json({
      _id: user._id,
      username: user.username,
      log,
      count: exo.length,
    });
  }
);
("");

mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    console.log("app is successfully connected to db");
    const listener = app.listen(process.env.PORT || 3010, () => {
      console.log("Your app is listening on port " + listener.address().port);
    });
  })
  .catch((e) => console.log("Ops, failed to connect"));
