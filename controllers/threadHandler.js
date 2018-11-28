var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var DB_CONNECTION = process.env.DB;

function ThreadHandler() {
  
  this.showThread = (req, res) => {
    var board = req.params.board;
    MongoClient.connect(DB_CONNECTION, (err, db) => {
      var collection = db.collection(board);
      collection.find({}, {reported: 0, delete_password: 0, "replies.delete_password": 0, "replies.reported": 0})
        .sort({bumped_on: -1})
        .limit(10)
        .toArray((err, doc) => {
          doc.forEach((doc) => {
            if (doc.replies.length > 3) doc.replies = doc.replies.slice(-3);
          });
        res.json(doc);
        });
    });
  };
  
  this.newThread = (req, res) => {
    var board = req.params.board;
    var thread = {
      text: req.body.text,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      delete_password: req.body.delete_password,
      replies: []
    };
    MongoClient.connect(DB_CONNECTION, (err, db) => {
      var collection = db.collection(board);
      collection.insert(thread, () => {
        res.redirect('/b/'+board);
      });
    });
  };
  
  this.reportThread = (req, res) => {
    var board = req.params.board;
    MongoClient.connect(DB_CONNECTION, (err, db) => {
      var collection = db.collection(board);
      collection.findAndModify({_id: new ObjectID(req.body.thread_id)}, [], {$set: {reported: true}}, (err, doc) => {});
    });
    res.send('success');
  };
  
  this.deleteThread = (req, res) => {
    var board = req.params.board;
    MongoClient.connect(DB_CONNECTION, (er, db) => {
      var collection = db.collection(board);
      collection.findAndModify({_id: new ObjectID(req.body.thread_id), delete_password: req.body.delete_password}, [], {}, {remove: true, new: false}, (err, doc) => {
        return doc.value === null ? res.send('incorrect password') : res.send('success');
      });
    });
  };
};

module.exports = ThreadHandler;