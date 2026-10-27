# Market & Moss — Full-Stack E-Commerce Application

A full-stack e-commerce web application built using **React, Spring Boot, and PostgreSQL**. Market & Moss provides a shopping experience with product browsing, user authentication, cart management, checkout, order history, and an AI-powered shopping assistant.

## 🚀 Features

- **Product Catalog:** Browse products and explore categories.
- **User Authentication:** Register and log in securely.
- **JWT Authentication:** Token-based authentication for protected APIs.
- **Shopping Cart:** Add and manage products in the cart.
- **Checkout & Orders:** Place orders and view order history.
- **Product Management:** Add, update, and delete products with admin authorization.
- **AI Shopping Assistant:** Get product recommendations through a Gemini-powered chatbot.
- **Product Images:** Store and display locally managed product images.
- **Responsive UI:** Shop through a React-based interface.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- HTML5 and CSS3
- Axios

### Backend
- Java
- Spring Boot
- Spring Data JPA
- Hibernate
- Spring Security
- JWT Authentication
- Maven

### Database & Tools
- PostgreSQL
- Git and GitHub
- IntelliJ IDEA
- Visual Studio Code
- Google Gemini API

## 📁 Project Structure

```text
Market&Moss/
├── ecommerce-backend/
│   └── ecommerce-backend/
│       ├── src/
│       └── pom.xml
├── ecommerce-frontend/
│   └── ecommerce-frontend/
│       ├── src/
│       ├── public/
│       └── package.json
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Java version compatible with the backend configuration
- Maven, or use the Maven Wrapper if provided
- Node.js and npm
- PostgreSQL
- A Google Gemini API key if using the AI assistant

### 1. Clone the Repository

```bash
git clone https://github.com/shubham1087/Market-Moss-E-commerce-.git
cd Market-Moss-E-commerce-
```

### 2. Configure the Database

Create a PostgreSQL database named `ecommerce_db`, or configure your own database URL.

Set the following environment variables for the backend:

```text
DB_URL=jdbc:postgresql://localhost:5432/ecommerce_db
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_long_random_secret
```

Use your own values locally. **Never commit real passwords, API keys, or JWT secrets to GitHub.**

### 3. Run the Backend

Open the backend project in IntelliJ IDEA, configure the required environment variables, and run the Spring Boot application.

The default backend URL is:

```text
http://localhost:8080
```

### 4. Run the Frontend

Open a terminal in the frontend project directory:

```bash
cd ecommerce-frontend/ecommerce-frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:5173
```

## 🔐 Security

- Passwords are hashed using BCrypt.
- Protected APIs use JWT authentication.
- Administrative operations require appropriate authorization.
- Database credentials and API keys should be provided through environment variables.

## 👨‍💻 Author

**Shubham Kumar**

- GitHub: [shubham1087](https://github.com/shubham1087)

## 📌 Future Improvements

- Deploy the frontend and backend.
- Add payment gateway integration.
- Improve automated testing and error handling.
- Add product search

- ## 🔐 Admin Demo Access

Use the following credentials to test admin functionality, including product management.

- **Email:** `admin@gmail.com`
- **Password:** `admin`

🌐 **Live Website:** https://market-moss-e-commerce-6zyl.vercel.app/products

**Note:** Demo access is intended for evaluation purposes only.

- ## 🌐 Live Demo

**Market & Moss – E-commerce Website:**  
https://market-moss-e-commerce-6zyl.vercel.app/products

Explore the live application to browse products and test the shopping experience.
