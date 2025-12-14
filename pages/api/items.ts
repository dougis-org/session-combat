import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Reuse pool across hot reloads in development
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'postgres',
    });
  }
  return pool;
}

type Item = {
  id: number;
  name: string;
  created_at: string;
};

type GetResponse = {
  items: Item[];
};

type PostResponse = {
  item: Item;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponse | PostResponse | ErrorResponse>
) {
  const client = getPool();

  try {
    // Ensure the items table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (req.method === 'GET') {
      const result = await client.query<Item>('SELECT * FROM items ORDER BY id');
      res.status(200).json({ items: result.rows });
    } else if (req.method === 'POST') {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const result = await client.query<Item>(
        'INSERT INTO items (name) VALUES ($1) RETURNING *',
        [name]
      );
      
      res.status(201).json({ item: result.rows[0] });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
