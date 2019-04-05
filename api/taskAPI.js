var mongoose = require('mongoose');
var Task = require('../models/task');
var User = require('../models/user');
var express = require('express');
router = express.Router();

function parse(param) {
  try {
    return JSON.parse(param);
  } catch(err) {
    return undefined;
  }
}


router.get('/:id', function(req, res) {
  Task.findById(req.params.id)
    .then((task) => {
      if (task) {
        return res.status(200).send({message:"OK", data: task});
      } else {
        return res.status(404).send({message:"NOT FOUND", data: []});
      }
    })
    .catch((err) => {
      if (err.name == "CastError") {
        return res.status(400).send({message:"INVALID ID PROVIDED", data: []});
      }
      return res.status(500).send({message:"SERVER ERROR", data: []});
    })
});


router.delete('/:id', function(req, res) {
  Task.findByIdAndDelete(req.params.id)
    .then((task) => {
      if (task) {
        if (task.assignedUser != "") {
          User.findByIdAndUpdate(task.assignedUser, {$pull: {pendingTasks: task._id}})
            .then();
        }
        return res.status(200).send({message:"OK", data: task});
      } else {
        return res.status(404).send({message:"TASK NOT FOUND", data: []});
      }
    })
    .catch((err) => {
      if (err.name == "CastError") {
        return res.status(400).send({message:"INVALID ID PROVIDED", data: []});
      }
      return res.status(500).send({message:"SERVER ERROR", data: []});
    })
});


router.put('/:id', function(req, res) {
  if (!req.body.name || !req.body.deadline) {
    return res.status(400).send({message:'NO NAME OR DEADLINE PROVIDED', data: []});
  }
  var update = {
    name: req.body.name,
    description: req.body.description,
    deadline: req.body.deadline,
    assignedUser: req.body.assignedUser,
    assignedUserName: req.body.assignedUserName,
    completed: req.body.completed
  }
  var user_id = req.body.assignedUser;
  Task.findByIdAndUpdate(req.params.id, {$set: update}, {new: true})
    .then((updated_task) => {
      if (updated_task) {
        if (user_id) {
          if (updated_task.completed == true) {
            User.findByIdAndUpdate(user_id, {$pull: {pendingTasks: updated_task._id}})
            .then(() => {
              return res.status(200).send({message:"OK", data: updated_task});
            })
            .catch((err) => {
              return res.status(500).send({message:"TASK UPDATED BUT ASSIGNED USER FAIL TO GET IT", data: updated_task});
            });
          } else {
            User.findByIdAndUpdate(user_id, {$push: {pendingTasks: updated_task._id}})
            .then(() => {
              return res.status(200).send({message:"OK", data: updated_task});
            })
            .catch((err) => {
              return res.status(500).send({message:"TASK UPDATED BUT ASSIGNED USER FAIL TO GET IT", data: updated_task});
            });
          }
        } else {
          return res.status(200).send({message:"OK", data: updated_task});
        }
      } else {
        return res.status(404).send({message:"TASK NOT FOUND", data: []});
      }
    })
    .catch((err) => {
      if (err.name == "CastError") {
        return res.status(400).send({message:"INVALID ID PROVIDED", data: []});
      }
      return res.status(500).send({message:"SERVER ERROR", data: []});
    });
});


router.get('/', function(req, res) {
  var where_p = parse(req.query.where);
  var sort_p = parse(req.query.sort);
  var select_p = parse(req.query.select);
  var skip_p = parse(req.query.skip);
  var limit_p = parse(req.query.limit);
  var count_p = req.query.count;

  Task.find(where_p)
      .sort(sort_p)
      .select(select_p)
      .skip(skip_p)
      .limit(limit_p)
      .then((tasks) => {
        if (count_p && count_p.toLowerCase() == "true") {
          return res.status(200).send({message: "OK", data: tasks.length});
        } else {
          return res.status(200).send({message: "OK", data: tasks});
        }
      })
      .catch((err) => {
        return res.status(500).send({message: "SERVER ERROR", data: []});
      });
});


router.post('/', function(req, res) {
  if (!req.body.name || !req.body.deadline) {
    return res.status(400).send({message:'NO NAME OR DEADLINE PROVIDED', data: []});
  }
  var new_task = {
    name: req.body.name,
    description: req.body.description,
    deadline: req.body.deadline,
    assignedUser: req.body.assignedUser,
    assignedUserName: req.body.assignedUserName,
    completed: req.body.completed
  }
  var user_id = req.body.assignedUser;
  var user_name = req.body.assignedUserName;
  Task.create(new_task)
    .then((new_task_res) => {
      if ( user_id ) {
        User.findByIdAndUpdate(user_id, {$push: {pendingTasks: new_task_res._id}})
          .then(() =>{
            return res.status(201).send({message: 'TASK CREATED', data: new_task_res});
          })
          .catch((err) => {
            return res.status(500).send({message: 'Fail TO ASSIGN TASK To USER DUE TO SERVER ERROR', data: []});
          });
      } else {
        return res.status(201).send({message: 'TASK CREATED', data: new_task_res});
      }
    })
    .catch((err) => {
      return res.status(500).send({message: 'FAIL TO CREATE TASK DUE TO SERVER ERROR', data: []});
    });
});


module.exports = router;
