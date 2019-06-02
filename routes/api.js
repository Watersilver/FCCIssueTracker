/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB;

module.exports = function (app, db) {
    console.log('Database ready! Setting routes...')
    
    app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      
      let obId;
      try {
        obId = ObjectId(req.query._id);
      } catch(error) {
        obId = null;
      }
      
      const query = {...req.query};
      
      // Convert string input to appropriate input
      if (req.query._id && obId) query._id = obId;
      if (req.query.open) query.open = req.query.open === "true";
      
      db.collection(project).find(query).toArray()
        .then(docs => res.json(docs))
        .catch(err => res.send(err));
    })
    
    .post(function (req, res){
      var project = req.params.project;
      
      // Check if required fields have been filled out.
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by)
        return res.send("Please fill out the required fields.");
      
      const currentTime = new Date();
      
      // Insert required fields
      const docToBeInserted = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        open: true,
        created_on: currentTime,
        updated_on: currentTime,
        assigned_to: req.body.assigned_to || "",
        status_text: req.body.status_text || ""
      };
      
      db.collection(project).insertOne(docToBeInserted)
        .then(result => {
        res.json(result.ops[0]);
      }).catch(err => res.send(err));
    })
    
    .put(function (req, res){
      var project = req.params.project;
      
      const rb = req.body;
      
      const _id = rb._id;
      let obId;
      
      if (!_id) return res.send("_id error");
      
      try {
        obId = ObjectId(_id);
      }
      catch(error) {
        return res.send('could not update '+_id);
      }
      
      const updatedDoc = { updated_on: new Date() };
      
      if (rb.issue_title) updatedDoc.issue_title = rb.issue_title;
      if (rb.issue_text) updatedDoc.issue_text = rb.issue_text;
      if (rb.created_by) updatedDoc.created_by = rb.created_by;
      if (rb.open) updatedDoc.open = !rb.open;
      if (rb.assigned_to) updatedDoc.assigned_to = rb.assigned_to;
      if (rb.status_text) updatedDoc.status_text = rb.status_text;
      
      db.collection(project).findOneAndUpdate(
        { _id:  obId },
        { $set: updatedDoc }
      ).then(doc => {
        
        if (rb.issue_title || rb.issue_text || rb.created_by || rb.open || rb.assigned_to || rb.status_text)
          res.send('successfully updated');
        else
          res.send("no updated field sent");
        
      }).catch(err => {
        res.send(err);
      });
      
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      
      const _id = req.body._id;
      let obId;
      
      if (!_id) return res.send("_id error");
      
      try {
        obId = ObjectId(_id);
      }
      catch(error) {
        return res.send('could not delete '+_id);
      }
      
      console.log('Attempting to delete ' + _id + '...');
      
      db.collection(project).findOneAndDelete({_id: obId})
        .then(result => {
        
        if (!result.value) return res.json({failed: 'could not delete '+_id});
        
        res.json({success: 'deleted '+ _id});
      }).catch(err => {
        console.error(err);
        res.send(err);
      });
    });
    
    console.log('Routes set...');
  
};