import * as admin from 'firebase-admin';
import path from 'path';

// const serviceAccount = require(path.join(__dirname, './serviceAccountKey.json'))
const serviceAccount = require(path.join(process.cwd(), '/src/config/firebase/serviceAccountKey.json'))

export const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
