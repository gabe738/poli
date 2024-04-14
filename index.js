// all the imports; express, mongo (for storing users and posts), crypto for data safety, path for routing
const express = require("express");
const mongo = require("mongodb");
const crypto = require("crypto"); // cryptography, not crypto currency
const path = require("path");
const app = express();

// set up mongo using our auth token in .env
const client = new mongo.MongoClient(process.env.uri);
const db = client.db("town");   
const users = db.collection("users");
const posts = db.collection("posts");

const PORT = process.env.PORT || 6969;

// html + js templating, json request body parsing
app.set("view engine", "ejs");
app.use(express.json());

// load static files
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/main/index.html")); // load main
})

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/signUp/signUp.html")); // load signup page
})

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/login/login.html")); // load login page
})

const allowedCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

app.post("/register", async (req, res) => { // runs after user clicks signup
    const name = req.body.name;
    const username = req.body.username;
    const password = req.body.password;
    const confirmed_password = req.body.confirm_password;
    const email = req.body.email;
    const phoneNumber = req.body.phone;

    if (!username || !password) { // missing required fields
        res.sendStatus(400); // bad request
        return;
    }

    for (const character of username)
        if (!allowedCharacters.includes(character)) {
            res.status(400).send("Error: Username can only contain letters and numbers.");
            return;
        }

    for (const character of username)
        if (!allowedCharacters.includes(character)) {
            res.status(400).send("Error: Username can only contain letters and numbers.");
            return;
        }

    if (password != confirmed_password) { // check that both passwords forms match
        res.status(400).send("Error: The passwords do not match, please try again.");
        return;
    }

    const passHash = crypto.createHash("sha256"); // save passwords securely
    passHash.update(password);

    // is the username/email taken?
    const foundUser = await users.findOne({ 
        $or: [
            { username_lower: username.toLowerCase() },
            { email: email.toLowerCase() }
        ]
    })

    if (foundUser) {
        res.status(400).send("Error: Account already exists!"); // error notification
        return;
    }

    const userCookie = crypto.randomUUID(); // secure random string for cookies

    users.insertOne({
        // add user profile to database
        name: name,
        username: username,
        username_lower: username.toLowerCase(),
        password_hash: passHash.digest("hex"),
        email: email.toLowerCase(),
        phone: phoneNumber,
        cookie: userCookie
    })

    res.status(200).json({ cookie: userCookie }); // remember user on the frontent (localhost)

    console.log("user created:", username);
})

app.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) { // There wasn't a username or password
        res.sendStatus(400); // bad request
        return;
    }

    const passHash = crypto.createHash("sha256");
    passHash.update(password);
    
    const foundUser = await users.findOne({ email: email.toLowerCase() }) // Checks for a user with that name
    
    if (!foundUser) { // wrong username
        res.status(400).send("Error: User not found!"); // bad request
        return;
    }

    if (foundUser.password_hash != passHash.digest("hex")) { // wrong password
        res.status(401).send("Error: Password incorrect!"); // unauthorized
        return;
    }

    // successfully logged in
    
    // generate cookie
    const userCookie = crypto.randomUUID();

    // set cookie
    users.updateOne({ _id: foundUser._id }, { $set: { cookie: userCookie } });

    // send cookie
    res.status(200).json({ cookie: userCookie });
})

app.get("/assets/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "./favicon.ico"));
})

app.get("*", (req, res) => { // 404 page
    res.sendFile(path.join(__dirname, "./404.html"));
})

app.listen(PORT, () => console.log(`listening on port ${PORT}`)); // start server