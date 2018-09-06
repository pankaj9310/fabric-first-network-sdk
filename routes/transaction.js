

var express = require('express');
var router = express.Router();

// var client = require('../application/Transaction')
var mycc = require('../application/controller/mycc_controller')
//GET transaction details
router.get('/:id', function(req, res, next) {
    console.log(req.params.id);
  mycc.getbalance().then((result) => {
    res.send(result);
  }).catch((err) => {
    res.status(500).send(err)
  })
})
module.exports = router;
