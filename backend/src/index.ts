import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'reflect-metadata';
import { In } from 'typeorm';

dotenv.config();
import { Router, Request, Response } from 'express';
import { Validation } from './services/validation';
import { ValidationError } from './errors/ValidationErrors';
import { Products } from '../db/entities/Product';
import { AppDataSource } from '../db/data-source';

AppDataSource.initialize()
  .then(async () => {
    const app = express();
    const route = Router();

    const corsOptions = {
      origin: 'http://localhost:5173',
      methods: 'POST',
    };

    app.use(cors(corsOptions));
    app.use(express.json());

    app.use((_req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    });

    route.post('/validate', async (req: Request, res: Response) => {
      const { content, name } = req.body;
      const [fields, _] = content;

      try {
        // Há os campos previamente definidos
        Validation.allFieldsExists(fields);
        res.status(200).json({ message: 'Planilha Validada!' });
      } catch (error) {
        if (error instanceof ValidationError) {
          res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro do servidor, contate o departamento <T.I>' });
      }
    });

    route.post('/action', async (req: Request, res: Response) => {
      const { content } = req.body;
      const [_, ...items] = content;
      const codeProducts = items.map(([first, _second]: [string, string]) => Number(first));
      try {
        // Começar transaction
        // Consulta no BD
        const products = (await AppDataSource.getRepository(Products).find({
          select: {
            code: true,
            cost_price: true,
            sales_price: true,
          },
          where: {
            code: In(codeProducts),
          },
        })) as Products[];

        // Validação Todos os Códigos de produtos existem
        Validation.allCodeProductsExists({ codeProducts, products });

        //Validação preço menor que custo
        Validation.priceCantBeLessThanCost({ newPrices: items, products });

        // Validação há algum preço maior que 10%
        Validation.isPriceGreaterThan10Percent({ newPrices: items, products });
        let responsex: any = [];
        AppDataSource.transaction(async (entityManager) => {
          const allProducts = await entityManager.getRepository(Products).find({
            select: {
              code: true,
              cost_price: true,
              sales_price: true,
            },
            where: {
              code: In(codeProducts),
            },
          });

          for (const product of allProducts) {
            const newItem = items.find(([code, _]: [string, string]) => product.code == Number(code));

            const formattedNewValue = Number(newItem[1]);
            product.sales_price = formattedNewValue;
          }
          responsex = allProducts;
          return await entityManager.save(allProducts);
        })
          .then((products) => {
            return res.status(200).json(products);
          })
          .catch((error) => {
            throw new Error(error);
          });
      } catch (error) {
        if (error instanceof ValidationError) {
          const data = error.data;
          const message = error.message;
          const status = error.status > 0 ? error.status : 400;
          const responseObject = {
            message,
            ...(data && { data }),
          };

          return res.status(status).json(responseObject);
        }
        console.log(error);
        res.status(500).json({ message: 'Erro do servidor, contate o departamento <T.I>' });
      }
    });

    route.get('/', async (_req: Request, res: Response) => {
      const allProducts = await AppDataSource.getRepository(Products).find();
      res.status(200).json({ message: 'Server Working', allProducts });
    });

    app.use(route);

    app.listen(3333, () => 'server running on port 3333');
  })
  .catch((error) => console.log(error));
