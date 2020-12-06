const friends_router = require("express").Router();
const { AggregationCursor } = require("mongoose");
var needle = require('needle');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1:27017/";

var token = 'AAAAAAAAAAAAAAAAAAAAADJ8KQEAAAAAi7OztS1ohQL9RRT0MNkPXhmwsEQ%3Dfo0tvubIHQOxvb09MowiIiVuyHUnIRh9UPGIk1YjlyppMk6xOr'


friends_router.route('/')
    .get(async (req, res, next) => {
        console.log('The screenaname is ', req.user.screenName)
        const response = await needle('get', `https://api.twitter.com/1.1/followers/list.json?screen_name=${req.user.screenName}&count=3`,
            {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            })
        if (response.body) {
            //console.log('The body is', response.body.ids)
            const friends = response.body.users;
            //console.log(friends);
            friends.forEach(function (friend) {
                //console.log(friend)
                MongoClient.connect(url, async function (err, db) {
                    var database = db.db("Twitter-MH");
                    var collection = database.collection('mental_health_analysis');
                    const filter = { screenName: req.user.screenName }
                    const tweets = await needle('get', `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${friend.screen_name}&count=2`, {
                        headers: {
                            "authorization": `Bearer ${token}`
                        }
                    })
                    if (tweets.body) {
                        //console.log('Body is going to be', tweets.body[0].text)
                        const store = tweets.body;
                        //console.log(store);
                        store.forEach(async function (value) {
                            needle.post('http://127.0.0.1:5000/predict', {
                                message: value.text
                            }, async (err, res) => {
                                if (err) {
                                    throw err;
                                }
                                else {
                                    const insertDoc = {
                                        user_screenname: req.user.screenName,
                                        follower_name: friend.name,
                                        follower_screenname: friend.screen_name,
                                        follower_location: friend.location,
                                        follower_profile_image: friend.profile_image_url,
                                        description: friend.description,
                                        tweet: value.text,
                                        flag: res.body.prediction[0]
                                    }
                                    //console.log(insertDoc)
                                    const result = await collection.insertOne(insertDoc);
                                    //console.log(`${result.insertedCount} documents`);
                                }
                            })
                        })
                    }
                    else {
                        throw new Error('Unsuccessful request')
                    }
                })
            })
            MongoClient.connect(url, async function (err, db) {
                var database = db.db("Twitter-MH");
                var collection = database.collection('mental_health_analysis');
                /*                 collection.find({}, function (err, cursor) {
                                    cursor.toArray().forEach(function (doc) {
                                        console.log(doc);
                                    }) */
                var cursor = collection.find({ flag: 1 })
                cursor.next().then(doc => {
                    console.log(doc)
                    res.jsonp({
                        follower_screenname: doc.follower_screenname,
                        follower_name: doc.follower_name,
                        follower_profile_image: doc.follower_profile_image
                    })
                })
            })
/*             res.json({
                success: true,
                message: 'users are well'
            }) */
        }
    })


module.exports = friends_router;

