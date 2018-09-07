var transation = require('../Transaction')

class Mycc {

    getbalance(){
        const request = {
            //targets: let default to the peer assigned to the client
            chaincodeId: 'mycc',
            fcn: 'query',
            args: ['a']
        };
        return transation.query(request)
        
    }

}

const mycc = new Mycc();
module.exports = mycc;