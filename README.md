# 🏭 Smart Steel Management System

**Full-Stack Web Application for Make-to-Order Steel Businesses**

## 📌 Overview

The **Smart Steel Management System** is a full-stack web application designed to digitize and streamline operations in a make-to-order steel cutting business.

This project was developed as a **senior capstone project** in collaboration with a real industrial client. It replaces manual workflows (paper + Excel) with an integrated system that improves accuracy, efficiency, and traceability across the entire business process.

---

## 🚀 Key Features

### 📄 Purchase Order (PO) Automation

* Upload PO files (PDF/Image)
* Extract data automatically using **OCR (Tesseract)**
* Structure data using **AI (DeepSeek via OpenRouter)**
* Auto-fill order forms with validation

### 🏭 Order & Production Management

* Create and manage customer orders
* Assign jobs to production staff
* Track production status in real-time
* Monitor job timelines and progress

### 📦 Inventory Management

* Real-time stock tracking
* Automatic stock deduction on usage
* Stock-in / stock-out logging with history
* Steel type & material management

### 💰 Financial System

* Automatic price calculation (based on weight × price/kg)
* VAT calculation (7%)
* Revenue & expense tracking
* Financial reports (daily / monthly / yearly)

### 📑 Document Generation

* Generate PDF documents:

  * Quotation
  * Invoice / Tax Invoice
  * Receipt
  * Delivery Note
* QR Code payment support

### 👥 Employee & Payroll System

* Manage employee data
* Salary calculation (base + bonus - deductions)
* Generate payslips (PDF)
* Track employee income history

### 📊 Dashboard & Reporting

* Sales analytics
* Revenue & expense reports
* Business overview dashboard
* Historical data tracking

---

## 🧠 System Workflow

1. Customer submits **Purchase Order (PO)**
2. System extracts data via **OCR + AI**
3. Order is created and assigned to production
4. Steel is cut and processed
5. Weight is recorded → price calculated
6. Documents (Invoice, Receipt) are generated
7. Product is delivered to customer
8. Financial data is recorded and reported

---

## 🏗️ Tech Stack

### Frontend

* **Next.js** (Full-stack framework)
* **TypeScript**
* **Tailwind CSS**
* **Radix UI**

### Backend

* Next.js API Routes
* **Prisma ORM**
* **PostgreSQL**

### AI & Processing

* **Tesseract OCR** (text extraction)
* **DeepSeek Chat V3 (via OpenRouter)** (data structuring)

### Storage

* **MinIO (S3-compatible object storage)**

### Authentication & Security

* JWT Authentication
* Role-Based Access Control (RBAC)

---

## 👥 User Roles

* **Admin / Super Admin** – manage system & users
* **Clerk** – manage orders, documents, pricing
* **Production Supervisor** – assign & track jobs
* **Worker** – execute production tasks
* **Delivery Staff** – manage delivery status
* **Accountant** – financial & payroll management
* **Manager** – monitor reports and analytics

---

## 🎯 Objectives

* Replace manual workflows (paper & Excel)
* Reduce human errors in data processing
* Enable real-time tracking of orders and production
* Improve business visibility through analytics
* Automate document generation and calculations

---

## 📈 Benefits

* ⏱️ Faster operations and reduced manual work
* 📉 Lower error rates in calculations and data entry
* 📊 Real-time business insights
* 📁 Centralized data management
* 🤖 AI-assisted document processing

---

## 🧪 Project Context

* 🎓 Developed as a **Bachelor’s Degree Senior Project**
* 🏢 Built in collaboration with a **real steel industry business**
* 🛠️ Based on **real operational requirements**
* ⏳ Data collection & requirement analysis over **15 months**

---

## 🔮 Future Improvements

* Mobile application support
* Advanced analytics & forecasting
* Integration with ERP systems
* Multi-branch support
* AI-based demand prediction

---

## 📂 Repository Structure (Example)

```
/app
/components
/lib
/prisma
/public
/services
/utils
```

---

## 📜 License

This project is developed for educational and industrial collaboration purposes.


