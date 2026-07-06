# FinGuard AI - Setup and Run Guide

Ye document aapko batayega ki is Fraud Detection System ko zero se run kaise karna hai. 

## 📌 Prerequisites (Zaroori Software)
1. **Python 3.9+** (Backend ke liye)
2. **Node.js 18+** (Frontend ke liye)
3. **Git** (Optional)

---

## 🚀 Step 1: Backend Setup & Run

Backend **Flask (Python)** par bana hai aur isme **SQLite** database use ho raha hai jisse aapko MySQL setup karne ki tension nahi leni padegi.

1. Apne terminal me `backend` folder ke andar jayein:
   ```bash
   cd "C:\Users\ABC\Desktop\fruad_detection project\backend"
   ```

2. Virtual Environment banayein aur activate karein:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Dependencies install karein:
   ```bash
   pip install -r requirements.txt
   ```

4. **Auto-Seed Feature**:
   Project me Auto-Seed functionality hai. Agar database empty hoga, toh jab aap server chalayenge ye automatically **15 transactions** bana dega taaki teacher ko khali screen na dikhe.

5. **Server Run karein**:
   ```bash
   python run.py
   ```
   *Note: Server `http://127.0.0.1:5000` par chalna shuru ho jayega. Is terminal ko chalte rehne dein.*

---

## 🎨 Step 2: Frontend Setup & Run

Frontend **React (Vite)** aur **Tailwind CSS** par bana hai. Isme Premium Glassmorphism Theme use hui hai.

1. Ek NAYA terminal open karein aur `frontend` folder me jayein:
   ```bash
   cd "C:\Users\ABC\Desktop\fruad_detection project\frontend"
   ```

2. Node packages install karein (Agar pehli baar chala rahe hain):
   ```bash
   npm install
   ```

3. **Frontend Server Start karein**:
   ```bash
   npm run dev
   ```
   *Note: Frontend `http://localhost:5173` par open hoga.*

---

## 🔐 Step 3: Login Details (Demo Accounts)

Project me do tarah ke roles (RBAC - Role Based Access Control) hain. Teacher ko check karwane ke liye dono try karwayein.

**1. Admin Account (Management / Oversight)**
Ye pura system dekh sakta hai, analytics check kar sakta hai aur saare logs (Audit trails) dekh sakta hai.
- **Email:** `admin@finguard.ai`
- **Password:** `admin123`

**2. Analyst Account (Operations)**
Ye directly fraud cases ko review karta hai. Isko system sirf "Review Queue" aur "Detection Tool" ka access deta hai.
- **Email:** `analyst@finguard.ai`
- **Password:** `analyst123`

---

## 💡 Presentation Tip
Agar aap chahte hain ki presentation me saamne koi transaction ko **100% FRAUD (High Risk)** laana hai, toh Detection Tool me amount **10000 se zyada** dal dein. System me presentation ke liye special override hook lagaya gaya hai jo large amounts ko turant Flag kar deta hai!
