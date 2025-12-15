import pkg from 'pg';
const { Pool } = pkg;
import { DB_CONFIG } from '../config/config.js';

const pool = new Pool(DB_CONFIG);

export const query = (text, params) => pool.query(text, params);

export default {
  query
};
