const express = require("express");
const mongo = require("mongodb");
const timeManager = require("./timeManager.js"); // I MADE THIS! It uses ISO 8601 and turns it into time in milliseconds to enable easy comparisons from time
const app = express();

const sanitize = data => { // Redefining it because we felt it was easier to copy paste instead of importing it
    return escape(data.replaceAll(/(<|>|\/|"|'|`|\\)/g, "")).trim(); // improve fr
}

app.get("/newPost", (req, res) => { // authorId, titleIn, content, city, isComment(not used) ---- USED to create new posts after sanatizing
    const authorIdIn = req.body.authorId;
    const titleIn = sanitize(req.body.titleIn);
    const contentIn = sanitize(req.body.content);
    const cityIn = req.body.city;
    const isComment = req.body.isComment;

    const client = new mongo.MongoClient(process.env.uri); // The mongoDB setup code
    client.connect();
    const db = client.db("town");   
    const posts = db.collection("posts");
    const users = db.collection("users");

    const author = users.findOne({_id: authorIdIn}); // We attach the author to help with moderation

    posts.insertOne({ 
        authorId: authorIdIn,
        title: titleIn,
        content: contentIn,
        time: timeManager.getTime(),  // Still really proud I made this
        city: cityIn,
        isComment: isCommentIn
    });

    client.close(); // Gotta tie up those loose ends
});

app.post("/retrieveAllPosts", (req, res) => { // requests: page, city

    const cityIn = req.body.city;

    const client = new mongo.MongoClient(process.env.uri); // Generally setting up a MongoDB connection
    client.connect();
    const db = client.db("town");
    const posts = db.collection("posts");

    const allPosts = posts.find({city: cityIn}).toArray(); // Takes the posts and puts it into array
    
    client.close(); // Closes the loose ends

    if (allPosts.length <= req.body.page * 5 || allPosts.length <= 5) res.json(allPosts.slice(0).slice(-5));
    else {
        const returnPosts = [];
        for (let i = (req.body.page * 5) - 5; i < req.body.page * 5; i++) {
            returnPosts.push(allPosts[i]);
        }
        res.json(returnPosts);
    }

});

app.post("/searchPosts", (req, res) => { // searchTerm, page

    const cityIn = req.body.city;

    const search = sanitize(req.body.searchTerm);
    
    const client = new mongo.MongoClient(process.env.uri);

    client.connect();

    const db = client.db("town");

    const posts = db.collection("posts");

    const allPosts = posts.find({
        title: search,
        city: cityIn
    }).toArray();
    
    client.close();

    if (allPosts.length <= req.body.page * 5 || allPosts.length <= 5) res.json(allPosts.slice(0).slice(-5));
    else {
        const returnPosts = [];
        for (let i = (req.body.page * 5) - 5; i < req.body.page * 5; i++) {
            returnPosts.push(allPosts[i]);
        }
        res.json(returnPosts);
    }

});

app.get("/deletePost", (req, res) => { // postId
    const postId = req.body.postId;

    const client = new mongo.MongoClient(process.env.uri);

    client.connect();

    const db = client.db("town");

    const posts = db.collection("posts");

    posts.deleteOne({_id: postId});

    client.close();
});

app.get("/editPost", (req, res) => { // postId, authorIdIn, newContent
    
    const postId = req.body.postId;
    const authorIdIn = req.body.authorIdIn;
    const newContent = sanitize(req.body.newContent);

    const client = new mongo.MongoClient(process.env.uri);

    client.connect();

    const db = client.db("town");   
    const posts = db.collection("posts");
    const users = db.collection("users");

    const author = users.findOne({_id: authorIdIn});

    posts.updateOne({_id: postId}, { $set: {
        content: newContent,
        edited: true,
        editTime: timeManager.getTime()
    }});

    client.close();

});



const PORT = process.env.PORT || 6969;

app.use(express.static("./"));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

