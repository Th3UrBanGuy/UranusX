
# Admin Scripts

This directory contains command-line scripts for managing the UranusX application.

## `make-admin.ts`

This script allows you to promote a regular user to an 'Admin' role directly from the command line.

### Prerequisites

To use this script, you need a **Firebase Admin SDK service account key**. This key gives the script privileged access to your Firebase project, allowing it to modify data in Firestore.

#### 1. Generate a Service Account Key

1.  Open the [Firebase Console](https://console.firebase.google.com/) and navigate to your project.
2.  Click the **gear icon** next to "Project Overview" and select **Project settings**.
3.  Go to the **Service accounts** tab.
4.  Click the **"Generate new private key"** button. A JSON file will be downloaded to your computer.
5.  **IMPORTANT**: Keep this file secure and do not commit it to your git repository.

#### 2. Set Up Environment Variables

To allow the script to find your credentials, you must tell it where the key file is located.

1.  **Move the Key File**: Move the downloaded JSON key file into the root directory of this project. For security, rename it to something generic like `service-account.json`.

2.  **Create `.env` File**: If it doesn't already exist, create a file named `.env` in the root of your project.

3.  **Add Environment Variable**: Add the following line to your `.env` file, telling the script where to find your key:

    ```
    GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
    ```

4.  **Add to `.gitignore`**: To ensure you never accidentally commit your credentials, add these lines to your `.gitignore` file:

    ```
    # Firebase
    service-account.json
    .env
    ```

### How to Use

Once the prerequisites are met, you can promote a user by running the following command in your terminal:

```bash
npm run make-admin <user-email>
```

Replace `<user-email>` with the email address of the user you want to make an admin.

**Example:**

```bash
npm run make-admin "test.user@example.com"
```

If successful, you will see a confirmation message in your console. If the user doesn't exist or an error occurs, the script will print an error message.
