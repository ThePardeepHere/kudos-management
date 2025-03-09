# Kudos Management System - Project Details

## Project Overview

The Kudos Management System is a web application designed to facilitate peer recognition within organizations. Users can give kudos to their colleagues, fostering a culture of appreciation and recognition.

### Core Features
1. Weekly Kudos Distribution
   - Each user receives 3 kudos per week
   - Non-transferable to next week
   - Reset every week automatically

2. Kudos Management
   - Give kudos to other users
   - Attach personalized messages
   - View received kudos
   - Track remaining kudos

3. User Interface
   - User authentication
   - Organization context
   - Kudos giving interface
   - Kudos history view
   - Leader Board

## Technical Architecture

### Technology Stack

#### Backend
- **Framework**: Django 5.1
  - Chosen for rapid development, built-in admin, and robust ORM
  - RESTful API using Django REST Framework
  - Built-in authentication system

- **Task Queue**: Celery with Redis
  - Weekly kudos reset automation
  - Asynchronous task processing
  - Background job scheduling

- **Database**: SQLite (Development)
  - Can be easily migrated to Mysql for production
  - Handles relational data efficiently

#### Frontend
- **Framework**: React 18
  - Component-based architecture
  - Efficient rendering with Virtual DOM
  - Large ecosystem of libraries

- **Build Tool**: Vite
  - Fast development server
  - Efficient build process
  - Modern development experience

- **UI Framework**: Bootstrap 5
  - Responsive design
  - Consistent styling
  - Pre-built components

### Project Structure

```
kudos-management/
├── backend/
│   ├── accounts/            # User authentication and management
│   ├── kudos_app/          # Core kudos functionality
│   │   ├── models/         # Database models
│   │   ├── views/          # API endpoints
│   │   ├── serializers/    # Data serialization
│   │   ├── urls/          # URL routing
│   │   └── tasks.py       # Celery tasks
│   ├── core/              # Project settings
│   ├── utils_app/         # Shared utilities
│   └── scripts/           # Data generation scripts
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page layouts
│   │   ├── services/     # API integration
│   │   ├── utils/        # Helper functions
│   │   └── styles/       # CSS styles
│   └── public/           # Static assets
```

## Database Design

### Entity Relationship Diagram
```
User
├── id (PK)
├── username
├── email
├── password
├── kudos_available
├── last_kudos_reset
└── organization (FK)

Organization
├── id (PK)
├── name
├── created_by (FK)
└── created_at


Kudo
├── id (PK)
├── sender (FK -> User)
├── receiver (FK -> User)
├── message
└── organization (FK)
```

## User Roles and Permissions

### Current Implementation
1. **Authenticated User**
   - Give kudos to others (limited to 3 per week)
   - View received kudos
   - View personal kudos balance
   - View organization leaderboard
   - View kudos history

### Permissions Implementation
```python
# Base permissions
permission_classes = [IsAuthenticated]

# Additional validations in business logic
- Weekly kudos limit (3 per user)
- Organization-based restrictions
- Self-kudos prevention
```

## API Endpoints

### Authentication
```
POST /api/v1/accounts/login/
    - Login with email and password
    - Returns JWT tokens
POST /api/v1/accounts/signup/
    - Register with valid details
POST /api/v1/accounts/token/refresh/
    - Refresh expired access token
```

### Kudos Operations
```
POST /api/v1/kudos/give/
    - Give kudos to another user
    - Requires: receiver_id, message
    - Validates: kudos availability, same organization

GET /api/v1/kudos/history/
    - View kudos given by current user
    - Paginated response
    - Includes: sender, receiver, message, timestamp

GET /api/v1/kudos/received/
    - View kudos received by current user
    - Paginated response
    - Includes: sender, message, timestamp

GET /api/v1/kudos/leaderboard/
    - View organization kudos leaderboard
    - Sorted by kudos received count
    - Organization-scoped
```

### Implementation Details

#### Kudos Giving
```python
@transaction.atomic
def post(self, request):
    serializer = KudosCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        kudos = serializer.save(
            sender=request.user,
            created_by=request.user
        )
        request.user.kudos_available -= 1
        request.user.save()
```



## User Actions

### Authentication
- Login with email/password
- View current organization context
- Logout

### Kudos Management
- View available kudos balance
- Give kudos to another user
  - Select recipient
  - Write appreciation message
  - Submit kudo
- View received kudos
  - See sender details
  - Read appreciation messages
  - View timestamp

### Admin Actions
- View organization statistics
- Create users 

## Technical Implementation Details

### Weekly Kudos Reset
```python
def reset_weekly_kudos():
    """Reset kudos for users exactly after 7 days"""
    now = timezone.now()
    reset_before = now - timedelta(days=7)
    
    with transaction.atomic():
        # Reset kudos for users whose last reset was 7 or more days ago
        users_to_reset = User.objects.filter(
            is_active=True,
            last_kudos_reset__lte=reset_before
        ).select_for_update()
        
        updated = users_to_reset.update(
            kudos_available=3,
            last_kudos_reset=now
        )
    
    return f"Reset kudos for {updated} users" 
```

### Kudos Validation
```python
 def validate_receiver(self, value):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required")
        
        # Check if receiver is from same organization
        if value.organization != request.user.organization:
            raise serializers.ValidationError("Can only give kudos to users in your organization")
        
        # Check if sender has kudos available
        if request.user.kudos_available <= 0:
            raise serializers.ValidationError("No kudos available to give")
            
        # Prevent self-kudos
        if value == request.user:
            raise serializers.ValidationError("Cannot give kudos to yourself")
            
        return value
```

## Data Generation

### Fixture Generation
- Random user creation
- Organization assignment
- Kudos distribution with varied:
  - Messages
  - Timestamps
  - User combinations
  - Kudos amounts

### Sample Data Scale
- 3-5 Organizations
- 10-15 Users per organization
- 20-30 Kudos transactions per week

## Frontend Implementation

### Route Structure
```javascript
// Public Routes
/login      - User authentication
/register   - New user registration

// Protected Routes
/dashboard  - Main kudos dashboard
/leaderboard - Organization leaderboard
/team       - Team member listing
/kudos-history - Personal kudos history
/kudos-received - Received kudos
/profile    - User profile management
```

### Core Components


#### Pages
1. **Dashboard**
   - Kudos giving interface
   - Available kudos counter
   - Quick actions

2. **Leaderboard**
   - Organization kudos rankings
   - User statistics
   - Time-based filtering

3. **Team**
   - Organization member listing
   - Quick kudos actions
   - Member details

4. **Profile**
   - User information
   - Kudos statistics
   - Organization context



### State Management
1. **Authentication State**
   - JWT tokens
   - User information
   - Organization context

2. **Kudos State**
   - Available kudos
   - Kudos history
   - Received kudos

3. **Application State**
   - Loading states
   - Error handling
   - Navigation state

### Performance Optimizations
1. **Code Splitting**
```javascript
// Lazy loaded components
const Login = lazy(() => import('./pages/Auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Leaderboard = lazy(() => import('./pages/Leaderboard/Leaderboard'));
```

2. **API Integration**
```javascript
// Axios instance with interceptors
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Security Measures
1. **Token Management**
   - Secure token storage
   - Automatic token refresh
   - Token validation

2. **Route Protection**
   - Authentication guards
   - Role-based access
   - Session management

3. **Error Handling**
   - API error interceptors
   - Token expiration handling
   - Network error recovery

### UI Components
1. **Layout Components**
   - Navbar
   - Footer
   - Layout wrapper

2. **Feature Components**
   - KudosForm
   - KudosList
   - UserBalance
   - LeaderboardTable

3. **Shared Components**
   - LoadingSpinner
   - ErrorBoundary
   - Notifications


## Development Guidelines

1. Code Style
   - PEP 8 for Python
   - ESLint for JavaScript
   - Component-based architecture
   - DRY principle

2. Git Workflow
   - Feature branch workflow
   - Pull request reviews
   - Semantic versioning
   - Conventional commits

3. Documentation
   - Code documentation
   - API documentation
   - Setup guides
   - User guides 