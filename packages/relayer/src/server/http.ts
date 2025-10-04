import express from 'express';
import cors from 'cors';
import { LeafSchema } from '../domain/leaf.js';
import { addLeaf, listAnchors } from '../services/state.js';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.post('/leaves', (req, res) => {
    const parse = LeafSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }
    addLeaf(parse.data);
    res.status(202).json({ status: 'queued' });
  });

  app.get('/anchors', (_req, res) => {
    res.json({ anchors: listAnchors() });
  });

  return app;
}


