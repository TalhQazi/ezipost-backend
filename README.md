# Ezipost Backend

A comprehensive backend API for the Ezipost mail management system.

## Features

- **Audit Logs**: Track all system activities and user actions
- **Escrow Accounts**: Manage escrow account balances and transactions
- **Mail Processing**: Handle mail workflow and processing stages
- **Rate Configuration**: Configure shipping rates and pricing
- **Reports**: Generate and manage various reports
- **Transactions**: Handle financial transactions and payments
- **Settings**: System configuration management

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB

5. Run the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoints and usage.

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ezipost
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
```

## Project Structure

```
src/
├── app.js                 # Express app setup
├── controllers/           # Route controllers
│   ├── auditLogController.js
│   ├── escrowAccountController.js
│   ├── mailProcessingController.js
│   ├── rateConfigController.js
│   ├── reportController.js
│   ├── transactionController.js
│   └── settingController.js
├── models/               # Mongoose models
│   ├── AuditLog.js
│   ├── EscrowAccount.js
│   ├── MailProcessing.js
│   ├── RateConfig.js
│   ├── Report.js
│   ├── Transaction.js
│   └── Setting.js
└── routes/               # API routes
    ├── auditLog.routes.js
    ├── escrowAccount.routes.js
    ├── mailProcessing.routes.js
    ├── rateConfig.routes.js
    ├── report.routes.js
    ├── transaction.routes.js
    └── setting.routes.js
```

## Available Endpoints

- `/health` - Health check
- `/api/mail` - Mail management
- `/api/audit-logs` - Audit logs
- `/api/escrow-accounts` - Escrow accounts
- `/api/mail-processing` - Mail processing
- `/api/rate-config` - Rate configuration
- `/api/reports` - Reports
- `/api/transactions` - Transactions
- `/api/settings` - Settings

## Database Schema

The application uses MongoDB with the following main collections:

- `auditlogs` - System audit trail
- `escrowaccounts` - Escrow account management
- `mailprocessings` - Mail workflow data
- `rateconfigs` - Rate configurations
- `reports` - Report definitions
- `transactions` - Financial transactions
- `settings` - System settings
- `mails` - Mail records

## Testing

To test the API endpoints:

1. Start the server
2. Use a tool like Postman or curl to test endpoints
3. Check the health endpoint first: `http://localhost:3000/health`

Example curl command:
```bash
curl http://localhost:3000/health
```

## Development

### Adding New Endpoints

1. Create a new model in `src/models/`
2. Create controller functions in `src/controllers/`
3. Create routes in `src/routes/`
4. Register routes in `src/app.js`

### Database Connection

The app connects to MongoDB using Mongoose. Make sure your MongoDB instance is running and the connection string is correct in your `.env` file.

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure your production database
3. Set up proper security measures
4. Use a process manager like PM2

## Security Considerations

- Add authentication/authorization middleware
- Implement rate limiting
- Use HTTPS in production
- Validate all input data
- Sanitize database queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please create an issue in the repository.
