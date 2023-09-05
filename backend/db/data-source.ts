import { DataSource } from 'typeorm';
import 'reflect-metadata';
import { Packs } from './entities/Pack';
import { Products } from './entities/Product';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  logging: false,
  entities: [Packs, Products],

  migrations: [],
  subscribers: [],
});
