
const FabricClient = require('fabric-client');
const FabricCAClient = require('fabric-ca-client');

const caAddress = 'http://localhost:7054';

const client = new FabricClient();
let caClient = null;
let admin_user = null;
let member_user = null;
let store_path = path.join(__dirname,'../hfc-key-store');

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
FabricClient.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {
    // assign the store to the fabric client
    client.setStateStore(state_store);
    var crypto_suite = FabricClient.newCryptoSuite();
    // use the same location for the state store (where the users' certificate are kept)
    // and the crypto store (where the users' keys are kept)
    var crypto_store = FabricClient.newCryptoKeyStore({path: store_path});
    crypto_suite.setCryptoKeyStore(crypto_store);
    client.setCryptoSuite(crypto_suite);
    var	tlsOptions = {
    	trustedRoots: [],
    	verify: false
    };
    // be sure to change the http to https when the CA is running TLS enabled
    caClient = new FabricCAClient(caAddress, null , '', crypto_suite)

    // first check to see if the admin is already enrolled
    return client.getUserContext('admin', true);
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
        admin_user = user_from_store;
    } else {
        throw new Error('Failed to get admin.... run enrollAdmin.js');
    }

    // at this point we should have the admin user
    // first need to register the user with the CA server
    return caClient.register({enrollmentID: 'user2', affiliation: 'org1.department1',role: 'client'}, admin_user);
}).then((secret) => {
    // next we need to enroll the user with CA server
    console.log('Successfully registered user2 - secret:'+ secret);

    return caClient.enroll({enrollmentID: 'user2', enrollmentSecret: secret});
}).then((enrollment) => {
  console.log('Successfully enrolled member user "user2" ');
  return client.createUser(
     {username: 'user2',
     mspid: 'Org1MSP',
     cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
     });
}).then((user) => {
     member_user = user;

     return client.setUserContext(member_user);
}).then(()=>{
     console.log('user2 was successfully registered and enrolled and is ready to intreact with the fabric network');

}).catch((err) => {
    console.error('Failed to register: ' + err);
	if(err.toString().indexOf('Authorization') > -1) {
		console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
		'Try again after deleting the contents of the store directory '+store_path);
	}
});

