import * as admin from 'firebase-admin';
const serviceAccount = require('./serviceAccountKey.json');

export const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    //   databaseURL: ""
});
