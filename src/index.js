/**
 * @fileoverview Minimal universal HTTP proxy for Cloudflare Workers
 * Supports all methods, headers, and body types
 */
export default {
  /**
   * Handle incoming HTTP requests
   * @param {Request} request - Incoming client request
   * @returns {Promise<Response>} Proxied response
   */
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    try {
      const urlObj = new URL(request.url);
      
      /** @type {string|null} */
      let targetUrl = null;
      
      /** @type {string} */
      let method = request.method;
      
      /** @type {Record<string, string>} */
      let headers = Object.fromEntries(request.headers);
      
      /** @type {ArrayBuffer|string|null} */
      let body = null;
      
      // Read body ONLY once (critical for stability)
      /** @type {ArrayBuffer|null} */
      let rawBody = null;
      if (!['GET', 'HEAD'].includes(request.method)) {
        rawBody = await request.arrayBuffer();
      }
      
      // GET → query-based proxy
      if (request.method === 'GET') {
        targetUrl = urlObj.searchParams.get('url');
        method = urlObj.searchParams.get('method') || 'GET';
      } else {
        /** @type {any} */
        let parsed = {};
        
        // Try parsing JSON safely
        try {
          parsed = rawBody ?
            JSON.parse(new TextDecoder().decode(rawBody)) :
            {};
        } catch {}
        
        targetUrl = parsed.url;
        method = parsed.method || request.method;
        
        // Merge headers (no filtering)
        headers = { ...headers, ...(parsed.headers || {}) };
        
        // Decide body
        body = parsed.body ?
          (typeof parsed.body === 'object' ?
            JSON.stringify(parsed.body) :
            parsed.body) :
          rawBody;
      }
      
      // Validate URL
      if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Forward request
      const res = await fetch(targetUrl, {
        method,
        headers,
        body: ['GET', 'HEAD'].includes(method) ? null : body,
        redirect: 'follow'
      });
      
      // Add CORS headers to response
      const newHeaders = new Headers(res.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', '*');
      newHeaders.set('Access-Control-Allow-Headers', '*');
      
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
      });
      
    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Request failed',
        message: err.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};