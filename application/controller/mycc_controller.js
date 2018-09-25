var transation = require('../Transaction')

class Mycc {

    getBalance(){
        const request = {
            //targets: let default to the peer assigned to the client
            chaincodeId: 'mycc',
            fcn: 'query',
            args: ['a']
        };
        
        return transation.query(request)
        
    }
    invokeTrans(args){
        const request = {
            chaincodeId: 'mycc',
            fcn: 'invoke',
            args: ['a','b','10'],
            chainId: 'mychannel',
            txId: transation.newTransactionID()
        };
        
        return transation.submitTransaction(request);
    }

}

const mycc = new Mycc();
module.exports = mycc;