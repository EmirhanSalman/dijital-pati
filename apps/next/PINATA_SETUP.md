# Pinata IPFS Setup Guide

This guide explains how to configure Pinata for IPFS uploads in the application.

## Overview

The application now supports uploading pet images to IPFS via Pinata. If Pinata is not configured, it will automatically fall back to Supabase Storage.

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Option 1: JWT Authentication (Recommended)

```bash
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
```

### Option 2: API Key Authentication (Legacy)

```bash
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
```

### Optional: Custom Gateway URL

```bash
NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
# Or use a custom IPFS gateway:
# NEXT_PUBLIC_GATEWAY_URL=https://ipfs.io/ipfs
```

## Getting Pinata Credentials

### Step 1: Create a Pinata Account

1. Go to [Pinata.cloud](https://pinata.cloud)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your JWT Token (Recommended)

1. Log in to Pinata Dashboard
2. Go to **API Keys** section
3. Click **New Key**
4. Set permissions:
   - **Admin** (for full access) OR
   - **pinFileToIPFS** (for uploads only)
5. Set expiration (optional)
6. Click **Create**
7. Copy the **JWT Token** (you'll only see it once!)

### Step 3: Get API Keys (Alternative)

If you prefer API key authentication:

1. Log in to Pinata Dashboard
2. Go to **API Keys** section
3. Find your existing key or create a new one
4. Copy:
   - **API Key**
   - **Secret API Key**

## Configuration

### For Local Development

1. Create or edit `.env.local` in the `frontend/` directory:

```bash
# Pinata Configuration (choose one method)
NEXT_PUBLIC_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OR use API keys
NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key_here

# Optional: Custom gateway URL
NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
```

2. Restart your Next.js development server:

```bash
npm run dev
```

### For Production (Vercel/Other Platforms)

1. Go to your deployment platform's environment variables settings
2. Add the Pinata credentials as shown above
3. Redeploy your application

## How It Works

### Upload Flow

1. **User selects image** → Frontend creates FormData
2. **API route receives request** → `/api/pets/upload`
3. **Server action processes upload**:
   - Checks for Pinata credentials
   - If available: Uploads to Pinata IPFS
   - If not available: Falls back to Supabase Storage
4. **Response includes**:
   - `ipfsHash`: The IPFS content hash (CID)
   - `url`: Gateway URL for displaying the image
   - `hash`, `IpfsHash`: Aliases for compatibility

### Response Format

**Success (Pinata):**
```json
{
  "ipfsHash": "QmXxxx...",
  "hash": "QmXxxx...",
  "IpfsHash": "QmXxxx...",
  "url": "https://gateway.pinata.cloud/ipfs/QmXxxx...",
  "message": "Resim başarıyla IPFS'e yüklendi!"
}
```

**Success (Supabase Fallback):**
```json
{
  "url": "https://khfffcjhcgkthblebeik.supabase.co/storage/v1/object/public/pet-images/...",
  "message": "Resim başarıyla yüklendi! (Supabase Storage)"
}
```

**Error:**
```json
{
  "error": "Error message here"
}
```

## Troubleshooting

### Error: "Pinata credentials not found"

**Solution:**
- Check that environment variables are set correctly with `NEXT_PUBLIC_` prefix
- Verify variable names match exactly (case-sensitive):
  - `NEXT_PUBLIC_PINATA_JWT` (not `PINATA_JWT`)
  - `NEXT_PUBLIC_PINATA_API_KEY` (not `PINATA_API_KEY`)
  - `NEXT_PUBLIC_PINATA_SECRET_KEY` (not `PINATA_SECRET_API_KEY`)
- Restart your development server after adding variables
- For production, ensure variables are set in your deployment platform (Vercel, etc.)

### Error: "IPFS hash alınamadı"

**Possible Causes:**
1. **Pinata API returned unexpected format**
   - Check browser console for full response
   - Verify Pinata API version compatibility

2. **Authentication failed**
   - Verify JWT token or API keys are correct
   - Check if token/keys have expired
   - Ensure proper permissions are set

3. **Network issues**
   - Check internet connection
   - Verify Pinata service status
   - Check firewall/proxy settings

**Debug Steps:**
1. Open browser DevTools → Console
2. Look for detailed logs starting with 🔵, 📤, ✅, or ❌
3. Check the "Upload response" log for full API response
4. Verify environment variables are loaded:
   ```javascript
   // In browser console (client-side won't show server vars)
   // Check server logs instead
   ```

### Error: "Failed to upload to IPFS"

**Common Causes:**
- File size exceeds limit (100MB for Pinata free tier)
- Invalid file type
- Pinata API rate limit exceeded
- Network timeout

**Solutions:**
- Reduce file size
- Check file type is supported (JPEG, PNG, WebP)
- Wait a few minutes and retry
- Check Pinata dashboard for account status

## Testing

### Test Pinata Upload

1. Ensure environment variables are set
2. Start the development server
3. Navigate to `/create-pet`
4. Select an image and submit
5. Check browser console for upload logs:
   - 🔵 Starting Pinata upload...
   - 📤 Preparing request...
   - ✅ Upload successful! IPFS Hash: Qm...

### Verify IPFS Hash

1. After successful upload, copy the IPFS hash
2. Visit: `https://gateway.pinata.cloud/ipfs/YOUR_HASH`
3. Image should display correctly

## Fallback Behavior

If Pinata is not configured or fails:

- ✅ Application automatically falls back to Supabase Storage
- ✅ No IPFS hash is returned (only URL)
- ✅ User experience remains smooth
- ⚠️ Note: Without IPFS hash, blockchain minting will use the Supabase URL instead of `ipfs://` URI

## Best Practices

1. **Use JWT tokens** instead of API keys (more secure)
2. **Set appropriate expiration** for JWT tokens
3. **Monitor Pinata usage** in dashboard to avoid rate limits
4. **Test uploads** before deploying to production
5. **Keep credentials secure** - never commit to version control

## Support

- [Pinata Documentation](https://docs.pinata.cloud/)
- [Pinata API Reference](https://docs.pinata.cloud/api-pinning/pin-file-to-ipfs)
- Check application logs for detailed error messages

