# Website Notification Control Guide

This guide explains how to control notifications and their content in your ISA website admin dashboard.

## 🎯 **How to Access the Notification Control Panel**

1. **Login to your website admin dashboard**
2. **Navigate to the "Notifications" section** in the sidebar
3. **You'll see three tabs:**
   - **Compose Notification**: Create and send custom notifications
   - **Templates**: Use pre-built notification templates
   - **Scheduled**: View and manage scheduled notifications

## 🎛️ **Admin Control Panel Features**

### **1. Compose Notification Tab**

#### **Basic Notification Settings**
- **Title**: Enter the notification title (appears in bold)
- **Body**: Enter the notification message content
- **Category**: Choose from Marketing, Order, Payment, Chat, or System

#### **Advanced Settings**
- **Priority**: Low, Normal, High, or Urgent
- **Require Interaction**: Force users to interact with the notification
- **Silent**: Send notification without sound/vibration

#### **Target Users**
- **User Type**: All Users, Customers Only, Vendors Only, or Admins Only
- **Last Active**: Target users active in the last 1, 7, 30, or 90 days
- **Specific User IDs**: Enter comma-separated user IDs for precise targeting

#### **Scheduling**
- **Schedule Switch**: Toggle to enable scheduling
- **Scheduled Time**: Choose date and time for future delivery

### **2. Templates Tab**

#### **Pre-built Templates**
- **Welcome Message**: For new users
- **Flash Sale Alert**: For promotional campaigns
- **Order Shipped**: For order updates
- **Payment Success**: For payment confirmations
- **New Message**: For chat notifications
- **System Maintenance**: For system announcements

#### **How to Use Templates**
1. Click on any template card
2. The title and body will be automatically filled
3. Customize as needed
4. Set target users and send

### **3. Scheduled Tab**
- View all scheduled notifications
- Currently shows placeholder (will be implemented in future updates)

## 📱 **Notification Content Examples**

### **Marketing Notifications**
```typescript
// Flash Sale
{
  title: "Flash Sale! ⚡",
  body: "Limited time offer! Get up to 70% off on selected items. Don't miss out!",
  category: "marketing"
}

// Welcome Message
{
  title: "Welcome to ISA! 🎉",
  body: "Thank you for joining our community. Start exploring amazing products!",
  category: "marketing"
}
```

### **Order Notifications**
```typescript
// Order Update
{
  title: "Order Update 📦",
  body: "Your order #12345 has been shipped and is on its way!",
  category: "order"
}

// Order Shipped
{
  title: "Your Order is on the Way! 📦",
  body: "Great news! Your order has been shipped and is on its way to you.",
  category: "order"
}
```

### **Payment Notifications**
```typescript
// Payment Success
{
  title: "Payment Successful! 💰",
  body: "Your M-Pesa payment of 5,000 KES was successful.",
  category: "payment"
}
```

### **System Notifications**
```typescript
// Maintenance
{
  title: "Scheduled Maintenance 🔧",
  body: "We'll be performing scheduled maintenance. Some features may be temporarily unavailable.",
  category: "system"
}
```

## 🎨 **Best Practices for Notification Content**

### **Title Guidelines**
- Keep under 50 characters
- Use clear, actionable language
- Include relevant emojis for visual appeal
- Make it compelling but not clickbait

### **Body Guidelines**
- Provide clear, concise information
- Include call-to-action when appropriate
- Use friendly, conversational tone
- Keep under 200 characters for best results

### **Category Selection**
- **Marketing**: Promotional content, sales, announcements
- **Order**: Order status updates, shipping notifications
- **Payment**: Payment confirmations, wallet updates
- **Chat**: New messages, chat notifications
- **System**: Maintenance, updates, system announcements

## 🎯 **Targeting Strategies**

### **User Type Targeting**
- **All Users**: Broadcast to everyone
- **Customers Only**: Target end consumers
- **Vendors Only**: Target business partners
- **Admins Only**: Target administrative users

### **Activity-Based Targeting**
- **Last 24 hours**: Most active users
- **Last 7 days**: Recently active users
- **Last 30 days**: Moderately active users
- **Last 90 days**: Less active users

### **Specific User Targeting**
- Enter user IDs separated by commas
- Useful for testing or targeting specific individuals
- Example: `user1,user2,user3`

## ⚙️ **Advanced Features**

### **Priority Levels**
- **Low**: Background notifications, non-urgent updates
- **Normal**: Standard notifications
- **High**: Important updates requiring attention
- **Urgent**: Critical notifications requiring immediate action

### **Interaction Requirements**
- **Require Interaction**: Users must tap to dismiss
- **Silent**: No sound or vibration
- **Standard**: Normal notification behavior

### **Scheduling**
- Schedule notifications for optimal delivery times
- Avoid sending during off-hours
- Consider time zones for global audiences

## 📊 **Notification Analytics**

### **What to Track**
- **Delivery Rate**: Percentage of successful deliveries
- **Open Rate**: Percentage of notifications opened
- **Click Rate**: Percentage of notifications clicked
- **Engagement**: User interaction with notifications

### **Optimization Tips**
- Test different titles and content
- Monitor user engagement patterns
- Adjust sending times based on user activity
- Use A/B testing for different message versions

## 🔒 **Security & Privacy**

### **Data Protection**
- User tokens are encrypted and stored securely
- Notifications are sent through secure Supabase Edge Functions
- Row Level Security (RLS) protects user data
- Admin access is restricted to authorized users only

### **User Privacy**
- Respect user notification preferences
- Allow users to opt-out of marketing notifications
- Provide clear unsubscribe options
- Follow data protection regulations

## 🚀 **Quick Start Guide**

### **Step 1: Send Your First Notification**
1. Go to Admin Dashboard → Notifications
2. Click "Compose Notification" tab
3. Fill in title and body
4. Select category
5. Choose target users
6. Click "Send Now"

### **Step 2: Use Templates**
1. Click "Templates" tab
2. Select a template
3. Customize content if needed
4. Set target users
5. Send notification

### **Step 3: Schedule Notifications**
1. Compose your notification
2. Toggle "Schedule" switch
3. Set scheduled time
4. Click "Schedule Notification"

## 📞 **Support & Troubleshooting**

### **Common Issues**
1. **Notifications not sending**: Check Supabase Edge Function logs
2. **Users not receiving**: Verify user tokens are active
3. **Permission errors**: Ensure admin access rights
4. **Template issues**: Refresh page and try again

### **Getting Help**
1. Check the Supabase dashboard for function logs
2. Verify environment variables are set correctly
3. Ensure the `notification_tokens` table exists
4. Test with a single user before bulk sending

## 🔄 **Integration with Mobile App**

The website notification system works seamlessly with your mobile app:
- Same Supabase backend
- Shared notification tokens
- Consistent user experience
- Cross-platform delivery

## 📈 **Future Enhancements**

### **Planned Features**
- **A/B Testing**: Test different notification versions
- **Advanced Analytics**: Detailed engagement metrics
- **Automated Campaigns**: Trigger-based notifications
- **Rich Media**: Images and videos in notifications
- **Action Buttons**: Interactive notification buttons
- **Geographic Targeting**: Location-based notifications

### **Custom Integrations**
- **CRM Integration**: Customer relationship management
- **Analytics Platforms**: Google Analytics, Mixpanel
- **Marketing Tools**: Email marketing integration
- **Customer Support**: Help desk integration

---

**Note**: This notification system is designed to work with your existing Supabase backend and shares the same infrastructure as your mobile app for consistency and reliability.
