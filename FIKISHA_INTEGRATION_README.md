# Fikisha Integration Setup

This document explains how to set up the integration between your ecommerce website and the Fikisha delivery website.

## Overview

The integration allows:
- Orders from your ecommerce website to automatically appear as delivery tasks on Fikisha
- Delivery drivers to see vendor and customer location details (county, constituency, ward)
- Direct WhatsApp contact buttons for vendors and customers
- Real-time status updates between both systems

## Setup Instructions

### 1. Ecommerce Website (ISA-WEB05)

1. **Environment Variables**: Create a `.env.local` file in your ecommerce project root:
```env
REACT_APP_FIKISHA_API_URL=http://localhost:3001/api
REACT_APP_FIKISHA_API_KEY=your-api-key
REACT_APP_FIKISHA_ENABLED=true
```

2. **Install Dependencies**: The integration service is already included.

3. **Test Integration**: When a customer places an order with delivery, it will automatically be sent to Fikisha.

### 2. Fikisha Delivery Website

1. **Install Dependencies**:
```bash
cd "C:\Users\Milton\Desktop\delivery website\fikisha-parcels-delivered"
npm install
```

2. **Start the API Server**:
```bash
npm run server
```

3. **Start the Frontend** (in a new terminal):
```bash
npm run dev
```

4. **Full Development Mode** (both frontend and API):
```bash
npm run dev:full
```

### 3. Database Setup

The integration uses the existing Supabase databases. No additional setup is required.

## How It Works

### Order Flow

1. **Customer places order** on ecommerce website
2. **Delivery order created** with pickup/delivery locations
3. **Automatically sent to Fikisha** via API
4. **Appears in driver dashboard** with all details
5. **Driver accepts task** and can contact vendor/customer via WhatsApp
6. **Status updates** sync between both systems

### Data Transferred

For each delivery task, the following data is sent to Fikisha:

- **Basic Info**: Tracking code, receiver name, phone, addresses, coordinates
- **Location Details**: 
  - Vendor: county, constituency, ward
  - Customer: county, constituency, ward
- **Contact Info**: WhatsApp numbers for vendor and customer
- **Delivery Details**: Distance, fee, package description

### Driver Experience

Drivers on Fikisha will see:
- **Available Tasks**: Orders from your ecommerce site
- **Location Details**: Full address with county/constituency/ward
- **WhatsApp Buttons**: Direct contact with vendor and customer
- **Delivery Cost**: As calculated by your ecommerce site

## API Endpoints

### Fikisha API (Port 3001)

- `POST /api/delivery-tasks` - Create new delivery task
- `GET /api/delivery-tasks` - Get available tasks
- `POST /api/accept-task` - Accept a task
- `POST /api/update-task-status` - Update task status
- `GET /api/delivery-tasks/:id` - Get task by ID
- `GET /api/driver-tasks/:driverId` - Get driver's tasks

## Testing

1. **Start both applications**:
   - Ecommerce: `npm run dev` (port 5173)
   - Fikisha: `npm run dev:full` (frontend on 5174, API on 3001)

2. **Place a test order** on your ecommerce website

3. **Check Fikisha dashboard** - the order should appear as an available task

4. **Test driver flow**:
   - Accept the task
   - Check WhatsApp contact buttons work
   - Update delivery status

## Troubleshooting

### Common Issues

1. **Orders not appearing on Fikisha**:
   - Check API server is running (port 3001)
   - Check environment variables
   - Check browser console for errors

2. **WhatsApp buttons not working**:
   - Ensure phone numbers are in correct format
   - Check if numbers include country code

3. **Location details missing**:
   - Ensure vendor and customer profiles have location data
   - Check if county/constituency/ward are filled

### Debug Mode

Enable debug logging by setting:
```env
REACT_APP_FIKISHA_DEBUG=true
```

## Production Deployment

### Ecommerce Website
- Set production Fikisha API URL in environment variables
- Ensure API key is secure

### Fikisha Website
- Deploy API server (Vercel, Railway, etc.)
- Update ecommerce website with production API URL
- Set up proper CORS for production domains

## Security Notes

- API keys should be kept secure
- CORS is configured for development
- Production should have proper authentication
- WhatsApp numbers are validated before creating links

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all services are running
3. Check environment variables
4. Ensure database connections are working


