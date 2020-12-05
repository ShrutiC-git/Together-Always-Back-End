const friends_router = require("express").Router();
var needle = require('needle');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://127.0.0.1:27017/";

var token = 'AAAAAAAAAAAAAAAAAAAAADJ8KQEAAAAAi7OztS1ohQL9RRT0MNkPXhmwsEQ%3Dfo0tvubIHQOxvb09MowiIiVuyHUnIRh9UPGIk1YjlyppMk6xOr'


friends_router.route('/')
    .get(async (req, res, next) => {
        console.log('The screenaname is ', req.user.screenName)
        const response = await needle('get', `https://api.twitter.com/1.1/followers/list.json?screen_name=${req.user.screenName}&count=2`,
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
                console.log(friend.name)
                MongoClient.connect(url, async function (err, db) {
                    var database = db.db("Twitter-MH");
                    var collection = database.collection('followers');
                    const filter = { screenName: req.user.screenName }
                    const tweets = await needle('get', `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${friend.name}&count=1`, {
                        headers: {
                            "authorization": `Bearer ${token}`
                        }
                    })
                    
                    if (tweets.body) {
                        console.log(tweets.body[0].text)

                    }
                    else {
                        throw new Error('Unsuccessful request')
                    }


                    /*                     const insertDoc = {
                                            user_screenname: req.user.screenName,
                                            follower_screenname: friend.name,
                                            follower_location: friend.location,
                                            description: friend.description,
                                        }
                                        const result = await collection.insertOne(insertDoc);
                                        console.log(`${result.insertedCount} documents`) */
                })
            })
        }
    })


module.exports = friends_router;
