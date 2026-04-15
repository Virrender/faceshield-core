# FaceShield 🛡️

An end-to-end computer vision platform that applies adversarial perturbations (cloaking) to images, protecting user privacy from unauthorized facial recognition models-- FaceNet.

System Architecture 
This project utilizes a microservices architecture to cleanly separate the machine learning engine from the web serving layers:

* **`/faceshield` (Core ML Engine):** The raw machine learning pipeline responsible for generating the adversarial cloaking perturbations.
* **`/python-service` (AI Backend):** A **FastAPI** wrapper that serves the PyTorch ML pipeline as an accessible, high-performance API endpoint.
* **`/web-app` (Client & Server):** The full **MERN stack** (MongoDB, Express, React, Node.js) handling user authentication, image uploads, state management, and routing requests to the AI service.

## 🚀 Technology Stack
* **AI/ML:** PyTorch, Python
* **Backend API:** FastAPI, Uvicorn
* **Web Server:** Node.js, Express.js
* **Database:** MongoDB
* **Frontend:** React.js
