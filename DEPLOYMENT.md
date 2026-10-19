# 🚀 GST Invoice Studio - Complete Server Deployment Guide

Is guide me aapko **Frontend (React 19)** aur **Backend (Java Spring Boot 3)** ko server par deploy karne ke sabse aasan aur reliable tareeqe diye gaye hain.

---

## 🌟 Architecture Overview

Aapke project ko **2 alag-alag** ya **1 Single Unified Container/JAR** ki tarah run kiya ja sakta hai:

```
┌────────────────────────────────────────────────────────┐
│                   SERVER / VPS / CLOUD                 │
│                                                        │
│  Port 8080                                             │
│  ┌─────────────────────────┬────────────────────────┐  │
│  │   React 19 Frontend     │  Spring Boot 3 API     │  │
│  │   (/index.html, /assets)│  (/api/v1/*, H2 / SQL) │  │
│  └─────────────────────────┴────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Method 1: Render.com par 100% Free Docker Deployment (Recommended)

Ye sabse aasan tareeqa hai jisme **Frontend + Java Backend dono 1 single link par live** ho jate hain bina kisi server setup ke:

1. Apne code ko **GitHub** repository me push karein:
   ```bash
   git add .
   git commit -m "Add Docker and unified fullstack setup"
   git push origin main
   ```
2. [Render.com](https://render.com) par free account banayein aur **"New +" -> "Web Service"** par click karein.
3. Apni GitHub repository select karein.
4. Settings me:
   - **Environment**: `Docker` (Render automatically humari banayi hui `Dockerfile` detect kar lega)
   - **Plan**: `Free`
5. **"Deploy Web Service"** par click karein!
6. Render automatically Node + Java multi-stage build chalayega aur 3-4 minute me aapko live URL mil jayega (e.g. `https://gst-invoice-studio.onrender.com`).

---

## 🖥️ Method 2: Ubuntu VPS / AWS EC2 / DigitalOcean par Deploy karein

Agar aapke paas apna Linux VPS (Ubuntu/Debian) hai:

### Step 1: Server par Docker se run karein (Fastest)
```bash
# Repo clone karein
git clone <your-repo-url>
cd gst-invoice-generator

# Docker image build karein
docker build -t gst-studio .

# Run karein port 80 par
docker run -d --name gst-invoice-app -p 80:8080 --restart always gst-studio
```
Aapki website turant `http://YOUR_SERVER_IP` par live ho jayegi!

---

### Step 2: Bina Docker ke Direct Java JAR se run karein
1. Apne computer par command chalayein:
   ```bash
   npm run build:full
   ```
   (Ye React frontend build karke Spring Boot ke static folder me copy kar deta hai).
2. Backend build karein:
   ```bash
   cd backend
   mvn clean package -DskipTests
   ```
3. Jo `target/gst-invoice-studio-backend-1.0.0.jar` bana hai, use apne server par copy karein aur run karein:
   ```bash
   java -jar gst-invoice-studio-backend-1.0.0.jar
   ```

---

## ⚡ Method 3: Split Cloud (Vercel Frontend + Render Backend)

Agar aap Frontend ko Vercel par aur Backend ko Render/Railway par rakhna chahte hain:
1. **Backend Deploy karein**: Render.com par `backend` directory ko Java Web Service ki tarah deploy karein.
2. **Frontend Deploy karein**: Vercel par root repo ko Vite app ki tarah deploy karein aur Environment Variable add karein:
   - `VITE_API_BASE_URL` = `https://your-backend.onrender.com/api/v1`

---

## 📁 Key Files Created for Deployment
- `Dockerfile`: Multi-stage Docker build (Node 20 + Java 21)
- `.dockerignore`: Faster Docker builds
- `scripts/copy-dist.js`: Unified asset pipeline (`npm run build:full`)
- `WebConfig.java`: Spring Boot SPA route forwarder
- `SecurityConfig.java`: Permitted static assets without authentication
- `application.yml`: Dynamic `${PORT:8080}` support
