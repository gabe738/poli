// All the imports, Express, MongoDB(for storing users), crypto for data safety, path for routing
const express = require("express");
const mongo = require("mongodb");
const crypto = require("crypto"); // Not crypto currency, but instead protecting user data with encryption
const path = require("path");
const app = express();

//Set up the connection to MongoDB using our API key in .env
const client = new mongo.MongoClient(process.env.uri);
const db = client.db("town");   
const users = db.collection("users");
const posts = db.collection("posts");

const PORT = process.env.PORT || 6969;

// Some rendering code, more boilerplate effectively
app.set("view engine", "ejs");
app.use(express.json());

// Gotta prevent that cross-site scripting
const sanitize = data => {
    return escape(data.replaceAll(/(<|>|\/|"|'|`|\\)/g, "")).trim(); // improve fr
}

// Following this is what connects the front end to the back end
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/main/index.html")); // Fetches main site
})

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/createAccount/index.html")); // Fetches account creation site
})

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/login/login.html")); // Fetches login site
})

app.post("/signup", async (req, res) => { // The method to signup users
    const name = sanitize(req.body.name);
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);
    const confirmed_password = sanitize(req.body.confirm_password);
    const email = sanitize(req.body.email);
    const phoneNumber = sanitize(req.body.phone);

    if (!username || !password) {
        res.sendStatus(400); // bad request
        return;
    }

    if (password != confirmed_password) { // Alert users if passwords to not match
        res.status(400).send("The passwords do not match, please try again.");
        return;
    }


    const passHash = crypto.createHash("sha256"); // Creates a hashing method that allows us to save passwords securely
    passHash.update(password);


    // Code to check and see if someone with that username already exists
    const foundUser = await users.findOne({ username_lower: username.toLowerCase() })
    if (foundUser) {
        res.status(400).send("A user already exists with this username: Consider using a different username; or trying to log in with that username."); // error notification
        return;
    }

    const userCookie = crypto.randomUUID(); // Temporary cookie that allows people to not have to re-log in, and to validate posts

    users.insertOne({
        name: name,
        username: username,
        username_lower: username.toLowerCase(),
        password_hash: passHash.digest("hex"),
        email: email,
        phone: phoneNumber,
        cookie: userCookie
    })

    res.status(200).json({
        cookie: userCookie // Saves our temporary log in cookie in local storage
    });

    console.log("user created:", username); // Tells us it works
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