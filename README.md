
# Equipment Rental Marketplace — Backend

The backend API for the Equipment Rental Marketplace, a full-stack web application that connects customers with equipment owners. Customers can explore equipment, make rental bookings, complete payments, and leave reviews, while owners manage their equipment listings and administrators manage the platform.

Built with Node.js, Express.js, and MongoDB.

## Live Deployment

- **Backend API:** https://equipment-backend-gwok.onrender.com
- **GitHub Repository:** https://github.com/Soha-Tabassom-Supre/equipment_backend

## Features

- **Authentication:** Secure authentication with Google OAuth support.
- **Role-Based Authorization:** Different permissions for customers, owners, and administrators.
- **Equipment Management:** Create, retrieve, update, and manage equipment listings.
- **Dynamic Categories:** Retrieve equipment categories from the database.
- **Booking Management:** Create, accept, reject, and cancel rental bookings.
- **Payment Integration:** Stripe Checkout integration for rental payments.
- **Payment Verification:** Stripe webhook integration for payment confirmation.
- **Favorites:** Add and remove equipment from favorites.
- **Review System:** Submit, retrieve, update, and delete equipment reviews.
- **Owner Dashboard APIs:** Manage owner-specific equipment and activities.
- **Admin Management:** Manage platform users and equipment.
- **Database Indexing:** MongoDB indexes for improved query performance.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- MongoDB Node.js Driver
- Better Auth JWT verification (JOSE)
- Google Auth Library
- Passport
- Stripe
- bcryptjs
- dotenv
- CORS

## Project Structure

```text
server/
├── config/
│   ├── db.js
│   ├── indexes.js
│   └── stripe.js
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── bookingController.js
│   ├── equipmentController.js
│   ├── favoriteController.js
│   ├── ownerController.js
│   ├── paymentController.js
│   └── reviewController.js
│
├── middleware/
│   ├── auth.js
│   └── authorize.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── equipmentRoutes.js
│   ├── favoriteRoutes.js
│   ├── ownerRoutes.js
│   ├── paymentRoutes.js
│   └── reviewRoutes.js
│
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Soha-Tabassom-Supre/equipment_backend.git
```

### 2. Navigate to the project directory

```bash
cd equipment_backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the root directory.

Configure the following variables according to your backend configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=your_database_name
CLIENT_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

Use the exact environment variable names required by your source code. Never commit actual credentials or secret keys.

### 5. Start the development server

```bash
npm run dev
```

### 6. Start the production server

```bash
npm start
```

## Available Scripts

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start development server using Nodemon |
| `npm start` | Start production server |

## API Modules

The backend provides RESTful API endpoints organized into the following modules:

| Module | Description |
|---|---|
| Authentication | User authentication and Google OAuth |
| Equipment | Equipment listings and categories |
| Bookings | Rental booking operations |
| Payments | Stripe checkout and payment verification |
| Favorites | Customer favorite equipment |
| Reviews | Equipment reviews and ratings |
| Owner | Owner-specific operations |
| Admin | Administrative operations |

Routes are defined in the `routes/` directory, and their business logic is implemented in the corresponding files inside `controllers/`.

## Authentication and Authorization

Protected API endpoints use token verification middleware.

Role-based authorization restricts access according to user roles:

- **Customer:** Browse equipment, manage favorites, create bookings, and submit reviews.
- **Owner:** Manage equipment listings and owner-related operations.
- **Admin:** Manage users and equipment.

## Payment Processing

Stripe Checkout is integrated to handle rental payments.

The payment process includes:

1. A customer selects a confirmed booking.
2. The backend creates a Stripe Checkout session.
3. The customer completes payment through Stripe.
4. Stripe sends a webhook event to the backend.
5. The backend verifies the event and updates the payment status.

## Database

MongoDB is used to store application data, including:

- Users
- Equipment
- Bookings
- Payments
- Favorites
- Reviews

Database connection and index configuration are maintained in the `config/` directory.

## Deployment

The backend is deployed on Render.

**Production URL:** https://equipment-backend-gwok.onrender.com

Production environment variables and credentials are configured through the Render dashboard.

## Author

Developed by Soha Tabassom Supre.
