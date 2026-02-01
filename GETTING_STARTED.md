# Getting Started with Hydroponics IoT System

Welcome to the Hydroponics IoT System! This guide will help you set up and run the project locally on your machine.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (Local instance or Atlas URI)
- **Git**

## 2. Installation Checks

### Clone the Repository

If you haven't already:

```bash
git clone <repository-url>
cd be-project-web
```

### Backend Setup

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file in the `backend/` directory with the following content:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/hydroponics_db
    JWT_SECRET=supersecretkey123
    NODE_ENV=development
    ```
    _(Replace `MONGO_URI` with your connection string if using MongoDB Atlas)_

### Frontend Setup

1.  Navigate to the frontend folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## 3. Running the Application

You need to run both the Backend and Frontend servers.

### Start Backend

In the `backend` terminal:

```bash
npm run dev
```

- **Success**: You should see "Server running on port 5000" and "MongoDB Connected".
- **Simulator**: To generate fake device data, open a new terminal in `backend/` and run: `node src/mqttSimulator.js`

### Start Frontend

In the `frontend` terminal:

```bash
npm run dev
```

- **Access**: Open your browser and go to `http://localhost:5173`

## 4. How to Use

### Step 1: User Registration

1.  Go to `http://localhost:5173/signup`.
2.  Create a new account (e.g., `user@example.com`).
3.  You will be automatically logged in and redirected to the Dashboard.

### Step 2: Add a Device

1.  On the Dashboard, click **"+ Add Device"**.
2.  Click **"Generate Pairing Token"**.
3.  Copy the 6-digit token (e.g., `123456`).
4.  _(Simulation)_: Since we don't have a physical device yet, use a tool like Postman to simulate the device claiming the token, OR use the **Simulator Logic** which bypasses this for testing.
    - _Note_: The current UI allows you to generate the token. For a real demo, verify the token connects to the company.

### Step 3: View Analytics

1.  Click on your new device card in the Dashboard.
2.  You will see real-time charts (pH, TDS, Temperature).
3.  Use the **Controls** on the right to send commands (e.g., "Motor ON").

### Admin Access

To access the Admin Dashboard (`/admin-dashboard`):

1.  You must manually set a user's role to `admin` in the database.
2.  Open MongoDB Compass or Shell:
    ```javascript
    db.users.updateOne(
      { email: "your@email.com" },
      { $set: { role: "admin" } },
    );
    ```
3.  Log out and Log back in. You will now see the "Admin Dashboard" button.
