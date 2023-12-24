const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3010;

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(express.static("./public"));

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
  description: { type: String, require: true },
  duration: { type: Number, require: true },
  date: { type: Date },
  count: { type: Number },
});

// exercise model
const exerciseModel = mongoose.model("exercises", exercises);

//add usersers to db
app.post("/api/users", (req, res) => {
  let user = req.body.username;

  const userDoc = new userModel({
    username: user,
  });

  userDoc.save();
  res.json(userDoc);

  // userModel
  //   .findOne({ username: user.username })
  //   .then((result) => {
  //     // console.log("r", result);
  //     res.json(result);
  //   })
  //   .catch((e) => console.error(e));

  //note we can also save userDoc in a variable while saving it into db
  //and then  use the saved variable to send user info to client side

  // const savedDoc = await userDoc.save();
  // try {
  //   res.json(savedDoc);
  // } catch (e) {
  //   res.json("Use informations are not saved in db");
  // }
});

//get all the users
app.get("/api/users", (req, res) => {
  userModel
    .find({})
    .then((data) => {
      res.json(data);
    })
    .catch((e) => console.log(e));
});

const dateFormatter = (date) => {
  let local = new Date(date).toDateString().split(" ");
  local[2] = date.getUTCDate();
  local.join(" ");
  return new Date(local).toDateString();

  // dateFormatted = dateFormatted.substring(0, 16).replace(",", "");
};
// //add an exercise based on the user's id

app.post(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    //add new exercice to the user object
    const id = req.params._id;
    const { description, duration, date } = req.body;
    const body = req.body;

    const exerciseObj = {
      user_id: id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    };

    //find the user by id
    await userModel
      .findById(id)
      .then((user) => {
        if (!user) {
          res.json("The user does not exist in our db");
        } else {
          const exerciseDoc = new exerciseModel(exerciseObj);
          const savedExercise = exerciseDoc.save();
          savedExercise.then((result) => {
            res.json({
              username: user.username,
              description: result.description,
              duration: result.duration,
              date: dateFormatter(new Date(result.date)),
              _id: user._id,
            });
          });
        }
      })
      .catch((e) => console.error(e));
  }
);

// //returieve all the  users and their exercises
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

    let filter = { user_id: id };

    if (from || to) {
      filter.date = dateObj;
    }

    const exo = await exerciseModel.find(filter).limit(+limit ?? 200);

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

mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    console.log("app is successfully connected to db");
    app.listen(PORT, () => {
      console.log(`Your app is listening on port ${PORT}`);
    });
  })
  .catch((e) => console.log("Ops, failed to connect", e));
