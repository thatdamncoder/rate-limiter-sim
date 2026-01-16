# 🚦 Rate Limiter Visualizer

Rate limiting is a **core backend system design concept** used to control how frequently a client can access an API or service.
This project **implements real rate limiting algorithms on the backend** and visualizes their behavior **in real time on the frontend** for better intuition and understanding.

### 📽 Demo 
**Drive Link:** https://drive.google.com/file/d/1W0jT39CUNEDIaEak-3oMeD8qRct7BvPE/view?usp=sharing

---

## 🧠 What is Rate Limiting?

**Rate limiting** restricts the number of requests a client can make within a specific time window.

**Example:**
Allow at most **5 requests per 10 seconds per user**.

---

## ❓ Why Do We Need Rate Limiting?

Rate limiting is essential to:

* Prevent system overload
* Protect APIs from abuse and DDoS attacks
* Ensure fair usage across clients
* Maintain predictable system performance
* Control infrastructure costs

Almost every large-scale system uses rate limiters at multiple layers.

---

## 🧩 Rate Limiting Algorithms

> All algorithms below are **actually implemented in the backend**.
> The frontend visualizes **real allow / block decisions** based on live timestamps.

---

### 1️⃣ Fixed Window Counter

Counts requests in fixed time intervals and resets the counter at each window boundary.

📷 **Visualization**
![FixedWindow](./assets/FixedWindow.png)
---

### 2️⃣ Sliding Window Log

Stores timestamps of requests and counts only those within the last time window.

📷 **Visualization**
![SlidingWindowLog](./assets/SlidingWindowLog.png)

---

### 3️⃣ Sliding Window Counter

Uses weighted counts from the current and previous window to reduce boundary bursts.

📷 **Visualization**
![SlidingWindowCounter](./assets/SlidingWindowCounter.png)

---

### 4️⃣ Token Bucket

Allows requests as long as tokens are available, refilling tokens at a fixed rate.

📷 **Visualization**
![TokenBucket](./assets/TokenBucket.png)

---

### 5️⃣ Leaky Bucket

Processes requests at a constant rate, rejecting excess requests when the bucket overflows.

📷 **Visualization**
![LeakyBucket](./assets/LeakyBucket.png)

---

## 🏗 Architecture Overview

```
Frontend (React + TypeScript)
        |
        | REST API
        ↓
Backend (Spring Boot)
        |
        ↓
Rate Limiter Algorithms
```

---

## 🧰 Tech Stack

### Frontend

* React
* TypeScript
* Framer Motion
* Tailwind CSS
* Shadcn UI

### Backend

* Java 25
* Spring Boot
* REST APIs
* Strategy & Factory patterns

---

## 🚀 How to Run Locally

### Clone the Repository

```bash
git clone https://github.com/<your-username>/rate-limiter-visualizer.git
cd rate-limiter-visualizer
```

---

### Start Backend

```bash
cd rate-limiter
./mvnw spring-boot:run
```

Backend runs on:

```
http://localhost:8080
```

---

### Start Frontend

```bash
cd rate-limiter-frontend/app
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

## Contributing

Contributions and suggestions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (git checkout -b your-feature-name).
3. Commit your changes (git commit -m "Add new feature").
4. Push to the branch (git push origin your-feature-name).
5. Open a Pull Request.

