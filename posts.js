const express = require("express");
const mongo = require("mongodb");
const timeManager = require("./timeManager.js");
const app = express();

const newPost = async (authorIdIn, contentIn, isCommentIn) => {
    const client = new mongo.MongoClient(process.env.uri);

    await client.connect();

    const db = client.db("town");   
    const posts = db.collection("posts");
    const users = db.collection("users");

    const author = await users.findOne({_id: authorIdIn});

    await posts.insertOne({
        authorId: authorIdIn,
        content: contentIn,
        time: timeManager.getTime(),
        city: author.city,
        isComment: isCommentIn
    });

    client.close();
};

const retrieveAllPosts = async () => {
    const client = new mongo.MongoClient(process.env.uri);

    await client.connect();

    const db = client.db("town");

    const posts = db.collection("posts");

    const poop = await posts.find().toArray();

    client.close();
    return poop;
};

const deletePost = async (postId) => {
    const client = new mongo.MongoClient(process.env.uri);

    await client.connect();

    const db = client.db("town");

    const posts = db.collection("posts");

    await posts.deleteOne({_id: postId});

    client.close();
}

const editPost = async (postId, newContent) => {
    
    const client = new mongo.MongoClient(process.env.uri);

    await client.connect();

    const db = client.db("town");   
    const posts = db.collection("posts");
    const users = db.collection("users");

    const author = await users.findOne({_id: authorIdIn});

    // await posts.insertOne({
    //     authorId: authorIdIn,
    //     content: contentIn,
    //     time: timeManager.getTime(),
    //     city: author.city,
    //     isComment: isCommentIn
    // });

    await posts.updateOne({_id: postId}, { $set: {
            content: newContent,
            edited: true,
            editTime: timeManager.getTime()
        }});

    client.close();

}

// const temp = async (postId) => {
//     const client = new mongo.MongoClient(process.env.uri);

//     await client.connect();

//     const db = client.db("town");

//     const posts = db.collection("posts");
//     const users = db.collection("users");

//     const a = await users.findOne({test: "fart123"});

//     console.log(a.password);

//     client.close();
// }

// temp();

const PORT = process.env.PORT || 6969;

app.use(express.static("./"));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

