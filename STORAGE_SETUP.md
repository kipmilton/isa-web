# Storage Setup for Vendor Applications

## Overview
The vendor application system requires a storage bucket to handle document uploads. This document provides instructions for setting up the required storage configuration.

## Required Storage Bucket

### Bucket Name: `product-images`

This bucket is used for:
- Vendor application documents (ID cards, business certificates, etc.)
- Product images
- Other file uploads

## Setup Instructions

### 1. Create the Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket with these settings:
   - **Name**: `product-images`
   - **Public bucket**: ✅ Checked (enables public read access)
   - **File size limit**: 50MB (or adjust as needed)
   - **Allowed MIME types**: `image/*, application/pdf`

### 2. Run Storage Policies Migration

The storage policies are defined in the migration file:
`supabase/migrations/20250813080000-setup-storage-buckets.sql`

These policies ensure:
- Users can upload files to their own folder
- Public read access for uploaded files
- Users can update/delete their own files

### 3. Verify Setup

To verify the storage bucket is working:

1. Check that the bucket exists in your Supabase dashboard
2. Try uploading a test file through the vendor application form
3. Check the browser console for any storage-related errors

## Troubleshooting

### Common Issues

1. **"Storage bucket not found" error**
   - Ensure the `product-images` bucket exists
   - Check that the bucket name is exactly `product-images`

2. **"Access denied" errors**
   - Verify the storage policies are applied
   - Check that the user is authenticated

3. **File upload failures**
   - Check file size limits
   - Verify file type is allowed
   - Ensure proper authentication

### Manual Bucket Creation (if needed)

If the bucket doesn't exist, you can create it manually using SQL:

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);
```

## File Structure

Files are organized in the bucket as follows:
```
product-images/
├── vendor-documents/
│   └── {user-id}/
│       ├── id-card.{ext}
│       ├── business-cert.{ext}
│       └── pin-cert.{ext}
└── products/
    └── {product-id}/
        └── {image-files}
```

## Security Notes

- Users can only upload to their own folder (`vendor-documents/{user-id}/`)
- Public read access is enabled for product images
- File uploads are validated for type and size
- Authentication is required for uploads

## Fallback Behavior

If storage uploads fail, the vendor application will:
1. Continue with the application submission
2. Show a warning about failed uploads
3. Allow users to upload documents later
4. Store application data without document URLs
