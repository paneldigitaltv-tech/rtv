# CF HTTP Router

A universal HTTP request router for Cloudflare Workers. Forward any HTTP request with custom method, headers, and body to any target URL.


## Features

- Supports all HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.)
- Preserves exact headers and response format
- Handles streaming responses (SSE, large files)
- Automatic body parsing for JSON, text, and binary
- Built-in CORS support
- No dependencies or KV storage required

## Notes on Latency

Using a Cloudflare Worker introduces a small amount of additional latency due to the extra network hop.  
In most cases, this is minimal (typically a few milliseconds).

## Use Cases

- Hide origin server IP
- Preventing hitting ip based rate limits (little)
- Implement caching or authentication
- Reduce direct exposure to IP-based rate limits

## Important

This router does NOT bypass:
- API key limits
- Account-based rate limits
- Advanced anti-bot systems
- Application-level restrictions

It only changes the visible IP to Cloudflare’s edge network.


## How it works

Send a POST request to your worker with the target request configuration:

```json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "headers": {
    "Authorization": "Bearer token123"
  }
}
```

The worker forwards the request and returns the exact response from the target server.

## Deployment

### One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Soumyadeep765/cf-http-router)

### Manual Deploy

1. Clone the repository:
```bash
git clone https://github.com/Soumyadeep765/cf-http-router.git
cd cf-http-router
```

2. Install dependencies:
```bash
npm install
```

3. Deploy to Cloudflare:
```bash
npm run deploy
```

## Usage Examples

### Basic GET request
```javascript
const response = await fetch('https://your-worker.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1'
  })
});
```

### POST with custom headers and body
```javascript
const response = await fetch('https://your-worker.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'POST',
    url: 'https://api.example.com/users',
    headers: {
      'Authorization': 'Bearer token123',
      'X-Custom-Header': 'value'
    },
    body: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  })
});
```

### Streaming response (SSE)
The worker handles streaming responses automatically - perfect for Server-Sent Events or large file downloads.

## API Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | string | Yes | HTTP method (GET, POST, etc.) |
| `url` | string | Yes | Target URL to forward request to |
| `headers` | object | No | Custom headers to include |
| `body` | any | No | Request body (for POST, PUT, etc.) |

## Development

Run locally:
```bash
npm run dev
```

Deploy to staging:
```bash
npm run deploy:staging
```

Deploy to production:
```bash
npm run deploy:prod
```
