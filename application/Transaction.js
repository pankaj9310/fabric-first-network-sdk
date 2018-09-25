const FabricClient = require("fabric-client");
const path = require("path");
const BaseTransaction = require("./BaseTransaction");


const store_path = path.join(__dirname,'../hfc-key-store');
const config = path.join(__dirname,'../config/network.yaml');

let tx_id_string=null;
class FBClient extends BaseTransaction {

    constructor(props) {
        super(props);
    }

    submitTransaction(rq) {
        
        let chaincodeResponse;
        const channel = this.getChannel();
        const peers = this.getPeersForOrg("Org1MSP");
        let eventHub;
        return new Promise((resolve, reject) => {
            channel.sendTransactionProposal(rq, 1000).then((proposalResponse) => {
                let simulationResponse;

                for (let i = 0; i < proposalResponse[0].length; i++) {
                    if (!(proposalResponse[0][i] instanceof Error)) {
                        //If this is not an error. check for status code
                        console.log("Success Response AT ====>  " + i);
                        simulationResponse = proposalResponse[0][i];
                        chaincodeResponse = JSON.parse(proposalResponse[0][i].response.payload.toString());
                       eventHub = this.getEventHub(peers[i].getName());
                        break;
                    }
                }

                let promises = [];
                if (!simulationResponse) {
                    reject(this.createResponse("Connection failed", 500));
                } else {
                    if (simulationResponse.response.status === 200) {
                        const request = {
                            proposalResponses: proposalResponse[0],
                            proposal: proposalResponse[1]
                        };


                        let sendPromise = channel.sendTransaction(request);
                        promises.push(sendPromise);

                        let transactionPromise = new Promise((res, rej) => {
                            let timeout = setTimeout(() => {
                                eventHub.disconnect();
                                reject(this.createResponse("Connection timeout", 500));
                            }, 8000);
                            eventHub.connect();

                            eventHub.registerTxEvent(rq.txId.getTransactionID(), (txId, code) => {
                                clearTimeout(timeout);
                                eventHub.unregisterTxEvent(txId);
                                eventHub.disconnect();

                                if (code !== 'VALID') {
                                    rej(this.createResponse("Transaction was not valid", 500));
                                    return;
                                }

                                chaincodeResponse.event_status = code;
                                // chaincodeResponse.tx_id = tx_id_string._transaction_id;
                                res(chaincodeResponse);

                            }, (eventHubError) => {
                                reject(this.createResponse(eventHubError.message, 500));
                            })
                        }).catch((err) => {
                            reject(this.createResponse(err.message, 500));
                        });
                        promises.push(transactionPromise);
                    } else {
                        reject(this.createResponse(simulationResponse.response.message
                            , simulationResponse.response.status))
                    }
                }


                return Promise.all(promises);
            }).then((promisesResult)=>{
                if(!promisesResult
                    || !promisesResult[0]
                    || promisesResult[0].status !== 'SUCCESS'){
                    console.log("Could not send the proposal to orderer. Promise result ==> " + promisesResult[0]);
                    reject(this.createResponse("Could not send the proposal to orderer.", 500));
                    return
                }

                if(promisesResult
                    && promisesResult[1]
                    && promisesResult[1].event_status === 'VALID') {
                    console.log("The promise result for orderer was valid. Promise result ==> " + promisesResult[0]);
                    resolve(chaincodeResponse);
                }
            }).catch((err) => {
                console.log(err);
                reject(BaseTransaction.createResponse(err.message,500));
            })
        })

    }

    //Query from chaincode
    query(requestData) {
        return new Promise((resolve, reject) => {
            const channel = this.getChannel();
            console.log("Query about to run @ " + Date.now());
            channel.queryByChaincode(requestData).then((response_payloads) => {
                console.log("Query run @ " + Date.now());
                console.log("Array ==>" + response_payloads);
                for (let i = 0; i < response_payloads.length; i++) {
                    console.log(i + " iteration @ " + Date.now());
                    if (!(response_payloads[i] instanceof Error)) {
                        resolve(JSON.parse(response_payloads[i].toString()));
                        return
                    }
                }
                reject("Connect Failed")
            }).catch((err) => {
                reject(err.message)
            })
        })
    }


    //This function will check if user is enrolled or not.
    loadUserContext(user) {
        return new Promise((resolve, reject) => {
            FabricClient.newDefaultKeyValueStore({path: store_path})
                .then((keyValueStore) => {
                    this.setStateStore(keyValueStore);
                    const crypto_suite = FabricClient.newCryptoSuite();
                    const crypto_store = FabricClient.newCryptoKeyStore({path: store_path});
                    crypto_suite.setCryptoKeyStore(crypto_store);
                    this.setCryptoSuite(crypto_suite);
                    return this.getUserContext(user, true);
                }).then((userFromStore) => {
                if (userFromStore && userFromStore.isEnrolled()) {
                    resolve(this.createResponse("Success", 200))
                } else {
                    reject(this.createResponse("user not enrolled", 422))
                }
            }).catch((error) => {
                reject(this.createResponse(error, 500))
            })
        })

    }
    

}

const client = new FBClient();
client.loadFromConfig(config);
client.loadUserContext("user2").then((result) => {
}).catch((err) => {
    console.log(err)
});


module.exports = client;
