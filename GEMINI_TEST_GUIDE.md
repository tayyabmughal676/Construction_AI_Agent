# 🧪 Testing Gemini LLM Integration

## Step 1: Get Your Gemini API Key

1. Go to: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

---

## Step 2: Add API Key to .env

Open your `.env` file and add:

```env
GOOGLE_API_KEY=your_actual_api_key_here
```

**Example:**
```env
GOOGLE_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

---

## Step 3: Restart Server

The server will auto-restart when you save `.env`, or manually restart:

```bash
# Stop current server (Ctrl+C)
# Then restart:
bun run dev
```

---

## Step 4: Test Natural Language Queries

### Test 1: Manufacturing (Natural Language)
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What do we have in stock?"}'
```

**Expected:** Should detect "manufacturing" department and list inventory

---

### Test 2: HR (Natural Language)
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Show me all the people working here"}'
```

**Expected:** Should detect "hr" department and list employees

---

### Test 3: Construction (Natural Language)
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What construction projects are we working on?"}'
```

**Expected:** Should detect "construction" department and list projects

---

### Test 4: Complex Query
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Do we have any steel rods available?"}'
```

**Expected:** Should detect "manufacturing", check inventory for steel

---

## Step 5: Check Detection Metadata

Look for these fields in the response:

```json
{
  "message": "...",
  "detection": {
    "method": "llm",           // ← Should say "llm" not "keyword"
    "confidence": 0.95,         // ← High confidence (0.8-1.0)
    "reasoning": "User is asking about inventory/stock",
    "action": "list inventory items"
  }
}
```

---

## Troubleshooting

### If you see `"method": "keyword"`:
- API key not set or invalid
- Check `.env` file has `GOOGLE_API_KEY=...`
- Restart server after adding key

### If you get errors:
- Check API key is valid
- Check you have Gemini API enabled
- Check server logs for error messages

### Check Server Logs:
Look for:
```
[INFO]: Using LLM-powered intent detection
[INFO]: LLM intent detection result
```

---

## Without API Key (Fallback Mode)

If you don't have an API key yet, the system will automatically fall back to keyword matching:

```bash
# These still work without API key
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"list inventory"}'
```

---

## Next Steps

Once Gemini is working:
1. ✅ Test natural language queries
2. ✅ Verify LLM detection in responses
3. ✅ Check confidence scores
4. 🚀 Move to Phase 4.1 (LangGraph workflows)

---

## Quick Reference

**Get API Key:** https://makersuite.google.com/app/apikey

**Add to .env:**
```env
GOOGLE_API_KEY=your_key_here
```

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What do we have in stock?"}'
```

**Look for:** `"method": "llm"` in response

---

**Ready to test!** 🚀
