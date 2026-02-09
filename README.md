# Hydroponics IoT Monitoring System

A full-stack IoT application designed to monitor and control hydroponic systems in real-time. This project handles user authentication, multi-tenancy, real-time device telemetry via MQTT, and administrative analytics.

## 🖼️ UI Showcase

![Dashboard Preview](https://via.placeholder.com/1600x900?text=Dashboard+Fluid+Layout+Showcase)
_The new Fluid Layout expands to fill available horizontal space, using a 280px fixed sidebar and a high-density responsive grid._

![Analytics Preview](https://via.placeholder.com/1600x900?text=Analytics+Live+Telemetry)
_Real-time charts and summary stats with explicit "OFFLINE" status detection for disconnected devices._

## 🚀 Technology Stack & Purpose

Here is a breakdown of the technologies used and **why** we chose them:

### Frontend (User Interface)

- **React (Vite)**:
  - _Why?_ Fast development server, component-based architecture for reusable UI elements (Cards, Headers), and efficient state management.
- **Recharts**:
  - _Why?_ To render the interactive, responsive charts for pH, TDS, and Temperature history.
- **Axios**:
  - _Why?_ For handling HTTP requests to the backend with simpler syntax than `fetch`, allowing easy configuration of Authorization headers.
- **React Router DOM**:
  - _Why?_ Enables client-side routing (single-page application feel) between Dashboard, Analytics, and Login pages without reloading.

### Backend (Server & API)

- **Node.js & Express**:
  - _Why?_ Non-blocking I/O is ideal for real-time IoT applications. Express simplifies route handling and middleware (Auth, Validation).
- **MongoDB & Mongoose**:
  - _Why?_ Flexible schema design fits the variable nature of IoT sensor data (`telemetry` collection). Easy aggregation for analytics.
- **Aedes (MQTT Broker)**:
  - _Why?_ An embedded MQTT broker running _inside_ Node.js. It removes the need to install external brokers like Mosquitto, making this project easier to run locally.
- **JSON Web Tokens (JWT)**:
  - _Why?_ Stateless authentication. Securely transmits user identity between Frontend, Backend, and Devices.
- **Bcryptjs**:
  - _Why?_ To hash passwords securely before storing them in the database.

### Security

- **Helmet**:
  - _Why?_ Automatically sets secure HTTP headers to protect against XSS and other common web vulnerabilities.
- **Express-Rate-Limit**:
  - _Why?_ Prevents abuse/DDoS by limiting how many requests an IP can make in a given timeframe (e.g., 100 req/10min).

---

## 🛠️ Installation & Setup

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js (v14+)
- MongoDB (Local or Atlas)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Yash-Amane03/be-project-website.git
cd be-project-web
```

### 2. Backend Configuration

The backend requires environment variables to connect to the database and sign tokens.

1.  Open the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a file named `.env` and add:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/hydroponics_db
    JWT_SECRET=supersecretkey_change_this_for_production
    NODE_ENV=development
    ```

### 3. Frontend Configuration

1.  Open the `frontend` folder (in a new terminal):
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

---

## ▶️ Running the Application

You need to run the **Backend** (API + MQTT) and **Frontend** (UI) simultaneously.

### Start Backend

In the `backend` terminal:

```bash
npm run dev
```

- _Output_: "Server running on 5000", "MongoDB Connected", "Backend connected to MQTT Broker".

### Start Frontend

In the `frontend` terminal:

```bash
npm run dev
```

- _Output_: Access the app at `http://localhost:5173`.

### (Optional) Start Device Simulator

To see live data without a physical ESP32, run the simulator script in a separate terminal inside `backend`:

```bash
node src/mqttSimulator.js
```

- _What it does_: It connects to the internal MQTT broker and pushes random pH/TDS data every 5 seconds for all registered devices.

---

## 🧠 Core Algorithms

### 1. High-Level System Flow

Our system operates on a coordinated loop between the physical sensors and the web interface:

1.  **Sensing**: ESP32 reads analog values from pH/TDS sensors every 5s.
2.  **Transmission**: Data is packed into a JSON payload and published to the `telemetry/device_id` MQTT topic.
3.  **Ingestion**: The Node.js backend receives the message, timestamps it, and persists it to MongoDB.
4.  **Visualization**: The React frontend polls/subscribes to the API, using `Recharts` to render the data points.
5.  **Action**: User toggles a switch on the UI -> Backend publishes a command to `commands/device_id` -> ESP32 triggers a Relay.

### 2. Pump Hysteresis Algorithm

To prevent the diaphragm pump from "chattering" (rapidly turning on/off) when the sensor reading is exactly at the threshold:

- **Variable**: `THRESHOLD` (e.g., pH 7.0), `MARGIN` (e.g., 0.2).
- **Logic**:
  - If `pH > (THRESHOLD + MARGIN)`, Turn Pump **ON**.
  - If `pH < (THRESHOLD - MARGIN)`, Turn Pump **OFF**.
  - If `pH` is between `(THRESHOLD - MARGIN)` and `(THRESHOLD + MARGIN)`, **Do Nothing** (Maintain last state).

### 3. Presence & Offline Detection (LWT)

- **Threshold**: 30 Seconds.
- **Mechanism**: Backend monitors `lastSeen` heartbeat. If exceeded, UI replaces all sensor readings with an **OFFLINE** sentinel to prevent decision-making based on stale data.

### 4. High-Density Fluid Layout

- **Sidebar**: Fixed 280px for standard navigation stability.
- **Fluid Container**: 100% width up to 1600px ensures zero-waste on ultra-wide displays.
- **Typography**: Normalized 0.875rem base font for industrial-grade precision.

---

## 📚 Documentation

For deep-dive architecture diagrams, algorithms, and flowcharts, see the [PROJECT_DOCS.md](./PROJECT_DOCS.md) file included in this repository.
