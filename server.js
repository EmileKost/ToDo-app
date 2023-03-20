if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

//Setting up express server and other necissities
const express = require("express");
const app = express();
const port = 44500;
const bcrypt = require("bcrypt"); //for encrypting and comparing passwords

// basic setup for passport
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodeOverride = require("method-override");

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

// Connection do database
const mongoose = require("mongoose");
const User = require("./models/user.js");
const dbURI =
  "mongodb+srv://EmileKost:edjk171200@todo.lpg8q23.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(
    (result) => app.listen(port),
    console.log(`Database connected, port: ${port}`)
  )
  .catch((error) => console.log(error + "has occured"));

const users = []; //change this to mongodb later

// Set view engine to render ejs (html)
app.set("view engine", "ejs");
app.use(express.static("public"));
// With this we can acces form data in the request
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(methodeOverride("_method"));

//Render the home page
// While rendering you can add a second parameter which is an object you can pass in basicaly everything
app.get("/", checkAuthenticated, (req, res) => {
  res.render("index", { name: "Emile" });
});

// login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// register
app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10); //secures password and is still fast
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    user
      .save()
      .then((result) => {
        console.log(result);
      })
      .catch((err) => console.log(err));

    res.redirect("/");
  } catch (e) {
    console.log(e);
    res.redirect("/register");
  }
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

//Route for register using express.Router()
// const registerRouter = require("./routes/register.js");
// app.use("/register", registerRouter);
