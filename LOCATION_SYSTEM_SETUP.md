# Location System Setup Guide

This guide will help you set up the new location system for ISA, which includes beautiful Mapbox integration for both customers and vendors.

## 🗺️ Features

### For Customers:
- **Two delivery options**: Pickup from vendor or home delivery
- **Current location detection**: Use GPS to automatically set delivery location
- **Map-based location selection**: Click on map or search for addresses
- **Real-time delivery tracking**: See your order's location and estimated arrival time

### For Vendors:
- **Product location pinning**: Set exact pickup locations for products
- **Map-based location selection**: Easy location selection with search
- **Location validation**: Ensure accurate pickup points for delivery personnel

### For Delivery Personnel:
- **Route optimization**: See pickup and delivery locations on map
- **Real-time tracking**: Update delivery status and location
- **Distance calculation**: Automatic delivery fee calculation

## 🚀 Setup Instructions

### 1. Get Mapbox Access Token

1. Go to [Mapbox](https://account.mapbox.com/access-tokens/)
2. Sign up for a free account (50,000 map loads per month)
3. Create a new access token
4. Copy the token

### 2. Configure Environment Variables

Create or update your `.env` file in the `isa-web` directory:

```env
# Add this line to your .env file
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

### 3. Run Database Migration

Make sure you've run the delivery system migration in your Supabase database:

```sql
-- Run the migration file: isa-web/supabase/migrations/20250727000000-add-delivery-system.sql
-- This adds location fields to products and orders tables
```

### 4. Install Dependencies

The required dependencies are already installed:
- `mapbox-gl`: Mapbox GL JS library
- `@types/mapbox-gl`: TypeScript types

## 🎯 How to Use

### For Customers (Checkout Process):

1. **Select Delivery Type**:
   - Choose between "Pickup" or "Home Delivery"
   - Pickup: Collect from vendor location
   - Home Delivery: Delivered to your location

2. **Set Delivery Location** (if choosing home delivery):
   - Click "Use Current Location" to automatically detect your position
   - Or click on the map to manually select a location
   - Or search for an address in the search tab

3. **Complete Checkout**:
   - Delivery fee is automatically calculated based on distance
   - Order is created with location data for tracking

### For Vendors (Product Management):

1. **Add Product Location**:
   - In the product form, use the "Pickup Location" section
   - Click on the location card to open the map
   - Set the exact location where customers can pick up the product
   - Or where delivery personnel should collect the item

2. **Location Features**:
   - Search for addresses
   - Click on map to set precise coordinates
   - Location is saved with latitude/longitude for accurate delivery

### For Delivery Personnel:

1. **View Orders**:
   - See pickup and delivery locations on map
   - Distance and delivery fee are pre-calculated
   - Accept orders based on proximity

2. **Update Status**:
   - Mark orders as picked up, in transit, delivered
   - Update current location for customer tracking

## 🔧 Configuration

### Mapbox Settings

You can customize Mapbox settings in `src/config/mapbox.ts`:

```typescript
export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
  style: 'mapbox://styles/mapbox/streets-v12', // Map style
  defaultCenter: [36.8219, -1.2921], // Default center (Nairobi)
  defaultZoom: 10, // Default zoom level
};
```

### Available Map Styles

- `mapbox://styles/mapbox/streets-v12` - Street view (default)
- `mapbox://styles/mapbox/satellite-v9` - Satellite view
- `mapbox://styles/mapbox/light-v11` - Light theme
- `mapbox://styles/mapbox/dark-v11` - Dark theme

## 🐛 Troubleshooting

### Map Not Loading

1. **Check Access Token**:
   - Ensure `VITE_MAPBOX_ACCESS_TOKEN` is set in `.env`
   - Verify the token is valid in Mapbox dashboard

2. **Check Console Errors**:
   - Look for Mapbox-related errors in browser console
   - Ensure no CORS issues

### Location Not Working

1. **GPS Permissions**:
   - Ensure browser has location permissions
   - Check if HTTPS is enabled (required for GPS)

2. **Search Not Working**:
   - Verify Mapbox access token has geocoding permissions
   - Check network connectivity

### Delivery Fee Calculation

1. **Distance Issues**:
   - Ensure product has location data
   - Check if delivery location is set
   - Verify distance calculation service is working

## 📱 Mobile Support

The location system is fully responsive and works on:
- Mobile browsers (iOS Safari, Chrome Mobile)
- GPS location detection
- Touch-friendly map interactions
- Responsive design for all screen sizes

## 🔒 Security & Privacy

- Location data is stored securely in Supabase
- GPS permissions are requested only when needed
- No location data is shared with third parties
- Users can manually enter locations without GPS

## 📊 Usage Limits

- **Free Mapbox Plan**: 50,000 map loads per month
- **Geocoding**: 100,000 requests per month
- **Directions**: 5,000 requests per month

For higher usage, consider upgrading to a paid Mapbox plan.

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your Mapbox access token
3. Ensure all dependencies are installed
4. Check that the database migration has been run

For additional help, refer to:
- [Mapbox Documentation](https://docs.mapbox.com/)
- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Supabase Documentation](https://supabase.com/docs) 