# API Integration Guide

This guide shows how to use the API service to connect the frontend with the backend.

## Quick Start

### 1. Start the Backend

```bash
cd back/futureintern-backend
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac
python run.py
```

The backend will run on `http://localhost:5000`

### 2. Start the Frontend

```bash
cd front
npm install  # if not already done
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Use the API Service

Import and use the API service in your components:

```typescript
import { api } from '../services/api';

// Example: Login
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await api.auth.login(email, password);
    console.log('Logged in:', response.user);
    // Token is automatically saved to localStorage
    navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    // Show error to user
  }
};

// Example: Register
const handleRegister = async (formData: {
  name: string;
  email: string;
  password: string;
  university: string;
  major: string;
  interests: string[];
  cv?: File;
}) => {
  try {
    const response = await api.auth.registerStudent(formData);
    console.log('Registered:', response.user);
    // If CV is provided, it will be uploaded automatically
    navigate('/dashboard');
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// Example: Get Internships
const fetchInternships = async () => {
  try {
    const internships = await api.internships.getAll({
      page: 1,
      per_page: 10,
      search: 'software'
    });
    console.log('Internships:', internships);
  } catch (error) {
    console.error('Failed to fetch internships:', error);
  }
};

// Example: Apply for Internship
const applyForInternship = async (internshipId: number) => {
  try {
    const application = await api.applications.create(internshipId);
    console.log('Application created:', application);
  } catch (error) {
    console.error('Application failed:', error);
  }
};
```

## Available API Methods

### Authentication (`api.auth`)
- `login(email, password)` - Login user
- `registerStudent(data)` - Register new student
- `logout()` - Logout and clear token
- `getCurrentUser()` - Get current user profile
- `refreshToken()` - Refresh access token

### Users (`api.users`)
- `getProfile(userId?)` - Get user profile
- `updateProfile(userId, data)` - Update user profile
- `uploadCV(file)` - Upload CV file

### Internships (`api.internships`)
- `getAll(params?)` - Get all internships (with pagination/search)
- `getById(id)` - Get internship by ID
- `create(data)` - Create new internship (companies)
- `update(id, data)` - Update internship
- `delete(id)` - Delete internship

### Applications (`api.applications`)
- `getAll()` - Get all applications
- `getById(id)` - Get application by ID
- `create(internshipId, data?)` - Create application
- `updateStatus(id, status)` - Update application status
- `delete(id)` - Delete application

### Recommendations (`api.recommendations`)
- `getRecommendations()` - Get personalized recommendations

### Admin (`api.admin`)
- `getAllUsers()` - Get all users (admin only)
- `getAllInternships()` - Get all internships (admin only)
- `getAllApplications()` - Get all applications (admin only)
- `deleteUser(userId)` - Delete user (admin only)

### Chatbot (`api.chatbot`)
- `sendMessage(message)` - Send message to chatbot

## Authentication

The API service automatically handles JWT tokens:
- Tokens are stored in `localStorage` as `access_token`
- Tokens are automatically included in all API requests
- On 401 errors, tokens are cleared and user is redirected to login

## Error Handling

All API methods throw errors that you should catch:

```typescript
try {
  const data = await api.internships.getAll();
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // Show error message to user
  }
}
```

## Environment Variables

Create a `.env` file in the `front/` directory:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

In development, the Vite proxy automatically forwards `/api/*` requests to the backend, so you don't need to change this unless your backend runs on a different port.

## Next Steps

1. Update `Login.tsx` to use `api.auth.login()`
2. Update `SignUp.tsx` to use `api.auth.registerStudent()`
3. Update `Dashboard.tsx` to fetch real data using `api.applications.getAll()`
4. Update `BrowseInternships.tsx` to fetch internships using `api.internships.getAll()`
5. Add loading states and error handling to all API calls

