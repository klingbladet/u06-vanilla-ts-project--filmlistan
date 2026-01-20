import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import moviesRouter from './routes/movies.js';

// Läs in miljövariabler från .env
dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Middleware
app.use(cors()); // Aktivera CORS för alla routes
app.use(express.json()); // Parsar JSON-body i inkommande requests

// Routes
app.use('/api/movies', moviesRouter);

// Health check-endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Movie API is running',
    timestamp: new Date().toISOString()
  });
});

// Root-endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Movie Watchlist API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      movies: {
        getAll: 'GET /api/movies',
        getFiltered: 'GET /api/movies?status=watchlist|watched',
        getOne: 'GET /api/movies/:id',
        create: 'POST /api/movies',
        update: 'PUT /api/movies/:id',
        delete: 'DELETE /api/movies/:id',
        stats: 'GET /api/movies/user/stats'
      }
    }
  });
});

// 404-hanterare (okänd route)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    hint: 'Check the API documentation for available endpoints'
  });
});

// Felhanterare (serverfel)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Starta servern
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     🎬 Movie Watchlist API Server     ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✓ API docs: http://localhost:${PORT}/`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET    /api/movies              - Get all movies');
  console.log('  GET    /api/movies/:id          - Get specific movie');
  console.log('  GET    /api/movies/user/stats   - Get user statistics');
  console.log('  POST   /api/movies              - Add new movie');
  console.log('  PUT    /api/movies/:id          - Update movie');
  console.log('  DELETE /api/movies/:id          - Delete movie');
  console.log('');
});


