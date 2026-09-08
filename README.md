# Internal Employee Feedback & Kudos Portal

A self-contained internal web application for employee recognition and feedback. Built with Bun, TypeScript, SQLite, and Material Design 3.

## Features

- **Public Kudos**: Recognize colleagues for their great work
- **Feedback Submission**: Share feedback with configurable visibility (Public, Manager-Only, HR-Only)
- **Anonymous Feedback**: Submit feedback anonymously
- **Role-Based Access Control**: Different permissions for Employees, Managers, and HR Admins
- **User Management**: HR admins can activate/deactivate user accounts
- **Fully Offline**: No external dependencies, runs entirely locally

## Tech Stack

- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Framework**: Hono (lightweight web framework)
- **Database**: SQLite (via `bun:sqlite`)
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: Bun's native `Bun.password` API (Argon2)
- **Validation**: Zod
- **Frontend**: Vanilla JavaScript with Material Design 3

## Prerequisites

- [Bun](https://bun.sh) v1.0 or higher

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file (or copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
JWT_SECRET=your-secret-key-change-this-to-something-secure
DATABASE_PATH=./kudos.db
NODE_ENV=development
```

## Database Setup

Initialize and seed the database with sample data:

```bash
bun run seed
```

This creates:
- 3 sample users (one per role)
- Sample kudos posts
- Sample feedback submissions

### Sample Credentials

After seeding, you can login with:

- **Employee**: `alice@company.com` / `employee123`
- **Manager**: `diana@company.com` / `manager123`
- **HR Admin**: `frank@company.com` / `hradmin123`

## Running the Application

### Development Mode (with auto-reload)

```bash
bun run dev
```

### Production Mode

```bash
bun run start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Application Structure

```
kudos/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── db/
│   │   ├── database.ts          # SQLite connection & initialization
│   │   └── schema.sql           # Database schema
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification middleware
│   │   └── logger.ts            # Request logging
│   ├── routes/
│   │   ├── auth.routes.ts       # Login/register endpoints
│   │   ├── kudos.routes.ts      # Kudos CRUD operations
│   │   ├── feedback.routes.ts   # Feedback CRUD operations
│   │   └── admin.routes.ts      # HR admin operations
│   ├── services/
│   │   ├── auth.service.ts      # Password hashing, JWT generation
│   │   ├── kudos.service.ts     # Business logic for kudos
│   │   ├── feedback.service.ts  # Business logic for feedback
│   │   └── user.service.ts      # User management
│   ├── models/
│   │   └── types.ts             # TypeScript types & Zod schemas
│   └── utils/
│       └── errors.ts            # Custom error classes
├── public/
│   ├── *.html                   # HTML pages
│   ├── css/material.css         # Material Design 3 styles
│   └── js/                      # Client-side JavaScript
├── scripts/
│   └── seed.ts                  # Database seeding script
└── tests/                       # Test files
```

## User Roles & Permissions

### EMPLOYEE
- View all public kudos
- Submit kudos for colleagues
- View public feedback only
- Submit feedback (public or anonymous) with visibility controls

### MANAGER
- All EMPLOYEE permissions
- View MANAGER_ONLY feedback for their department only
- Cannot see other departments' manager-only feedback

### HR_ADMIN
- All EMPLOYEE and MANAGER permissions
- View all feedback regardless of visibility
- See actual authors of anonymous feedback
- Manage user accounts (activate/deactivate)
- Access admin dashboard

## Authorization Rules

The application enforces authorization at the API layer:

1. **Kudos**: All authenticated users can create and view public kudos
2. **Feedback Visibility**:
   - `PUBLIC`: Visible to all employees
   - `MANAGER_ONLY`: Visible only to managers of the target department
   - `HR_ONLY`: Visible only to HR admins
3. **Anonymous Feedback**: Author identity is hidden from non-HR users
4. **Admin Routes**: Protected by HR_ADMIN role requirement

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create new user account
- `POST /login` - Login with email/password
- `POST /logout` - Logout (clear auth cookie)
- `GET /me` - Get current user info

### Kudos (`/api/kudos`)
- `POST /` - Create kudos post
- `GET /` - List all public kudos
- `GET /my-received` - List kudos received by current user
- `GET /my-given` - List kudos given by current user

### Feedback (`/api/feedback`)
- `POST /` - Submit feedback
- `GET /` - List feedback visible to current user (role-filtered)
- `GET /:id` - Get single feedback (with authorization check)
- `GET /department/:department` - List feedback for specific department

### Admin (`/api/admin`) - HR_ADMIN only
- `GET /users` - List all users
- `PATCH /users/:id/status` - Activate/deactivate user
- `GET /feedback/all` - View all feedback (including anonymous authors)

## Testing

Run the test suite:

```bash
bun test
```

The test suite covers:
- Password hashing and verification
- JWT generation and verification
- Authorization rules for feedback visibility
- Role-based access control
- Anonymous feedback author hiding

## Security Features

- **Password Hashing**: Argon2id via Bun's native API
- **JWT Authentication**: Signed tokens with configurable secret
- **HTTP-Only Cookies**: Prevents XSS token theft
- **Authorization Checks**: Enforced at API layer, not just UI
- **Parameterized Queries**: SQL injection prevention
- **Input Validation**: Zod schema validation on all inputs
- **Sensitive Data Filtering**: Anonymous author IDs never leaked to unauthorized roles

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `DATABASE_PATH` | Path to SQLite database file | `./kudos.db` |
| `NODE_ENV` | Environment (development/production) | `development` |

**⚠️ Important**: Change `JWT_SECRET` to a secure random string before deploying.

## Development

### Adding New Features

1. **Database Changes**: Update `src/db/schema.sql` and re-run seed script
2. **API Routes**: Add new route files in `src/routes/`
3. **Business Logic**: Add service files in `src/services/`
4. **Frontend**: Add HTML/CSS/JS in `public/`

### Code Structure Guidelines

- **Services**: Business logic and data access
- **Routes**: HTTP request/response handling
- **Middleware**: Cross-cutting concerns (auth, logging)
- **Models**: Types and validation schemas
- **Utils**: Shared utilities and error classes

## Troubleshooting

### Database Issues

If you encounter database errors:

```bash
# Delete the database and reseed
rm kudos.db
bun run seed
```

### Port Already in Use

Change the `PORT` in `.env` to an available port (e.g., `3001`, `3002`).

### Authentication Issues

- Ensure `JWT_SECRET` is set in `.env`
- Clear browser cookies if login fails after changing secret
- Check that cookies are enabled in your browser

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET` (at least 32 random characters)
3. Consider using a reverse proxy (nginx, Caddy) for HTTPS
4. Set appropriate file permissions for `.env` and database file
5. Run with `bun run start` (not dev mode)

## Limitations & Design Decisions

- **Single Server**: No horizontal scaling (SQLite is single-file)
- **No File Uploads**: Text-based feedback only
- **No Email Notifications**: Fully offline by design
- **Session Storage**: JWT tokens expire after 24 hours
- **No CDN Dependencies**: All assets served locally

## License

Copyright 2026 SonarSource Sàrl.

Licensed under the [GNU Lesser General Public License, Version 3.0](https://spdx.org/licenses/LGPL-3.0-only.html)

## Support

For issues or questions, contact your internal development team.
