var mongoose = require('mongoose');
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
  User.findById(req.params.id)
    .then((user) => {
      if (user) {
        return res.status(200).send({message:"OK", data: user});
      } else {
        return res.status(404).send({message:"NOT FOUND", data: []});
      }
    })
    .catch((err) => {
      return res.status(500).send({message:"SERVER ERROR", data: []});
    })
});


router.delete('/:id', function(req, res) {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res.status(200).send({message:"OK", data: user});
      } else {
        return res.status(404).send({message:"NOT FOUND", data: []});
      }
    })
    .catch((err) => {
      return res.status(500).send({message:"SERVER ERROR", data: []});
    })
});


router.put('/:id', function(req, res) {
  if (!req.body.name || !req.body.email) {
    return res.status(400).send({message:'NO NAME OR EMAIL PROVIDED', data: []});
  }
  var update = {
    name: req.body.name,
    email: req.body.email
  }
  User.findOne({email: req.body.email})
    .then((user) => {
      if (user) {
        return res.status(400).send({message:'EMAIL ALREADY EXISTS', data: []});
      } else {
        User.findByIdAndUpdate(req.params.id, {$set: update}, {new: true})
          .then((updated_user) => {
            if (updated_user) {
              return res.status(200).send({message:"OK", data: updated_user});
            } else {
              return res.status(404).send({message:"NOT FOUND", data: []});
            }
          })
          .catch((err) => {
            return res.status(500).send({message:"SERVER ERROR", data: []});
          });
      }
    })
  .catch((err) => {
    return res.status(500).send({message: 'SERVER ERROR', data: []});
  });
});


router.get('/', function(req, res) {
  var where_p = parse(req.query.where);
  var sort_p = parse(req.query.sort);
  var select_p = parse(req.query.select);
  var skip_p = parse(req.query.skip);
  var limit_p = parse(req.query.limit);
  var count_p = req.query.count;

  User.find(where_p)
      .sort(sort_p)
      .select(select_p)
      .skip(skip_p)
      .limit(limit_p)
      .then((users) => {
        if (count_p && count_p.toLowerCase() == "true") {
          return res.status(200).send({message: "OK", data: users.length});
        } else {
          return res.status(200).send({message: "OK", data: users});
        }
      })
      .catch((err) => {
        return res.status(500).send({message: "SERVER ERROR", data: []});
      });
});


router.post('/', function(req, res) {
  if (!req.body.name || !req.body.email) {
    return res.status(400).send({message:'NO NAME OR EMAIL PROVIDED', data: []});
  }
  var new_user = {
    name: req.body.name,
    email: req.body.email
  }
  User.findOne({email: req.body.email})
    .then((user) => {
      if (user == null) {
        User.create(new_user)
          .then((new_user_res) => {
            return res.status(201).send({message: 'ACCOUNT CREATED', data: new_user_res});
          })
          .catch((err) => {
            return res.status(500).send({message: 'SERVER ERROR', data: []});
          });
      } else {
        return res.status(400).send({message:'EMAIL ALREADY EXISTS', data: []});
      }
    })
    .catch((err) => {
      return res.status(500).send({message: 'SERVER ERROR', data: []});
    });
});


module.exports = router;
