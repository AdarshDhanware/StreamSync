
# 📺 StreamSync – Backend for Video Streaming Platform	

StreamSync is a backend for a YouTube-like platform built with Node.js, Express.js, and MongoDB. It features JWT-based authentication, Cloudinary video uploads, subscriptions, comments, likes/dislikes, playlists, and aggregation pipelines. Designed with MVC architecture and Swagger docs, it ensures scalability, modularity, and production-readiness for real-world applications.

---

## 📚 API Documentation

All API endpoints for **StreamSync** are documented using **Swagger (OpenAPI)** and automatically generated using `swagger-autogen`.

> You can explore the API via the interactive Swagger UI.

**🔗 Live Swagger Docs**:[View API Documentation](https://streamsync-2rv0.onrender.com/api-docs/)  

---

## 🚀 Features Implemented

The StreamSync backend powers all core operations such as:

- Secure user auth with JWT & cookies
- Video upload with Multer + Cloudinary
- CRUD for videos, playlists, comments
- Subscriptions, likes/dislikes per user
- Pagination using aggregate-paginate
- Rich data via MongoDB aggregation pipelines
- Utility-based architecture for cleaner code
- Environment-driven config for scalability

Designed with **clean code practices**, this backend is structured for **scalability**, **reliability**, and **extensibility**, supporting future enhancements like monetization, or live streaming integration.

---

## 🧱 Tech Stack

- **Node.js + Express.js** – Backend runtime and web framework  
- **MongoDB + Mongoose** – NoSQL database with schema modeling  
- **Aggregation Pipelines** – For complex relational-like queries across collections  
- **mongoose-aggregate-paginate-v2** – Efficient pagination  
- **JWT + HTTP-only Cookies** – Secure authentication  
- **bcrypt** – Password hashing  
- **Multer + Cloudinary** – File uploads and cloud storage  
- **cors** – Cross-origin request handling  
- **dotenv** – Environment variable management  
- **Prettier** – Code formatting for consistency  
- **Swagger + swagger-autogen** – Auto-generated API documentation

---

## ✨ Core Highlights
- 🔄 Utility-Driven Architecture: Common logic is abstracted into utility classes/functions for cleaner and reusable code.

    - ✅ ApiResponse: standardizes all successful API responses
    - ❌ ApiError: provides structured, consistent error responses with HTTP status codes
    - ⚙️ asyncHandler: a higher-order function that wraps all controller methods to catch async errors and forward them to the global error handler, eliminating repetitive try-catch blocks.

- 📁 Well-defined Folder Structure using MVC pattern:

    - controllers/, models/, routes/, middlewares/, utils/, etc.

---

## 📁 Project Structure

```text
StreamSync/
├── docs/                    # Generated Swagger schema file (used by Swagger UI)
├── public/temp/             # Temporary storage for uploaded files before processing or cleanup
├── src/                      
│   ├── controllers/         # Logic for each route (User, Video, Playlist)
│   ├── models/              # Mongoose schemas (User.model.js, Video.model.js, etc.)
│   ├── routes/              # All route definitions
│   ├── middlewares/         # Auth, file uploading.
│   ├── utils/               # Helper functions, API errors, response format
│   ├── db/                  # Database connection (mongoose.connect)
│   ├── index.js             # App entry point (server setup)
│   ├── app.js               # Express app setup (middleware, routes)
│   └── constants.js         # Global constants
├── .env                     # Environment variables
├── .gitignore               # Files/folders to ignore in Git
├── .prettierignore          # Files to ignore from Prettier formatting
├── .prettierrc              # Prettier configuration
├── package.json             # Project dependencies & scripts
├── package-lock.json        # Dependency lock file
├── swagger.js               # Swagger configuration file

```

This structure ensures:

- ✅ Clean separation of concerns  
- ✅ Easy debugging and testing  
- ✅ Scalable codebase as the application grows

---

## Implementation Highlights

### 🔄 Authentication System
- Register/Login using secure password hashing (bcrypt)
- JWT-based authentication stored in **HTTP-only cookies**
- Auto-refresh flow (if implemented via refresh tokens)
- Middleware to protect private routes

### 🧠 MongoDB Aggregation Pipelines
- Used extensively to fetch complex data like:
  - User profile with video and playlist counts
  - Subscription list with channel info
  - Admin analytics (total users, video views, etc.)
- `$lookup`, `$match`, `$group`, `$addFields`, and `$project` stages are used to simulate joins and derive statistical insights.

### 📑 Pagination
- All large datasets (videos, playlists, user uploads) are paginated.
- Query params like `page` and `limit` control response size.
- Standardized pagination response format: `data`, `page`, `hasNextPage`, `totalCount`.

### 🎥 Video & Playlist Management
- Users can upload, update, and delete videos
- Playlists allow adding/removing videos dynamically
- Each playlist is linked to the user and videos through references
- Pagination supported for videos within a playlist

### ❤️ Likes, Dislikes & History
- Like/dislike logic prevents multiple reactions from the same user
- Video watch history maintained per user
- Optimized using `$addToSet` and `$pull` operations in MongoDB

---

## 📦 Project Complexity & Scalability

| Aspect               | Description |
|----------------------|-------------|
| 🧩 **Complexity**     | Involves relational-style joins, custom middleware pipelines, multi-layer logic, and dynamic queries. |
| 📈 **Scalability**    | Modular folder structure, stateless APIs, and MongoDB’s performance with aggregation make the project ready for large-scale deployments. |
| 🛡 **Security**       | Utilizes secure cookies, input validation, and route protection. |
| 🔧 **Maintainability**| Easy to extend due to clean file separation, utility-based architecture, and reusable controllers/middlewares. |

---
