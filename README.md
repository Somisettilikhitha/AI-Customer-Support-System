# 🤖AI-Powered Customer Support System

An AI-powered customer support platform designed to manage customer queries, support tickets, agent assignments, and automated responses.

## ✨Features

- User registration and login
- Role-based access for customers, agents, and administrators
- Ticket creation and management
- Agent assignment and ticket tracking
- AI-powered ticket classification and sentiment analysis
- Retrieval-Augmented Generation (RAG) for FAQ-based responses
- Customer-agent messaging
- Admin dashboard and analytics
- Password reset functionality

## 🛠️Technology Stack

- **Frontend:** React.js, Vite, JavaScript, CSS
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL
- **AI & NLP:** Transformers, Sentence Transformers, RAG
- **Tools:** Git, VS Code, Alembic

## 📁Project Structure

```text
AI-Customer-Support-System/
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── data/
│   │   ├── faq_documents.npy
│   │   └── faq_embeddings.npy
│   │
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   │
│   ├── auth.py
│   ├── security.py
│   ├── tickets.py
│   ├── agent_tickets.py
│   ├── agent_messages.py
│   ├── customer_messages.py
│   ├── admin.py
│   ├── notifications.py
│   ├── agent_ai.py
│   │
│   ├── schemas.py
│   ├── ticket_schemas.py
│   ├── message_schemas.py
│   ├── admin_schemas.py
│   ├── agent_schemas.py
│   ├── activity_schemas.py
│   │
│   ├── ai_service.py
│   ├── ai_analysis_service.py
│   ├── rag_service.py
│   ├── rag_search.py
│   ├── activity_service.py
│   ├── notification_service.py
│   ├── generate_embeddings.py
│   │
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── agent/
│   │   │   └── customer/
│   │   │
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── animations.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## 🚀Setup Instructions

### ⚙️Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment on Windows:

   ```bash
   venv\Scripts\activate
   ```

4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file using `.env.example` as a reference and configure your database credentials.

6. Start the FastAPI server:

   ```bash
   uvicorn main:app --reload
   ```

### 💻Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## 🔧Configuration

Create a `.env` file inside the backend folder using the provided `.env.example` as a reference. Add your own database credentials and required configuration values.

**🔒Security:** Never commit your `.env` file, database passwords, or API keys to GitHub.

## 📌Project Status

Developed as a full-stack AI-powered customer support project.

⭐ If you find this project interesting, feel free to explore the repository!
