// all the imports; express, mongo (for storing users and posts), crypto for data safety, path for routing
const express = require("express");
const mongo = require("mongodb");
const crypto = require("crypto"); // cryptography, not crypto currency
const path = require("path");
const { parse } = require("csv-parse");
const fs = require("fs");
const app = express();

const timeManager = require("./timeManager.js");

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

app.post("/newPost", async (req, res) => { // authorId, titleIn, content, city, isComment(not used) ---- USED to create new posts after sanatizing
    const cookie = req.body.cookie;
    const title = req.body.title;
    const content = req.body.content;
    const city = req.body.city;
    const isComment = req.body.is_comment;

    // const author = users.findOne({ _id: authorId }); // We attach the author to help with moderation

    const author = await users.findOne({ cookie: cookie });

    if (!author) {
        res.status(400);
        return;
    }

    posts.insertOne({ 
        authorId: author._id,
        title: title,
        content: content,
        time: timeManager.getTime(),  // Still really proud I made this
        city: city,
        isComment: isComment
    });

    console.log(await posts.find().toArray());

    res.send(200);
});

app.post("/retrieveAllPosts", (req, res) => { // requests: city
    const city = req.body.city;

    const allPosts = posts.find({ city: city }).toArray(); // Takes the posts and puts it into array

    res.json(allPosts);
});

app.post("/searchPosts", (req, res) => { // searchTerm, page
    const city = req.body.city;
    const search = req.body.searchTerm;

    const allPosts = posts.find({
        title: search,
        city: city
    }).toArray();

    if (allPosts.length <= req.body.page * 5 || allPosts.length <= 5) 
        res.json(allPosts.slice(0).slice(-5));
    else {
        const returnPosts = [];

        for (let i = (req.body.page * 5) - 5; i < req.body.page * 5; i++)
            returnPosts.push(allPosts[i]);

        res.json(returnPosts);
    }
});

app.post("/deletePost", (req, res) => {
    const ownerCookie = req.body.cookie; // user passes in their cookie. you can only delete a post if you are the one who wrote it
    const postId = req.body.post_id;

    const author = users.findOne({ cookie: ownerCookie });
    const post = posts.findOne({ _id: postId });

    if (!author || !post) {
        res.status(400);
        return;
    }

    if (post.authorId != author._id) {
        res.status(401).send("Error: You aren't the author of this post!");
        return;
    }

    posts.deleteOne({ _id: postId });

    res.sendStatus(200);
});

app.post("/editPost", (req, res) => { // postId, authorIdIn, newContent
    const postId = req.body.post_id;
    const authorIdIn = req.body.author_id;
    const newContent = req.body.new_content;

    const author = users.findOne({ _id: authorIdIn });
    const post = posts.findOne({ _id: postId });

    if (!author || !post) {
        res.status(400);
        return;
    }

    if (post.authorId != author._id) {
        res.status(401).send("Error: You aren't the author of this post!");
        return;
    }

    posts.updateOne({ _id: postId }, { $set: {
        content: newContent,
        edited: true,
        editTime: timeManager.getTime()
    }});
});

app.post("/autocompleteCity", async (req, res) => { // searchTerm
    const searchTerm = req.body.searchTerm;

    const possibleCities = [];

    const cities = fs.readFileSync("./cities.csv", { encoding: "utf8" });

    for (let line of cities.split("\n")) {
        line = line.replace(",", ", ");

        if (line.toLowerCase().startsWith(searchTerm.toLowerCase())) 
            possibleCities.push(line);
    }
    
    res.json(possibleCities);
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/profile/profile.html")); // load user page
})

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/signUp/signUp.html")); // load signup page
})

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/login/login.html")); // load login page
})

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
        if (!"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".includes(character)) {
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

    res.json({ cookie: userCookie }); // remember user on the frontent (localhost)

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
    res.json({ cookie: userCookie });
})

app.post("/accountInfo", async (req, res) => {
    const userCookie = req.body.cookie;

    if (!userCookie) {
        res.status(400);
        return;
    }

    const foundUser = await users.findOne({ cookie: userCookie });

    if (!foundUser) {
        res.status(400);
        return;
    }

    res.send({ name: foundUser.name, username: foundUser.username }); // return user details
})

app.get("/assets/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "./favicon.ico"));
})

app.get("*", (req, res) => { // 404 page
    res.sendFile(path.join(__dirname, "./404.html"));
})

app.listen(PORT, () => console.log(`listening on port ${PORT}`)); // start server