// Vercel serverless entrypoint. The filename [...all] makes this a catch-all
// that receives every request under /api/*, then hands it to our existing
// Express app — all the actual routes still live in server/index.ts.
import app from '../server/index.js';

export default app;
