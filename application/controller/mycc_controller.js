var transation = require('../Transaction')

class Mycc {

    getbalance(){
        const request = {
            //targets: let default to the peer assigned to the client
            chaincodeId: 'mycc',
            fcn: 'query',
            args: ['a']
        };
        transation.query(request)
        console.log("Test");
    }

}

const mycc = new Mycc();
module.exports = mycc;