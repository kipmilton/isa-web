# ISA Delivery System

This document outlines the implementation of the ISA delivery system, which enables real-time location tracking and delivery management for the ISA shopping platform.

## Overview

The delivery system consists of three main user types:
1. **Customers** - Can track their deliveries in real-time
2. **Vendors** - Can set pickup locations for their products
3. **Delivery Personnel** - Can accept and manage delivery tasks
4. **Admins** - Can manage delivery personnel and monitor the system

## Features

### For Customers
- Real-time delivery tracking with estimated arrival times
- Live location updates during delivery
- Ability to call delivery personnel directly
- View delivery history and status updates
- Choose between pickup and delivery options

### For Vendors
- Set pickup locations for products using Mapbox integration
- Automatic delivery fee calculation based on distance
- Track delivery status of their orders

### For Delivery Personnel
- View available delivery tasks in their area
- Accept delivery assignments
- Update delivery status (picked up, in transit, delivered)
- Real-time location sharing
- Online/offline status management

### For Admins
- Approve/reject delivery personnel applications
- Monitor delivery performance
- Manage delivery personnel accounts

## Database Schema

### New Tables

#### `delivery_personnel`
- Stores delivery personnel profiles and status
- Fields: user_id, email, first_name, last_name, phone_number, county, constituency, id_card_url, drivers_license_url, current_location_lat, current_location_lng, is_online, is_available, status

#### `delivery_orders`
- Tracks delivery assignments and status
- Fields: order_id, delivery_personnel_id, pickup_location_lat, pickup_location_lng, pickup_location_address, delivery_location_lat, delivery_location_lng, delivery_location_address, distance_km, delivery_fee, status, current_location_lat, current_location_lng, tracking_updates

#### `delivery_tracking`
- Stores real-time location updates
- Fields: delivery_order_id, delivery_personnel_id, latitude, longitude, accuracy, speed, heading, timestamp

### Modified Tables

#### `products`
- Added location fields: location_lat, location_lng, location_address

#### `orders`
- Added delivery fields: delivery_type, delivery_location_lat, delivery_location_lng, delivery_location_address, delivery_fee

## Components

### Authentication & Signup
- `DeliverySignupDialog.tsx` - Delivery personnel registration form
- Updated `AuthDialog.tsx` to support delivery user type

### Delivery Management
- `DeliveryDashboard.tsx` - Main delivery personnel interface
- `DeliveryDashboard.tsx` (page) - Wrapper with authentication

### Customer Interface
- `Shipping.tsx` - Customer delivery tracking page
- Updated `ShopDashboard.tsx` with shipping icon

### Location Services
- `LocationPicker.tsx` - Mapbox-based location selection component

### Services
- `deliveryService.ts` - Core delivery business logic

## Setup Instructions

### 1. Database Migration
Run the migration file to create the delivery system tables:
```sql
-- Run the migration file: supabase/migrations/20250727000000-add-delivery-system.sql
```

### 2. Mapbox Configuration
1. Sign up for a Mapbox account at https://www.mapbox.com/
2. Get your access token
3. Update the access token in `LocationPicker.tsx`:
```typescript
mapboxgl.accessToken = 'your-mapbox-access-token';
```

### 3. Environment Variables
Add the following to your environment variables:
```env
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
```

### 4. Dependencies
The following packages are required:
```bash
npm install mapbox-gl @types/mapbox-gl react-map-gl
```

## Usage

### For Delivery Personnel

1. **Registration**: Click "Join ISA Delivery" on the homepage
2. **Application**: Fill out the form with personal details, location, and upload required documents
3. **Approval**: Wait for admin approval
4. **Dashboard**: Access delivery dashboard at `/delivery-dashboard`
5. **Accept Deliveries**: Go online and accept available delivery tasks
6. **Update Status**: Mark orders as picked up, in transit, and delivered

### For Customers

1. **Shopping**: Browse products and add to cart
2. **Checkout**: Choose delivery option and set delivery location
3. **Tracking**: Click the shipping icon in the navigation to track orders
4. **Real-time Updates**: View live location and estimated arrival time

### For Vendors

1. **Product Upload**: Add location information when uploading products
2. **Location Pinning**: Use the map interface to set pickup locations
3. **Delivery Tracking**: Monitor delivery status of customer orders

## Delivery Fee Calculation

The delivery fee is calculated using the following formula:
- **Base Rate**: 40 KES per kilometer
- **Minimum Fee**: 100 KES
- **Formula**: `Math.max(distance_km * 40, 100)`

## Location Tracking

### Real-time Updates
- Delivery personnel location is updated every 30 seconds when online
- Customers can view live location during delivery
- Estimated arrival time is calculated based on current location and speed

### Privacy & Security
- Location data is only shared during active deliveries
- Delivery personnel can go offline to stop location sharing
- Location history is automatically cleaned up after delivery completion

## API Endpoints

### Delivery Orders
- `GET /delivery_orders` - Get customer's delivery orders
- `POST /delivery_orders` - Create new delivery order
- `PUT /delivery_orders/:id` - Update delivery status
- `GET /delivery_orders/available` - Get available delivery orders

### Delivery Personnel
- `GET /delivery_personnel/profile` - Get delivery personnel profile
- `PUT /delivery_personnel/location` - Update current location
- `PUT /delivery_personnel/status` - Update online status

### Tracking
- `POST /delivery_tracking` - Add tracking update
- `GET /delivery_tracking/:orderId` - Get tracking history

## Security Considerations

### Row Level Security (RLS)
- Delivery personnel can only view their own profile and assigned orders
- Customers can only view their own delivery orders
- Admins have full access to all delivery data

### Data Protection
- Location data is encrypted in transit
- Personal information is protected by RLS policies
- Document uploads are stored securely in Supabase storage

## Monitoring & Analytics

### Key Metrics
- Delivery completion rate
- Average delivery time
- Customer satisfaction scores
- Delivery personnel performance

### Admin Dashboard
- Pending delivery personnel applications
- Active delivery orders
- System performance metrics
- Delivery personnel management

## Troubleshooting

### Common Issues

1. **Map not loading**: Check Mapbox access token configuration
2. **Location not updating**: Ensure delivery personnel is online
3. **Delivery fee calculation**: Verify distance calculation is working
4. **Real-time updates**: Check WebSocket connection status

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG_MODE = true;
```

## Future Enhancements

### Planned Features
- Push notifications for delivery updates
- Route optimization for delivery personnel
- Customer feedback and rating system
- Integration with external delivery services
- Advanced analytics and reporting

### Performance Optimizations
- Caching for frequently accessed data
- Optimized location update frequency
- Background location tracking
- Offline mode support

## Support

For technical support or questions about the delivery system:
- Email: isashoppingai@gmail.com
- Documentation: [Link to full documentation]
- GitHub Issues: [Link to repository issues]

## License

This delivery system is part of the ISA shopping platform and is subject to the same licensing terms. 