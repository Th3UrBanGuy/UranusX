
// This script requires 'firebase-admin', 'dotenv', and 'ts-node'.
// Make sure to install them with: npm install firebase-admin dotenv --save && npm install -D ts-node

// Use require for compatibility with ts-node's CommonJS module loading
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv/config');


// This script promotes a user to an admin role in Firestore.
//
// Usage:
// npm run make-admin <user-email>
//
// Before running:
// 1. Ensure you have a Firebase service account key JSON file.
// 2. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
//    to the path of your service account key file.
//    (See scripts/README.md for more details).

async function makeAdmin() {
  // process.argv[0] is node, process.argv[1] is the script path
  const emailToPromote = process.argv[2];

  if (!emailToPromote) {
    console.error('Error: Please provide the email address of the user to promote.');
    console.error('Usage: npm run make-admin <user-email>');
    process.exit(1);
  }
  
  try {
    // Initialize the Firebase Admin SDK
    // The SDK automatically finds the credentials via the GOOGLE_APPLICATION_CREDENTIALS env var.
    if (!admin.apps.length) {
      admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }

    const db = getFirestore();
    const usersRef = db.collection('users');

    // Find the user by email
    const snapshot = await usersRef.where('email', '==', emailToPromote).limit(1).get();

    if (snapshot.empty) {
      console.error(`Error: No user found with email "${emailToPromote}".`);
      process.exit(1);
    }

    // Update the user's role
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({ role: 'Admin' });

    console.log(`✅ Successfully promoted user "${emailToPromote}" (ID: ${userDoc.id}) to Admin.`);
    process.exit(0);

  } catch (error: any) {
    console.error('❌ An error occurred:');
    if (error.code === 'ENOENT' && error.syscall === 'open') {
         console.error('Could not find Firebase Admin credentials. Make sure you have set the GOOGLE_APPLICATION_CREDENTIALS environment variable.');
         console.error('See scripts/README.md for setup instructions.');
    } else {
        console.error(error.message);
    }
    process.exit(1);
  }
}

makeAdmin();
