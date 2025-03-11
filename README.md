# Kudos Management System

A modern web application for managing and distributing kudos within an organization. This system allows team members to recognize and appreciate each other's contributions through a simple and intuitive interface.

## Project Overview

### Features
- User authentication and authorization
- Send and receive kudos
- Real-time notifications
- Kudos analytics and reporting
- User profile management
- Admin dashboard for system management
- Scheduled tasks for kudos reset management

### Tech Stack
- **Backend**:
  - Python 3.11+
  - Django 5.1
  - Django REST Framework
  - Celery for async tasks
  - Redis for caching and message broker
  - SQLite database (can be configured for Mysql)

- **Frontend**:
  - React 18
  - Vite
  - Bootstrap 5
  - Axios for API communication

## Setup Instructions

### Prerequisites
- Python 3.11 or higher
- Node.js 20 or higher
- Redis Server
- Git

### Windows Setup

1. **Install Prerequisites**:
   ```powershell
   # Install Python from https://www.python.org/downloads/
   # Install Node.js from https://nodejs.org/
   # Install Redis using Windows Subsystem for Linux (WSL) or Redis Windows
   
   # Install WSL if not installed
   wsl --install
   
   # Install Redis in WSL
   wsl
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

2. **Clone Repository**:
   ```powershell
   git clone <repository-url>
   cd kudos-management
   ```

3. **Backend Setup**:
   ```powershell
   # Create virtual environment
   python -m venv venv
   .\venv\Scripts\activate
   
   # Install dependencies
   cd backend
   pip install -r requirements.txt
   
   # Setup environment variables
   copy .env.template .env
   # Edit .env with your configurations
   
   # Initialize database
   python manage.py migrate

   # Optional
   python scripts/generate_fixtures.py 
   python manage.py loaddata fixtures/initial_data.json
   
   # Create superuser
   python manage.py createsuperuser
   ```
4 **Sample User Details**:
After loading the fixtures, the following organization and user details will be available:  

## **Organization: Mitratech**  

### **Users:**  

#### **1. John Doe (Organization Owner)**  
- **Username:** `john@mitratech.com`  
- **First Name:** John  
- **Last Name:** Doe  
- **Group:** `org_owner` (Organization Owner)  
- **Password:** `password123`  

#### **2. Jane Smith (Organization Member)**  
- **Username:** `jane@mitratech.com`  
- **First Name:** Jane  
- **Last Name:** Smith  
- **Group:** `org_member` (Organization Member)  
- **Password:** `password123`  

#### **3. Bob Wilson (Organization Member)**  
- **Username:** `bob@mitratech.com`  
- **First Name:** Bob  
- **Last Name:** Wilson  
- **Group:** `org_member` (Organization Member)  
- **Password:** `password123`  

#### **4. Alice Brown (Organization Member)**  
- **Username:** `alice@mitratech.com`  
- **First Name:** Alice  
- **Last Name:** Brown  
- **Group:** `org_member` (Organization Member)  
- **Password:** `password123`  

5. **Frontend Setup**:
   ```powershell
   cd frontend
   npm install
   copy .env.template .env
   # Edit .env with your configurations
   ```

### macOS/Linux Setup

1. **Install Prerequisites**:
   ```bash
   # macOS (using Homebrew)
   brew install python@3.11 node redis
   
   # Linux (Ubuntu/Debian)
   sudo apt update
   sudo apt install python3.11 nodejs redis-server
   ```

2. **Clone Repository**:
   ```bash
   git clone <https://github.com/ThePardeepHere/kudos-management.git>
   cd kudos-management
   ```

3. **Backend Setup**:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   cd backend
   pip install -r requirements.txt
   
   # Setup environment variables
   cp .env.template .env
   # Edit .env with your configurations
   
   # Initialize database
   python manage.py migrate
   
   # Optional
   python scripts/generate_fixtures.py
   python manage.py loaddata fixtures/initial_data.json
   
   # Create superuser
   python manage.py createsuperuser
   ```

4. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   cp .env.template .env
   # Edit .env with your configurations
   ```

### Running the Application

1. **Start Redis Server**:
   ```bash
   # Windows (WSL)
   wsl
   sudo service redis-server start
   
   # macOS
   brew services start redis
   
   # Linux
   sudo systemctl start redis
   ```

2. **Start Backend Services**:
   ```bash
   # Terminal 1 - Django Server
   cd backend
   python manage.py runserver
   
   # Terminal 2 - Celery Worker
   cd backend
   celery -A core worker --loglevel=info
   
   # Terminal 3 - Celery Beat
   cd backend
   celery -A core beat --loglevel=info
   ```

3. **Start Frontend Development Server**:
   ```bash
   # Terminal 4
   cd frontend
   npm run dev
   ```

## Project Structure

### Backend Components

- `accounts/`: User authentication and management
- `kudos_app/`: Core kudos functionality
- `utils_app/`: Utility functions and helpers
- `core/`: Project settings and configurations
- `scripts/`: Fictures scripts
- `fixtures/`: Initial data and test data

### Frontend Components

- `src/`: Source code
  - `components/`: React components
  - `pages/`: Page layouts
  - `services/`: API services
  - `utils/`: Utility functions
  - `context/`: React context providers
  - `styles/`: CSS and style files

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_MINUTES=120
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Development Guidelines

1. **Code Style**:
   - Backend: Follow PEP 8 guidelines
   - Frontend: Follow ESLint and Prettier configurations

2. **Git Workflow**:
   - Create feature branches from `develop`
   - Use meaningful commit messages
   - Submit pull requests for review

3. **Testing**:
   - Write unit tests for new features
   - Run tests before committing
   - Ensure all tests pass before merging



## Troubleshooting

1. **Redis Connection Issues**:
   - Verify Redis is running
   - Check Redis connection URL in .env
   - Clear Redis cache if needed

2. **Database Issues**:
   - Reset migrations if needed
   - Check database configurations
   - Verify fixtures are loaded correctly

3. **Frontend Build Issues**:
   - Clear node_modules and reinstall
   - Verify Node.js version
   - Check for conflicting dependencies

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://reactjs.org/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Redis Documentation](https://redis.io/docs/)

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details. 