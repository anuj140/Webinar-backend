# Webinar Backend API



A simple MERN stack backend for webinar landing page with admin panel functionality and custom error handling.



## Tech Stack



- **Express.js** - Web framework

- **MongoDB** with **Mongoose** - Database

- **JWT** - Authentication

- **CORS** - Cross-origin requests

- **express-async-errors** - Error handling

- **http-status-codes** - HTTP status codes

- **Custom Error Classes** - Enhanced error handling



## Installation



1. Clone the repository

2. Install dependencies:

```bash

npm install

```



3. Create `.env` file:

```env

PORT=3000

MONGODB_URI=MONGO_URI=mongodb+srv://Raj:rajAtlasPassword@nodeexpressjs.8vp63z9.mongodb.net/003-WEBINAR-LANDING-PAGE?retryWrites=true&w=majority&appName=NodeExpressJs
//Above MONGODB_URI is dummy 



JWT_SECRET=your_jwt_secret_key_change_in_production

NODE_ENV=development

```



4. Start the server:

```bash

# Development

npm run dev



# Production

npm start

```



## API Endpoints



### Health Check

- **GET** `/health` - Check server status



### User Registration

- **POST** `/api/v1/users/register` - Register for webinar

  ```json

  {

    "name": "John Doe",

    "email": "john@example.com"

  }

  ```





### Admin Authentication

- **POST** `/api/v1/admin/create` - Create admin account (setup)

  ```json

  {

    "name": "Admin Name",

    "email": "admin@example.com",

    "password": "password123",

    "role": "admin"

  }

  ```



- **POST** `/api/v1/admin/login` - Admin login

  ```json

  {

    "email": "admin@example.com",

    "password": "password123"

  }

  ```



- **GET** `/api/v1/admin/profile` - Get admin profile (requires auth)

- **PUT** `/api/v1/admin/profile` - Update admin profile (requires auth)

- **PUT** `/api/v1/admin/password` - Change admin password (requires auth)



### User Management (Admin Only)

All routes require `Authorization: Bearer <token>` header



- **GET** `/api/v1/users` - Get all users with advanced filtering

  - Query params: `page`, `limit`, `status`, `search`, `sortBy`, `sortOrder`

  - Example: `/api/v1/users?page=1&limit=20&status=registered&search=john&sortBy=name&sortOrder=asc`



- **GET** `/api/v1/users/stats` - Get comprehensive registration statistics (admin only)



- **GET** `/api/v1/users/:id` - Get user by ID



- **PUT** `/api/v1/users/:id/status` - Update user status

  ```json

  {

    "status": "confirmed"

  }

  ```

  Status options: `registered`, `confirmed`, `attended`, `cancelled`



- **DELETE** `/api/v1/users/:id` - Delete single user



- **DELETE** `/api/v1/users` - Delete multiple users

  ```json

  {

    "userIds": ["userId1", "userId2", "userId3"]

  }

  ```



## Enhanced Features



### Custom Error Handling

The API uses custom error classes for better error management:

- `BadRequestError` - 400 status

- `UnauthorizedError` - 401 status  

- `NotFoundError` - 404 status

- `ConflictError` - 409 status



### Advanced Statistics (Admin Only)

The `/api/v1/users/stats` endpoint provides comprehensive analytics:

- Total registrations

- Daily, weekly, monthly counts

- Growth metrics

- Status breakdown

- Daily registration trends (last 30 days)

- Recent registrations list



### Enhanced User Management

- Advanced filtering and sorting

- Bulk user deletion

- Detailed user information

- Registration tracking



## Usage Examples



1. **Create an admin account:**

```bash

curl -X POST http://localhost:3000/api/v1/admin/create \

  -H "Content-Type: application/json" \

  -d '{"name":"Admin","email":"admin@test.com","password":"admin123"}'

```



2. **Login as admin:**

```bash

curl -X POST http://localhost:3000/api/v1/admin/login \

  -H "Content-Type: application/json" \

  -d '{"email":"admin@test.com","password":"admin123"}'

```



3. **Register a user:**

```bash

curl -X POST http://localhost:3000/api/v1/users/register \

  -H "Content-Type: application/json" \

  -d '{"name":"John Doe","email":"john@test.com"}'

```



4. **Get all users with filtering (admin token required):**

```bash

curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=10&status=registered" \

  -H "Authorization: Bearer YOUR_JWT_TOKEN"

```



5. **Get comprehensive stats (admin token required):**

```bash

curl -X GET http://localhost:3000/api/v1/users/stats \

  -H "Authorization: Bearer YOUR_JWT_TOKEN"

```



6. **Delete multiple users (admin token required):**

```bash

curl -X DELETE http://localhost:3000/api/v1/users \

  -H "Authorization: Bearer YOUR_JWT_TOKEN" \

  -H "Content-Type: application/json" \

  -d '{"userIds":["userId1","userId2"]}'

```



## Project Structure



```

webinar-simple/

├── controllers/

│   ├── adminController.js

│   └── userController.js

├── errors/

│   ├── BadRequestError.js

│   ├── ConflictError.js

│   ├── CustomError.js

│   ├── NotFoundError.js

│   ├── UnauthorizedError.js

│   └── index.js

├── middleware/

│   ├── auth.js

│   └── errorHandler.js

├── models/

│   ├── Admin.js

│   └── User.js

├── routes/

│   ├── adminRoutes.js

│   └── userRoutes.js

├── .env

├── server.js

└── package.json

```



## Features



- ✅ User registration for webinar

- ✅ Admin authentication with JWT

- ✅ Advanced user management (CRUD operations)

- ✅ User status tracking

- ✅ Comprehensive registration statistics

- ✅ Custom error handling with specific error classes

- ✅ Advanced filtering and sorting

- ✅ Bulk operations (delete multiple users)

- ✅ Growth metrics and analytics

- ✅ CORS enabled

- ✅ MongoDB integration with Mongoose

- ✅ MVC architecture

- ✅ express-async-errors for clean error handling



## Error Handling



The API uses custom error classes and returns consistent error responses:



```json

{

  "success": false,

  "message": "Specific error description"

}

```



Error types:

- **400 Bad Request** - Invalid input data

- **401 Unauthorized** - Authentication required or failed

- **404 Not Found** - Resource not found

- **409 Conflict** - Duplicate data (email already exists)

- **500 Internal Server Error** - Server errors



## Security



- JWT tokens for admin authentication

- Password validation (minimum 6 characters)

- Email validation with regex

- CORS enabled for cross-origin requests

- Input validation and sanitization

- Custom error handling to prevent information leakage



## Admin Capabilities



Admins can:

- View all registered users with advanced filtering

- Get comprehensive registration statistics

- Update user registration status

- Delete individual users

- Delete multiple users in bulk

- Track registration growth and trends

- View recent registrations

- Manage their own profile and password