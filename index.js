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
  date: { type: Date, default: new Date() },
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

// //add an exercise based on the user's id

// app.post("/api/users/:_id/exercises", async (req, res) => {
//   const userId = req.params._id;

//   const exerciseObj = {
//     userId,
//     description: req.body.description,
//     duration: req.body.duration,
//   };
//   if (req.body.date != "") {
//     exerciseObj.date = req.body.date;
//   }

//   //const exercise = new exerciseModel(exerciseObj);

//   const doc = await userModel
//     .findById(userId)
//     .then((data) => {
//       //if (userId) {
//       exercise.save();
//       res.json({
//         username: data.username,
//         description: exercise.description,
//         duration: exercise.duration,
//         date: exercise.date.toDateString(),
//         _id: data._id,
//       });
//       //}
//     })
//     .catch((e) => console.error(e));
//   // try {
//   //   if (!doc) {
//   //     res.json("The user doesn't exist in our db");
//   //   } else {
//   //     const exercise = new exerciseModel(exerciseObj);
//   //     const savedExercise = await exercise.save();

//   //     res.json({
//   //       username: doc.username,
//   //       _id: doc._id,
//   //       description: savedExercise.description,
//   //       duration: savedExercise.duration,
//   //       date: savedExercise.date
//   //         ? exercise.date.toDateString()
//   //         : new Date().toDateString(),
//   //     });
//   //   }
//   // } catch (e) {
//   //   console.log("er", e);
//   // }
// });

app.post(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: true }),
  async (req, res) => {
    //add new exercice to the user object
    const id = req.params._id;
    //= req.body;

    const body = req.body;

    const exerciseObj = {
      user_id: id,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString(),
    };
    console.log("objec", exerciseObj);

    //,

    const savedExo = new exerciseModel(exerciseObj);

    // userModel
    //   .findById(id)
    //   .then((result) => {

    //     res.json({
    //       _id: result._id,
    //       username: result.username,
    //       description: savedExo.description,
    //       duration: savedExo.duration,
    //       date: new Date(savedExo.date).toDateString(),
    //     });
    //   })
    //   .catch((e) => console.log(e));

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
          username: user.username,
          user_id: user._id,
          description: body.description,
          duration: body.duration,
          date: body.date
            ? new Date(body.date).toDateString()
            : new Date().toDateString(),
        });

        // ? new Date(body.date).toDateString()
        //   : new Date().toDateString(),
        const savedExercise = await exerciseDoc.save();

        //const { description, duration, date } = savedExercise;
        res.json({
          username: user.username,
          _id: user._id,
          description: savedExercise.description,
          duration: savedExercise.duration,
          date: savedExercise.date,
        });
      }
    } catch (e) {
      console.log(e);
    }
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
    console.log("user", user);
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
    console.log("exoe", exo);

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
  .catch((e) => console.log("Ops, failed to connect"));
