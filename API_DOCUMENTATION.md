# Ezipost Backend API Documentation

## Overview
This document provides comprehensive API endpoints for the Ezipost backend system. All endpoints follow RESTful conventions and return JSON responses.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, no authentication is implemented. Add JWT or other authentication as needed.

## Common Response Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

## Error Response Format
```json
{
  "message": "Error description",
  "errors": [...]
}
```

---

## 1. Audit Logs (`/api/audit-logs`)

### Get All Audit Logs
```
GET /api/audit-logs
```
**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `search` (string): Search by action, resource, or details
- `action` (string): Filter by action type
- `severity` (string): Filter by severity (low, medium, high, critical)
- `status` (string): Filter by status (success, failure, warning)
- `userId` (string): Filter by user ID
- `startDate` (date): Filter by start date
- `endDate` (date): Filter by end date

### Get Audit Log Statistics
```
GET /api/audit-logs/stats
```

### Create Audit Log
```
POST /api/audit-logs
```
**Body:**
```json
{
  "userId": "user123",
  "action": "CREATE",
  "resource": "Mail",
  "resourceId": "mail123",
  "details": {},
  "severity": "medium",
  "status": "success"
}
```

### Get Audit Log by ID
```
GET /api/audit-logs/:id
```

### Delete Audit Log
```
DELETE /api/audit-logs/:id
```

---

## 2. Escrow Accounts (`/api/escrow-accounts`)

### Get All Escrow Accounts
```
GET /api/escrow-accounts
```
**Query Parameters:**
- `page`, `limit`, `search`
- `status` (string): Filter by status (active, inactive, suspended, frozen)
- `accountType` (string): Filter by account type (checking, savings, business)
- `bankName` (string): Filter by bank name
- `currency` (string): Filter by currency
- `minBalance`, `maxBalance` (number): Filter by balance range

### Get Escrow Account Statistics
```
GET /api/escrow-accounts/stats
```

### Create Escrow Account
```
POST /api/escrow-accounts
```
**Body:**
```json
{
  "accountNumber": "ACC123456",
  "accountName": "Main Escrow Account",
  "bankName": "First Bank",
  "accountType": "business",
  "balance": 10000.00,
  "currency": "USD",
  "createdBy": "admin"
}
```

### Get Escrow Account by ID
```
GET /api/escrow-accounts/:id
```

### Update Escrow Account
```
PUT /api/escrow-accounts/:id
```

### Update Escrow Balance
```
PATCH /api/escrow-accounts/:id/balance
```
**Body:**
```json
{
  "amount": 500.00,
  "transactionType": "credit",
  "description": "Deposit",
  "lastModifiedBy": "admin"
}
```

### Delete Escrow Account
```
DELETE /api/escrow-accounts/:id
```

---

## 3. Mail Processing (`/api/mail-processing`)

### Get All Mail Processing Records
```
GET /api/mail-processing
```
**Query Parameters:**
- `page`, `limit`, `search`
- `processingStage` (string): Filter by stage (received, verified, processed, completed, failed)
- `priority` (string): Filter by priority (low, medium, high, urgent)
- `assignedTo` (string): Filter by assigned user
- `hasIssues` (boolean): Filter records with/without issues
- `startDate`, `endDate` (date): Date range filter

### Get Mail Processing Statistics
```
GET /api/mail-processing/stats
```

### Create Mail Processing Record
```
POST /api/mail-processing
```
**Body:**
```json
{
  "mailId": "mail123",
  "trackingNumber": "TN123456789",
  "processingStage": "received",
  "priority": "medium",
  "createdBy": "admin"
}
```

### Get Mail Processing Record by ID
```
GET /api/mail-processing/:id
```

### Update Mail Processing Record
```
PUT /api/mail-processing/:id
```

### Update Processing Step
```
PATCH /api/mail-processing/:id/step
```
**Body:**
```json
{
  "stepIndex": 0,
  "status": "completed",
  "notes": "Step completed successfully",
  "completedBy": "admin"
}
```

### Add Issue
```
PATCH /api/mail-processing/:id/issue
```
**Body:**
```json
{
  "type": "missing_info",
  "description": "Missing recipient address",
  "severity": "high",
  "reportedBy": "admin"
}
```

### Resolve Issue
```
PATCH /api/mail-processing/:id/issue/resolve
```
**Body:**
```json
{
  "issueIndex": 0,
  "resolution": "Address information updated",
  "resolvedBy": "admin"
}
```

### Upload Document
```
PATCH /api/mail-processing/:id/document
```
**Body:**
```json
{
  "documentType": "invoice",
  "fileName": "invoice.pdf",
  "fileUrl": "/uploads/invoice.pdf",
  "uploadedBy": "admin"
}
```

---

## 4. Rate Configuration (`/api/rate-config`)

### Get All Rate Configurations
```
GET /api/rate-config
```
**Query Parameters:**
- `page`, `limit`, `search`
- `rateType` (string): Filter by rate type (domestic, international, express, standard, bulk)
- `serviceName` (string): Filter by service name
- `status` (string): Filter by status (active, inactive, draft, expired)
- `currency` (string): Filter by currency
- `effectiveDate`, `expiryDate` (date): Date filters

### Calculate Shipping Rate
```
GET /api/rate-config/calculate
```
**Query Parameters:**
- `rateType` (string): Required
- `weight` (number): Required
- `zone` (string): Optional
- `serviceType` (string): Optional
- `additionalServices` (array): Optional
- `volume` (number): Optional

### Get Rate Configuration Statistics
```
GET /api/rate-config/stats
```

### Create Rate Configuration
```
POST /api/rate-config
```
**Body:**
```json
{
  "rateType": "domestic",
  "serviceName": "Standard Shipping",
  "baseRate": 5.99,
  "currency": "USD",
  "weightRanges": [
    {
      "minWeight": 0,
      "maxWeight": 1,
      "ratePerUnit": 2.50
    }
  ],
  "zoneRates": [
    {
      "zone": "Zone 1",
      "rate": 3.00,
      "deliveryTime": "2-3 days"
    }
  ],
  "createdBy": "admin"
}
```

### Clone Rate Configuration
```
POST /api/rate-config/:id/clone
```
**Body:**
```json
{
  "serviceName": "Cloned Service",
  "createdBy": "admin"
}
```

---

## 5. Reports (`/api/reports`)

### Get All Reports
```
GET /api/reports
```
**Query Parameters:**
- `page`, `limit`, `search`
- `reportType` (string): Filter by type (financial, operational, audit, performance, custom)
- `status` (string): Filter by status (active, inactive, draft)
- `dataSource` (string): Filter by data source
- `createdBy` (string): Filter by creator

### Get Report Templates
```
GET /api/reports/templates
```

### Get Report Statistics
```
GET /api/reports/stats
```

### Create Report
```
POST /api/reports
```
**Body:**
```json
{
  "reportName": "Daily Mail Summary",
  "reportType": "operational",
  "dataSource": "mail",
  "parameters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "groupBy": ["status"]
  },
  "format": "json",
  "createdBy": "admin"
}
```

### Execute Report
```
POST /api/reports/:id/execute
```

---

## 6. Transactions (`/api/transactions`)

### Get All Transactions
```
GET /api/transactions
```
**Query Parameters:**
- `page`, `limit`, `search`
- `transactionType` (string): Filter by type (payment, refund, escrow_deposit, escrow_withdrawal, fee, penalty, adjustment)
- `status` (string): Filter by status (pending, processing, completed, failed, cancelled, refunded)
- `paymentMethod` (string): Filter by payment method
- `currency` (string): Filter by currency
- `minAmount`, `maxAmount` (number): Filter by amount range
- `startDate`, `endDate` (date): Date range filter
- `assignedTo` (string): Filter by assigned user
- `priority` (string): Filter by priority
- `hasEscrow` (boolean): Filter escrow transactions

### Get Transaction Statistics
```
GET /api/transactions/stats
```

### Create Transaction
```
POST /api/transactions
```
**Body:**
```json
{
  "mailId": "mail123",
  "trackingNumber": "TN123456789",
  "transactionType": "payment",
  "amount": 25.99,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "createdBy": "admin"
}
```

### Update Transaction Status
```
PATCH /api/transactions/:id/status
```
**Body:**
```json
{
  "status": "completed",
  "notes": "Payment processed successfully",
  "updatedBy": "admin"
}
```

### Process Refund
```
PATCH /api/transactions/:id/refund
```
**Body:**
```json
{
  "refundAmount": 25.99,
  "refundReason": "Customer request",
  "refundMethod": "credit_card",
  "processedBy": "admin"
}
```

### Add Fee
```
PATCH /api/transactions/:id/fee
```
**Body:**
```json
{
  "feeType": "processing",
  "feeAmount": 2.50,
  "feeDescription": "Processing fee",
  "addedBy": "admin"
}
```

### Bulk Update Transactions
```
PATCH /api/transactions/bulk
```
**Body:**
```json
{
  "transactionIds": ["id1", "id2", "id3"],
  "updates": {
    "status": "completed",
    "assignedTo": "admin"
  },
  "updatedBy": "admin"
}
```

---

## 7. Settings (`/api/settings`)

### Get All Settings
```
GET /api/settings
```
**Query Parameters:**
- `category` (string): Filter by category (general, security, notifications, integrations, billing, system, ui)
- `isPublic` (boolean): Filter by public status
- `isEditable` (boolean): Filter by editable status
- `search` (string): Search by key, display name, or description

### Get Setting Categories
```
GET /api/settings/categories
```

### Get Setting by Key
```
GET /api/settings/:category/:key
```

### Create/Update Setting
```
POST /api/settings/:category/:key
```
**Body:**
```json
{
  "value": "new_value",
  "lastModifiedBy": "admin"
}
```

### Update Setting
```
PUT /api/settings/:category/:key
```

### Bulk Update Settings
```
POST /api/settings/bulk
```
**Body:**
```json
{
  "settings": [
    {
      "category": "general",
      "key": "company_name",
      "value": "Ezipost Inc."
    }
  ],
  "lastModifiedBy": "admin"
}
```

### Export Settings
```
GET /api/settings/export
```
**Query Parameters:**
- `category` (string): Filter by category
- `includePrivate` (boolean): Include private settings

### Import Settings
```
POST /api/settings/import
```
**Body:**
```json
{
  "settings": {
    "general": {
      "company_name": {
        "value": "Ezipost Inc.",
        "dataType": "string"
      }
    }
  },
  "importBy": "admin",
  "overwrite": false
}
```

### Reset Settings
```
POST /api/settings/reset
```
**Body:**
```json
{
  "category": "general",
  "keys": ["company_name"],
  "resetBy": "admin"
}
```

---

## 8. Mail (Existing) (`/api/mail`)

### Get All Mails
```
GET /api/mail
```
**Query Parameters:**
- `search` (string): Search by ID or tracking number
- `status` (string): Filter by status

### Create Mail
```
POST /api/mail
```

### Delete Mail
```
DELETE /api/mail/:id
```

---

## Testing the API

You can test the API using tools like Postman, curl, or directly from your frontend application.

### Example curl command:
```bash
curl -X GET "http://localhost:3000/api/audit-logs?page=1&limit=10"
```

### Example JavaScript fetch:
```javascript
fetch('http://localhost:3000/api/audit-logs?page=1&limit=10')
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## Database Schema

The backend uses MongoDB with the following main collections:
- `auditlogs` - Audit trail entries
- `escrowaccounts` - Escrow account information
- `mailprocessings` - Mail workflow records
- `rateconfigs` - Rate configurations
- `reports` - Report definitions
- `transactions` - Financial transactions
- `settings` - System configuration
- `mails` - Mail records (existing)

---

## Next Steps

1. **Add Authentication**: Implement JWT or OAuth for API security
2. **Add Validation**: Enhance input validation with libraries like Joi
3. **Add Logging**: Implement comprehensive logging with Winston
4. **Add Tests**: Create unit and integration tests
5. **Add Caching**: Implement Redis caching for frequently accessed data
6. **Add Rate Limiting**: Implement API rate limiting
7. **Add Documentation**: Generate OpenAPI/Swagger documentation

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error responses include detailed error messages for debugging.
