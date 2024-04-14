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


const sanitize = data => {
    // deletes characters that could cause cross-site scripting
    return escape(data.replaceAll(/(<|>|\/|"|'|`|\\)/g, "")).trim();
}

// load static files
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/main/index.html")); // load main
})

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/createAccount/index.html")); // load signup page
})

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/login/login.html")); // load login page
})

app.post("/signup", async (req, res) => { // runs after user clicks signup
    const name = sanitize(req.body.name);
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);
    const confirmed_password = sanitize(req.body.confirm_password);
    const email = sanitize(req.body.email);
    const phoneNumber = sanitize(req.body.phone);

    if (!username || !password) { // missing required fields
        res.sendStatus(400); // bad request
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

app.post("/login", (req, res) => {
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);

    if (!username || !password) { // There wasn't a username or password
        res.sendStatus(400); // bad request
        return;
    }

    const passHash = crypto.createHash("sha256");
    passHash.update(password);
    
    const foundUser = users.findOne({ username_lower: username.toLowerCase() }) // Checks for a user with that name
    
    if (!foundUser) { // When it can't find a user
        res.sendStatus(400); // bad request
        return;
    }

    if (foundUser.password_hash != passHash.digest("hex")) { // The incorrect password was used
        res.sendStatus(401); // unauthorized
        return;
    }

    // successfully loged in !!! (need ot code)
})



app.get("*", (req, res) => { // Our 404 page so we don't show a blank error
    res.sendFile(path.join(__dirname, "./404.html"));
})

app.listen(PORT, () => console.log(`listening on port ${PORT}`)); // Boilerplate