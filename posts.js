const express = require("express");
const mongo = require("mongodb");
const timeManager = require("./timeManager.js");
const app = express();

const sanitize = data => {
    return escape(data.replaceAll(/(<|>|\/|"|'|`|\\)/g, "")).trim(); // improve fr
}

app.get("/newPost", (req, res) => { // authorId, titleIn, content, isComment
    const authorIdIn = req.body.authorId;
    const titleIn = sanitize(req.body.titleIn);
    const contentIn = sanitize(req.body.content);
    const isComment = req.body.isComment;

    const client = new mongo.MongoClient(process.env.uri);

    client.connect();

    const db = client.db("town");   
    const posts = db.collection("posts");
    const users = db.collection("users");

    const author = users.findOne({_id: authorIdIn});

    posts.insertOne({
        authorId: authorIdIn,
        title: titleIn,
        content: contentIn,
        time: timeManager.getTime(),
        city: author.city,
        isComment: isCommentIn
    });

    client.close();
});

app.post("/retrieveAllPosts", (req, res) => { // requests: page

    const client = new mongo.MongoClient(process.env.uri);

    client.connect();

    const db = client.db("town");

    const posts = db.collection("posts");

    const allPosts = posts.find().toArray();
    
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

app.post("/searchPosts", (req, res) => { // searchTerm, page

    const search = sanitize(req.body.searchTerm);
    
    const client = new mongo.MongoClient(process.env.uri);

    client.connect();

    const db = client.db("town");

    const posts = db.collection("posts");

    const allPosts = posts.find({
        title: search
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

