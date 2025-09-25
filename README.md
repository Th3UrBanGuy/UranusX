# UranusX: A Modern Streaming Dashboard

UranusX is a sophisticated, feature-rich web application that serves as a personalized dashboard for streaming content. It features a dual-interface system: a sleek, dynamic user-facing dashboard and a comprehensive admin panel for complete control over content, users, and subscriptions.

Built on a modern tech stack including **Next.js (App Router)**, **React**, **TypeScript**, **Firebase**, and **Tailwind CSS** with **ShadCN UI** components, the application is designed for performance, scalability, and a seamless user experience.

## Core Features

### 1. Authentication & Role-Based Access

- **Secure Authentication**: Robust login (`/`), signup (`/signup`), and password reset (`/forgot-password`) flows using Firebase Authentication.
- **Email Verification**: A custom, branded email verification flow ensures users provide a valid email address before they can claim subscriptions.
- **Role-Based Routing**: The application enforces a strict separation between user and admin roles.
  - **Users** are directed to `/dashboard`.
  - **Admins** (who do not require email verification) are directed to the `/admin` panel.
- **Dynamic Admin Signup**: A secure, dynamic route for creating new admin accounts, which can be enabled and customized from the admin panel to prevent unauthorized access.
- **Centralized Session Management**: A global `AuthContext` uses real-time Firestore listeners to keep user data fresh across the application.

### 2. User Dashboard

A personalized and dynamic hub for content consumption.

- **Dynamic Content Grid**: A grid of streaming platforms that dynamically renders content based on the user's active subscription plan.
- **Subscription-Based Access**: A permissions system ensures users can only access content they are subscribed to. Accessing restricted content prompts them to subscribe.
- **Detailed Content View**: Clicking a platform opens a modal showing its description and a link to the external site. For "internal" channels, the dialog features an embedded video player.
- **License & Subscription Center**:
  - **Claim License**: Users can activate subscriptions by entering a license key, protected by a simple math captcha to prevent brute-force attacks.
  - **Active & Expired Views**: The UI clearly separates active subscriptions from expired ones.
  - **Real-Time Timers**: Each active subscription displays a live countdown timer.
  - **Cancel Subscription**: Users can cancel any active subscription.

### 3. Admin Panel

A powerful interface for managing the entire application.

- **Comprehensive Dashboards**: Separate dashboards for Content Management and Site Management provide quick access to all administrative functions.
- **Content Management**:
  - Full CRUD functionality for **Categories**, **Sub-categories**, and **Platforms**.
  - **Notification System**: A tool for admins to compose and broadcast rich notifications (with images and videos) to all users or individuals.
- **Site Management**:
  - **User Management**: A complete overview of all users, with tools to edit details, manage roles, and delete users.
  - **Subscription Plan Management**: Admins can create and manage subscription plans, defining their name, price, and which content each plan grants access to.
  - **Advanced License Key System**:
    - **Generation**: Generate unique license keys tied to specific subscription plans.
    - **Customization**: Set custom validity periods (in minutes) and claim limits.
    - **Claim Analytics**: View detailed analytics for each key, showing which users claimed it and when.

## Project Structure

The project follows a standard Next.js App Router structure with a clear separation of concerns.

```
/src
├── app/                  # Main application routes (pages) and layouts.
│   ├── admin/            # Routes and layout for the admin panel.
│   ├── auth/action/      # Custom page for handling email verification links.
│   ├── dashboard/        # The main user dashboard page.
│   └── page.tsx          # The root login page.
│
├── components/           # Reusable React components.
│   ├── ui/               # Core UI components from ShadCN.
│   ├── dashboard/        # Components specific to the user dashboard.
│   └── admin/            # Components specific to the admin panel.
│
├── contexts/             # React context providers (e.g., AuthContext).
│
├── lib/                  # Core application logic, types, and Firebase setup.
│   ├── data.ts           # TypeScript interfaces for data models.
│   └── firebase.ts       # Firebase initialization.
│
├── hooks/                # Custom React hooks (e.g., useToast).
│
└── public/               # Static assets like manifest.json and icons.
```

## Getting Started

Follow these steps to run the project locally.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm or yarn
- A [Firebase](https://firebase.google.com/) project.

### 2. Installation & Initial Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create Environment File**: Create a `.env.local` file in the root of your project. This file will hold your Firebase configuration keys.

    ```bash
    touch .env.local
    ```

## 3. Firebase Project Setup

### A. Create Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and click **"Add project"**.
2.  Follow the on-screen instructions to create a new project.

### B. Register Your Web App

1.  In your new Firebase project, click the **Web icon** (`</>`) to register a new web app.
2.  Give your app a nickname and click **"Register app"**.
3.  You will be shown your Firebase configuration object. **Copy this object**.

### C. Configure Environment Variables

1.  Open the `.env.local` file you created earlier.
2.  Paste the Firebase config keys into the file. It should look like this:

    ```bash
    # .env.local
    NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    ```

## 4. Firebase Services Setup

### A. Authentication Setup

1.  In the Firebase Console, go to the **Authentication** section.
2.  Click **"Get started"**.
3.  Under the "Sign-in method" tab, select **"Email/Password"** from the providers list.
4.  Enable it and click **Save**.
5.  Go to the **Templates** tab to customize the verification email.
    - Click the pencil icon to edit the **"Email address verification"** template.
    - Click the link that says **"Customize action URL"**.
    - Set the URL to `http://localhost:9002/auth/action`. For production, replace `http://localhost:9002` with your app's domain.

### B. Firestore Database Setup

1.  In the Firebase Console, go to the **Firestore Database** section.
2.  Click **"Create database"**.
3.  Choose to start in **Test mode**. This allows open access during development. You will secure this later with Security Rules.
4.  Select a location for your database and click **"Enable"**.

## 5. Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

2.  **Create an Admin User**: To access the admin panel, you must first create a user and then promote them to an Admin role.
    -   **Sign Up**: Run the app and create a new user account through the regular signup page.
    -   **Promote via Script**: Use the built-in script to assign the 'Admin' role. Follow the instructions in `scripts/README.md` to set up the admin script, then run:
        ```bash
        npm run make-admin "your-new-user-email@example.com"
        ```
    -   **Log In**: You can now log in with the promoted user's credentials to access the admin panel at `/admin`.
