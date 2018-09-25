

var express = require('express');
var router = express.Router();

// var client = require('../application/Transaction')
var mycc = require('../application/controller/mycc_controller')
//GET transaction details
router.get('/:id', function(req, res, next) {
    console.log(req.params.id);
  mycc.getBalance().then((result) => {
    res.sendStatus(status)
  }).catch((err) => {
    res.status(500).send(err)
  })
})

router.post('/',function(req, res, next) {
  mycc.invokeTrans(req.body.data).then((result) => {
    res.sendStatus(status)
  }).catch((err) => {
    res.status(500).send(err)
  })
})
module.exports = router;
