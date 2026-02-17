// Cloudflare Workers entry point
import { handleRequest } from './router.js';

export default {
  async fetch(request) {
    return handleRequest(request);
  },
};
