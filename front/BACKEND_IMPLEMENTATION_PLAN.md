# FutureIntern Platform - Complete Backend Implementation Plan

## 📋 Table of Contents
1. [Technology Stack Recommendations](#technology-stack)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [File Upload System](#file-upload-system)
6. [AI Chatbot Integration](#ai-chatbot-integration)
7. [Matching Algorithm](#matching-algorithm)
8. [Security & Middleware](#security--middleware)
9. [Implementation Checklist](#implementation-checklist)

---

## 🛠️ Technology Stack Recommendations

### Recommended Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL (with Prisma ORM) or MongoDB (with Mongoose)
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Storage**: AWS S3 or local storage (multer)
- **AI Integration**: OpenAI API (already configured)
- **Validation**: Joi or Zod
- **Email**: Nodemailer or SendGrid
- **Testing**: Jest + Supertest

### Alternative Stack
- **Backend**: Python (FastAPI/Django) or Go
- **Database**: MySQL, PostgreSQL, or MongoDB
- **File Storage**: Cloudinary, AWS S3, or Azure Blob Storage

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'company', 'admin')),
  major VARCHAR(100),
  cv_url TEXT,
  cv_filename VARCHAR(255),
  interests TEXT[], -- Array of interests
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Companies Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  location VARCHAR(255),
  website VARCHAR(255),
  description TEXT,
  logo_url TEXT,
  employee_count VARCHAR(50),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
```

### Internships Table
```sql
CREATE TABLE internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  type VARCHAR(50) CHECK (type IN ('Full-time', 'Part-time', 'Remote', 'Hybrid')),
  duration VARCHAR(100),
  requirements TEXT[],
  skills_required TEXT[],
  salary_range VARCHAR(100),
  application_deadline DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'draft')),
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_internships_company_id ON internships(company_id);
CREATE INDEX idx_internships_status ON internships(status);
CREATE INDEX idx_internships_created_at ON internships(created_at DESC);
```

### Applications Table
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  internship_id UUID REFERENCES internships(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'shortlisted', 'accepted', 'rejected')),
  matching_score DECIMAL(5,2), -- 0.00 to 100.00
  cover_letter TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  notes TEXT, -- Internal notes for company
  UNIQUE(student_id, internship_id)
);

CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_internship_id ON applications(internship_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_matching_score ON applications(matching_score DESC);
```

### Chatbot Conversations Table
```sql
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chatbot_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_created_at ON chatbot_conversations(created_at DESC);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'application_status', 'new_internship', 'message', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

---

## 🔌 API Endpoints

### Base URL: `/api/v1`

### Authentication Endpoints

#### POST `/auth/register`
**Description**: Multi-step student registration
**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "interests": ["Web Development", "AI", "Marketing"],
  "major": "Computer Science",
  "cv": "file" // multipart/form-data
}
```
**Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "fullName": "John Doe",
      "role": "student"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/auth/login`
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

#### POST `/auth/register-company`
**Description**: Company registration
**Request Body**:
```json
{
  "email": "company@example.com",
  "password": "securePassword123",
  "companyName": "TechCorp",
  "industry": "Technology",
  "location": "San Francisco, CA",
  "website": "https://techcorp.com",
  "description": "Leading tech company"
}
```

#### POST `/auth/refresh-token`
**Description**: Refresh JWT token
**Headers**: `Authorization: Bearer <refresh_token>`

#### POST `/auth/forgot-password`
**Request Body**:
```json
{
  "email": "user@example.com"
}
```

#### POST `/auth/reset-password`
**Request Body**:
```json
{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

#### POST `/auth/logout`
**Headers**: `Authorization: Bearer <token>`

---

### User Management Endpoints

#### GET `/users/me`
**Description**: Get current user profile
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "student",
    "major": "Computer Science",
    "interests": ["Web Development", "AI"],
    "cvUrl": "https://storage.../cv.pdf",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

#### PUT `/users/me`
**Description**: Update user profile
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "fullName": "John Doe Updated",
  "major": "Software Engineering",
  "interests": ["Web Development", "AI", "Cyber Security"]
}
```

#### POST `/users/me/cv`
**Description**: Upload/update CV
**Headers**: `Authorization: Bearer <token>`
**Content-Type**: `multipart/form-data`
**Request**: `cv` file (PDF/DOCX, max 5MB)

#### DELETE `/users/me/cv`
**Description**: Delete CV

#### GET `/users/:id`
**Description**: Get user by ID (admin only)
**Headers**: `Authorization: Bearer <admin_token>`

---

### Internship Endpoints

#### GET `/internships`
**Description**: List internships with filtering
**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `search`: string (search in title/description)
- `location`: string
- `type`: 'Full-time' | 'Part-time' | 'Remote' | 'Hybrid'
- `industry`: string
- `skills`: string[] (comma-separated)
- `sortBy`: 'relevance' | 'date' | 'applications' (default: 'date')
- `studentId`: UUID (for personalized matching)

**Response**:
```json
{
  "success": true,
  "data": {
    "internships": [/* array of internships */],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### GET `/internships/:id`
**Description**: Get internship details
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Software Engineer Intern",
    "company": {
      "id": "uuid",
      "name": "TechCorp",
      "logo": "url"
    },
    "description": "...",
    "location": "San Francisco, CA",
    "type": "Full-time",
    "requirements": ["..."],
    "skillsRequired": ["JavaScript", "React"],
    "applicationDeadline": "2025-03-01",
    "applicationsCount": 45,
    "matchingScore": 85.5 // if studentId provided
  }
}
```

#### POST `/internships`
**Description**: Create internship (company only)
**Headers**: `Authorization: Bearer <company_token>`
**Request Body**:
```json
{
  "title": "Software Engineer Intern",
  "description": "We are looking for...",
  "location": "San Francisco, CA",
  "type": "Full-time",
  "duration": "3-6 months",
  "requirements": ["Bachelor's degree", "..."],
  "skillsRequired": ["JavaScript", "React", "Node.js"],
  "salaryRange": "$3000-$5000/month",
  "applicationDeadline": "2025-03-01"
}
```

#### PUT `/internships/:id`
**Description**: Update internship (company owner only)

#### DELETE `/internships/:id`
**Description**: Delete internship (company owner only)

#### GET `/internships/featured`
**Description**: Get featured internships

---

### Application Endpoints

#### POST `/applications`
**Description**: Apply to internship
**Headers**: `Authorization: Bearer <student_token>`
**Request Body**:
```json
{
  "internshipId": "uuid",
  "coverLetter": "I am interested in..." // optional
}
```
**Response**:
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": "uuid",
    "matchingScore": 87.5
  }
}
```

#### GET `/applications/me`
**Description**: Get student's applications
**Headers**: `Authorization: Bearer <student_token>`
**Query Parameters**: `status`, `page`, `limit`

#### GET `/applications/:id`
**Description**: Get application details

#### PUT `/applications/:id/status`
**Description**: Update application status (company only)
**Headers**: `Authorization: Bearer <company_token>`
**Request Body**:
```json
{
  "status": "accepted", // or "rejected", "shortlisted", "under_review"
  "notes": "Internal notes" // optional
}
```

#### GET `/internships/:id/applications`
**Description**: Get applications for internship (company owner only)
**Headers**: `Authorization: Bearer <company_token>`
**Query Parameters**: `status`, `sortBy` (matching_score, date), `page`, `limit`

---

### Matching System Endpoints

#### GET `/internships/recommended`
**Description**: Get personalized recommendations for student
**Headers**: `Authorization: Bearer <student_token>`
**Query Parameters**: `limit` (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "internships": [
      {
        "internship": { /* internship object */ },
        "matchingScore": 92.5,
        "matchReasons": [
          "Skills match: 95%",
          "Interests match: 90%",
          "Location preference: 85%"
        ]
      }
    ]
  }
}
```

#### GET `/applications/:id/matching-details`
**Description**: Get detailed matching breakdown for application

---

### Chatbot Endpoints

#### POST `/chatbot/message`
**Description**: Send message to AI chatbot
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "message": "How do I apply for internships?",
  "conversationHistory": [
    {
      "text": "Previous message",
      "sender": "user"
    },
    {
      "text": "Previous response",
      "sender": "bot"
    }
  ]
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "response": "To apply for internships on FutureIntern...",
    "conversationId": "uuid"
  }
}
```

#### GET `/chatbot/conversations`
**Description**: Get user's chatbot conversation history
**Headers**: `Authorization: Bearer <token>`

---

### Admin Endpoints

#### GET `/admin/stats`
**Description**: Get platform statistics
**Headers**: `Authorization: Bearer <admin_token>`
**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 12458,
    "activeInternships": 342,
    "totalApplications": 2847,
    "totalCompanies": 156,
    "userGrowth": [/* monthly data */],
    "applicationTrends": [/* monthly data */]
  }
}
```

#### GET `/admin/users`
**Description**: List all users with filtering
**Query Parameters**: `role`, `status`, `search`, `page`, `limit`

#### PUT `/admin/users/:id`
**Description**: Update user (admin only)

#### DELETE `/admin/users/:id`
**Description**: Delete user (admin only)

#### GET `/admin/internships`
**Description**: List all internships (admin view)

#### GET `/admin/applications`
**Description**: List all applications (admin view)

---

### Notification Endpoints

#### GET `/notifications`
**Description**: Get user notifications
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**: `unreadOnly` (boolean)

#### PUT `/notifications/:id/read`
**Description**: Mark notification as read

#### PUT `/notifications/read-all`
**Description**: Mark all notifications as read

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'company' | 'admin';
  iat: number;
  exp: number;
}
```

### Password Hashing
- Use **bcrypt** with salt rounds: 12
- Hash password before storing in database
- Never return password hash in API responses

### Middleware Functions

#### `authenticateToken`
```typescript
// Verify JWT token from Authorization header
// Attach user to request object
```

#### `authorizeRole(...roles)`
```typescript
// Check if user has required role
// Usage: authorizeRole('admin', 'company')
```

#### `authorizeOwner`
```typescript
// Check if user owns the resource
// For internships, applications, etc.
```

### Protected Routes Example
```typescript
// Student only
router.post('/applications', authenticateToken, authorizeRole('student'), createApplication);

// Company only
router.post('/internships', authenticateToken, authorizeRole('company'), createInternship);

// Admin only
router.get('/admin/stats', authenticateToken, authorizeRole('admin'), getStats);
```

---

## 📁 File Upload System

### CV Upload Implementation

#### Using Multer (Local Storage)
```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cvs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cv-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});
```

#### Using AWS S3 (Recommended for Production)
```typescript
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'futureintern-cvs',
    acl: 'private',
    key: (req, file, cb) => {
      cb(null, `cvs/${req.user.id}/${Date.now()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: /* same as above */
});
```

### File Access
- Generate signed URLs for private file access
- Set appropriate expiration times
- Implement file deletion when user updates/deletes CV

---

## 🤖 AI Chatbot Integration

### Chatbot Service Implementation

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function getChatbotResponse(
  userMessage: string,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are an intelligent assistant for FutureIntern...` // System prompt
    },
    ...conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.text
    })),
    {
      role: 'user' as const,
      content: userMessage
    }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    max_tokens: 500,
    temperature: 0.8
  });

  return response.choices[0].message.content || '';
}
```

### Rate Limiting
- Implement rate limiting: 20 requests per minute per user
- Use Redis or in-memory store for rate limiting
- Return 429 status code when limit exceeded

### Conversation Storage
- Store conversations in database for history
- Optional: Implement conversation context window management

---

## 🎯 Matching Algorithm

### Matching Score Calculation

```typescript
interface MatchingFactors {
  skillsMatch: number;      // 0-100
  interestsMatch: number;   // 0-100
  locationMatch: number;    // 0-100
  cvRelevance: number;      // 0-100 (from CV analysis)
}

function calculateMatchingScore(
  student: User,
  internship: Internship
): number {
  const factors: MatchingFactors = {
    skillsMatch: calculateSkillsMatch(student, internship),
    interestsMatch: calculateInterestsMatch(student, internship),
    locationMatch: calculateLocationMatch(student, internship),
    cvRelevance: await analyzeCVRelevance(student.cvUrl, internship)
  };

  // Weighted average
  const weights = {
    skillsMatch: 0.35,
    interestsMatch: 0.25,
    locationMatch: 0.15,
    cvRelevance: 0.25
  };

  const score = 
    factors.skillsMatch * weights.skillsMatch +
    factors.interestsMatch * weights.interestsMatch +
    factors.locationMatch * weights.locationMatch +
    factors.cvRelevance * weights.cvRelevance;

  return Math.round(score * 100) / 100; // Round to 2 decimals
}

function calculateSkillsMatch(student: User, internship: Internship): number {
  const studentSkills = extractSkillsFromCV(student.cvUrl) || [];
  const requiredSkills = internship.skillsRequired || [];
  
  if (requiredSkills.length === 0) return 100;
  
  const matchedSkills = requiredSkills.filter(skill =>
    studentSkills.some(studentSkill =>
      studentSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(studentSkill.toLowerCase())
    )
  );
  
  return (matchedSkills.length / requiredSkills.length) * 100;
}

function calculateInterestsMatch(student: User, internship: Internship): number {
  // Match student interests with internship industry/category
  // Simple implementation: check if any interest matches
  const studentInterests = student.interests || [];
  const internshipCategory = internship.category || '';
  
  // More sophisticated matching can be implemented
  return studentInterests.some(interest =>
    internshipCategory.toLowerCase().includes(interest.toLowerCase())
  ) ? 100 : 50;
}
```

### CV Analysis (Optional Enhancement)
- Use OpenAI API to analyze CV content
- Extract skills, experience, education
- Compare with internship requirements
- Store extracted data for faster matching

---

## 🛡️ Security & Middleware

### Input Validation
```typescript
import Joi from 'joi';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  interests: Joi.array().items(Joi.string()).min(1),
  major: Joi.string().optional()
});

// Middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
```

### Error Handling
```typescript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```

### CORS Configuration
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet());
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

## 📧 Email Notifications

### Email Service Setup
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or SendGrid, AWS SES
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendApplicationStatusEmail(
  userEmail: string,
  internshipTitle: string,
  status: string
) {
  const subject = `Application Update: ${internshipTitle}`;
  const html = `
    <h2>Your application status has been updated</h2>
    <p>Internship: ${internshipTitle}</p>
    <p>Status: ${status}</p>
    <p>View your application: ${process.env.FRONTEND_URL}/dashboard</p>
  `;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject,
    html
  });
}
```

### Notification Triggers
- Application status change → Email + In-app notification
- New internship matching interests → In-app notification
- New application received (company) → Email + In-app notification

---

## ✅ Implementation Checklist

### Phase 1: Core Setup
- [ ] Initialize Node.js/TypeScript project
- [ ] Set up database (PostgreSQL/MongoDB)
- [ ] Configure ORM (Prisma/Mongoose)
- [ ] Set up environment variables
- [ ] Create database schema
- [ ] Set up Express.js server
- [ ] Configure CORS and security middleware

### Phase 2: Authentication
- [ ] Implement user registration (multi-step)
- [ ] Implement login with JWT
- [ ] Implement password hashing (bcrypt)
- [ ] Create authentication middleware
- [ ] Implement role-based authorization
- [ ] Add password reset functionality
- [ ] Add email verification

### Phase 3: User Management
- [ ] Create user profile endpoints
- [ ] Implement CV upload (local/S3)
- [ ] Add profile update endpoints
- [ ] Implement file validation and storage

### Phase 4: Internship Management
- [ ] Create internship CRUD endpoints
- [ ] Implement filtering and search
- [ ] Add pagination
- [ ] Implement internship listing for students
- [ ] Add company-specific endpoints

### Phase 5: Application System
- [ ] Create application submission endpoint
- [ ] Implement matching algorithm
- [ ] Add application status management
- [ ] Create application listing endpoints
- [ ] Add company application review endpoints

### Phase 6: AI Chatbot
- [ ] Integrate OpenAI API
- [ ] Create chatbot message endpoint
- [ ] Implement conversation history
- [ ] Add rate limiting
- [ ] Store conversations in database

### Phase 7: Admin Panel
- [ ] Create admin authentication
- [ ] Implement statistics endpoints
- [ ] Add user management endpoints
- [ ] Create internship management endpoints
- [ ] Add application management endpoints

### Phase 8: Notifications
- [ ] Set up email service
- [ ] Create notification system
- [ ] Implement in-app notifications
- [ ] Add email templates
- [ ] Set up notification triggers

### Phase 9: Testing & Security
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Security audit
- [ ] Performance optimization
- [ ] Error handling improvements

### Phase 10: Deployment
- [ ] Set up production database
- [ ] Configure file storage (S3)
- [ ] Set up CI/CD pipeline
- [ ] Deploy to production
- [ ] Set up monitoring and logging

---

## 🔧 Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://futureintern.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/futureintern
# or
MONGODB_URI=mongodb://localhost:27017/futureintern

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=futureintern-cvs

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@futureintern.com

# Redis (for rate limiting, optional)
REDIS_URL=redis://localhost:6379
```

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ /* array of validation errors */ ]
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 🚀 Quick Start Implementation Guide

1. **Initialize Project**
   ```bash
   npm init -y
   npm install express typescript ts-node @types/node @types/express
   npm install prisma @prisma/client
   npm install jsonwebtoken bcrypt
   npm install multer aws-sdk
   npm install openai
   npm install joi
   npm install nodemailer
   npm install helmet cors express-rate-limit
   ```

2. **Set up Prisma**
   ```bash
   npx prisma init
   # Update schema.prisma with database schema
   npx prisma migrate dev
   ```

3. **Create folder structure**
   ```
   src/
   ├── controllers/
   ├── services/
   ├── middleware/
   ├── routes/
   ├── models/
   ├── utils/
   └── types/
   ```

4. **Implement endpoints in order**:
   - Authentication → User Management → Internships → Applications → Chatbot → Admin

---

This comprehensive backend implementation plan covers all aspects needed to support the FutureIntern platform frontend. Each section can be implemented incrementally, starting with core authentication and building up to advanced features like AI matching and admin panel.

