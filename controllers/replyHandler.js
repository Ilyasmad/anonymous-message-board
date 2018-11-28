var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var DB_CONNECTION = process.env.DB;

function ReplyHandler() {
  
  this.showReplies = (req, res) => {
    var board = req.params.board;
    MongoClient.connect(DB_CONNECTION, (err, db) => {
      var collection = db.collection(board);
      collection.find({_id: new ObjectID(req.query.thread_id)}, {reported: 0, delete_password: 0, "replies.delete_password": 0, "replies.reported": 0})
        .toArray((err, doc) => res.json(doc[0]));
    });                 
  };
  
  this.newReply = (req, res) => {
    var board = req.params.board;
    var reply = {
      id: new ObjectID(),
      text: req.body.text,
      created_on: new Date(),
      reported: false,
      delete_password: req.body.delete_password,
    };
    MongoClient.connect(DB_CONNECTION, (err, db) => {
      var collection = db.collection(board);
      collection.findAndModify({_id: new ObjectID(req.body.thread_id)}, [], {$set:{bumped_on: new Date()}, $push: {replies: reply}}, (err, doc) => {});
    });
    res.redirect('/b/'+board+'/'+req.body.thread_id);
  };
  
  this.reportReply = (req, res) => {
    var board = req.params.board;
    MongoClient.connect(DB_CONNECTION, (err, db) => {
      var collection = db.collection(board);
      collection.findAndModify({_id: new ObjectID(req.body.thread_id), "replies._id": new ObjectID(req.body.reply_id)}, [], { $set: { "replies.$.reported": true } }, (err, doc) => {});
    });
    res.send('success');
  };
  
  this.deleteReply = (req, res) => {
    var board = req.params.board;
    MongoClient.connect(DB_CONNECTION, (err, db) => {
      var collection = db.collection(board);
      collection.findAndModify(
        {
          _id: new ObjectID(req.body.thread_id),
          replies: { $elemMatch: { _id: new ObjectID(req.body.reply_id), delete_password: req.body.delete_password } },
        },
        [],
        { $set: { "replies.$.text": "[deleted]" } },
        (err, doc) => doc.value === null ? res.send('Incorrect password') : res.send('success')
        );
    });
  };
};

module.exports = ReplyHandler;