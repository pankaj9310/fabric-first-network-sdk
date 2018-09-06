
const FabricClient = require('fabric-client');

const baseTransaction = class BaseTransaction extends FabricClient{
    constructor(props){
        super(props);
    }

      createResponse(message, status){
        return {message: message, status: status}
    }
};

module.exports = baseTransaction;


