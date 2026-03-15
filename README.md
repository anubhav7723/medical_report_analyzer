# MediSense – Medical Report Analyzer

## Overview
MediSense is an AI-powered Medical Report Analyzer designed to help patients understand complex medical reports easily. The system extracts important medical parameters from uploaded reports and provides simple explanations of the results.

Medical reports often contain technical terms, abbreviations, and numerical values that are difficult for non-medical users to interpret. MediSense solves this problem by automatically analyzing medical reports and presenting clear insights through a user-friendly web dashboard.

---

## Objectives

- Extract text from medical reports automatically
- Identify important medical parameters from reports
- Compare extracted values with standard medical reference ranges
- Generate easy-to-understand explanations for patients
- Display analyzed results on a web dashboard

---

## System Workflow

### 1. Report Upload
The user uploads a medical report in **PDF or image format (JPG, JPEG, PNG)**.

### 2. Text Extraction
The system uses **EasyOCR** to extract text from the uploaded report.

### 3. Data Processing
Extracted text is processed to identify important medical parameters such as:

- Glucose
- Hemoglobin
- Cholesterol
- RBC Count
- BMI

### 4. Data Analysis
The extracted values are compared with **standard medical reference ranges**.

### 5. AI Interpretation
Using **Natural Language Processing (NLP) and LLM models**, the system generates simple explanations of the medical results.

### 6. Result Display
The analyzed report and explanations are displayed on a **React.js web dashboard**.

---

## Technologies Used

### Frontend
- React.js
- HTML
- CSS
- JavaScript

### Backend
- Python
- FastAPI

### AI & Data Processing
- EasyOCR
- NLP techniques
- LLM (for explanation generation)

### Libraries
- Pandas
- NumPy

---

## Features

- Upload medical reports in **PDF and image formats**
- Automatic **text extraction using OCR**
- Identification of **important medical parameters**
- AI-generated **health explanations**
- User-friendly **web dashboard**

---

## Results

- The system successfully extracted text from various medical report formats.
- Important parameters such as **glucose, cholesterol, and hemoglobin** were correctly identified.
- The machine learning model achieved **around 90% accuracy** in predicting conditions such as **diabetes and anemia**.
- NLP-generated explanations helped users better understand their health reports.

---

## Future Scope

- Develop a complete **AI Medical Assistant**
- Add an **AI chatbot for medical queries**
- Support **multiple report analysis for health history tracking**
- Provide **personalized health recommendations**
- Develop a **mobile application**
- Integrate with **wearable health devices**



