# EcoBudget Test Credentials

## Admin Account
- **Email**: admin@ecobudget.com
- **Password**: admin123
- **Role**: admin

## Auth Endpoints
- POST /api/auth/register - Create new user
- POST /api/auth/login - Login with email/password
- POST /api/auth/logout - Logout (clears cookies)
- GET /api/auth/me - Get current user
- POST /api/auth/refresh - Refresh access token
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password with token

## Notes
- JWT tokens stored as httpOnly cookies (access_token: 15min, refresh_token: 7days)
- New users get 8 default categories seeded automatically
- Brute force protection: 5 failed attempts = 15 min lockout
- All data is user-scoped (expenses, categories, budgets)
