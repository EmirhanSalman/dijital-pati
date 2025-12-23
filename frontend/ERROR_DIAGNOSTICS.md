# Error Diagnostics & Solutions Guide

This document provides solutions for the three main errors encountered in the application.

## 1. Supabase Auth 400 Bad Request Error

### Error Message
```
khfffcjhcgkthblebeik.supabase.co/auth/v1/token?grant_type=password:1 
Failed to load resource: the server responded with a status of 400
```

### Common Causes & Solutions

#### A. Email Not Confirmed
**Symptom:** User registered but cannot login
**Solution:**
1. Check Supabase Dashboard → Authentication → Users
2. Verify if email confirmation is required in Settings → Auth → Email Auth
3. If confirmation is required:
   - Check user's email inbox (including spam) for confirmation link
   - Or disable email confirmation in Supabase settings for development

#### B. Invalid Credentials Format
**Symptom:** 400 error with "Invalid login credentials"
**Solution:**
1. Verify email format is correct (e.g., `user@example.com`)
2. Check password meets requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (!@#$%^&*.,)

#### C. Malformed Request Payload
**Symptom:** 400 error with generic message
**Solution:**
1. Check browser console for detailed error
2. Verify environment variables are set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
3. Clear browser cache and cookies
4. Check network tab for exact request/response

#### D. Rate Limiting
**Symptom:** 400 or 429 error after multiple attempts
**Solution:**
1. Wait a few minutes before retrying
2. Check Supabase Dashboard → Settings → Rate Limits

### Debugging Steps
1. Open browser DevTools → Network tab
2. Filter by "token" or "auth"
3. Check the failed request:
   - Request payload
   - Response body
   - Headers
4. Check browser console for detailed error messages

---

## 2. Token ID Extraction Error (Critical)

### Error Message
```
Create pet error: Error: Token ID alınamadı. Lütfen tekrar deneyin.
```

### Root Cause
The blockchain transaction succeeds, but the token ID cannot be extracted from the transaction receipt events. This can happen due to:
1. Event signature mismatch
2. Event not emitted (unlikely if transaction succeeds)
3. Receipt parsing issues
4. Blockchain state mismatch with local database

### Solution Implemented

The `useMintPet` hook has been updated with **multiple fallback methods**:

#### Method 1: Event Parsing (Primary)
- Uses ethers.js `parseLog()` to extract `PetMinted` event
- Most reliable method for event-based contracts

#### Method 2: Manual Event Decoding (Fallback)
- Manually decodes event using event signature
- Handles edge cases where automatic parsing fails

#### Method 3: Receipt Analysis (Debug)
- Logs full receipt details for debugging
- Helps identify if event is present but in different format

### Blockchain State Synchronization

**Important:** The code now trusts the **blockchain as the source of truth**. The token ID is always extracted from the blockchain transaction, not from local database counters.

#### How It Works:
1. User mints NFT → Transaction sent to blockchain
2. Transaction mined → Receipt received
3. Token ID extracted from `PetMinted` event in receipt
4. Token ID saved to local database (whatever value blockchain returns)

#### Handling State Mismatches:
- If blockchain counter is at ID 6 and local DB expects ID 0, the code will:
  - Extract ID 6 from blockchain (correct)
  - Save ID 6 to database (correct)
  - No conflict occurs because blockchain is authoritative

### Debugging Token ID Issues

If you still encounter this error:

1. **Check Transaction Receipt:**
   ```javascript
   // The hook now logs full receipt details
   // Check browser console for:
   // - Transaction hash
   // - Block number
   // - All event logs
   ```

2. **Verify Contract Address:**
   - Ensure `CONTRACT_ADDRESS` in `useMintPet.ts` matches deployed contract
   - Check if contract was redeployed (address might have changed)

3. **Check Event Signature:**
   - Verify contract emits `PetMinted(uint256 indexed tokenId, address owner)`
   - Check ABI matches contract exactly

4. **Use Blockchain Explorer:**
   - Copy transaction hash from console
   - View on Etherscan (or your network's explorer)
   - Verify `PetMinted` event is present
   - Check token ID in event logs

5. **Manual Verification:**
   ```javascript
   // In browser console after failed mint:
   const provider = new ethers.BrowserProvider(window.ethereum);
   const receipt = await provider.getTransactionReceipt("TRANSACTION_HASH");
   console.log("Receipt logs:", receipt.logs);
   ```

### Expected Behavior After Fix

✅ Transaction succeeds → Token ID extracted from event → Saved to DB
✅ If blockchain has ID 6, local DB will save ID 6 (no conflict)
✅ Detailed error logging helps identify issues quickly
✅ Multiple fallback methods ensure token ID is found

---

## 3. Vercel Analytics 404 Error

### Error Message
```
(404) Vercel Analytics endpoint not found
```

### Status
**IGNORE FOR NOW** - This is a non-critical error related to Vercel Analytics configuration and does not affect core functionality.

### If You Want to Fix It Later:
1. Check `next.config.ts` for analytics configuration
2. Verify Vercel Analytics is enabled in project settings
3. Or remove `@vercel/analytics` if not needed

---

## Quick Troubleshooting Checklist

### For Supabase 400 Error:
- [ ] Email confirmed (if required)
- [ ] Credentials format valid
- [ ] Environment variables set
- [ ] Not rate limited
- [ ] Check browser console for details

### For Token ID Error:
- [ ] Check browser console for transaction hash
- [ ] Verify contract address is correct
- [ ] Check transaction on blockchain explorer
- [ ] Verify `PetMinted` event exists in receipt
- [ ] Check ABI matches contract

### General:
- [ ] Clear browser cache
- [ ] Check network connectivity
- [ ] Verify all environment variables
- [ ] Check Supabase/Blockchain service status

---

## Contact & Support

If issues persist after following this guide:
1. Check browser console for detailed error logs
2. Check network tab for failed requests
3. Verify all services (Supabase, Blockchain) are operational
4. Review transaction receipts on blockchain explorer

