import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'reflect-metadata';

dotenv.config();
import { Router, Request, Response } from 'express';
import { Validation } from './services/validation';
import { ValidationError } from './errors/ValidationErrors';
import { Products } from '../db/entities/Product';
import { AppDataSource } from '../db/data-source';
import { Packs } from '../db/entities/Pack';
import { In } from 'typeorm';

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
      const [fields, ...items] = content;
      const valueProducts = items.map(([_, valueProduct]: [string, string]) => Number(valueProduct));

      try {
        // Há os campos previamente definidos
        Validation.allFieldsExists(fields);
        // Os campos de valor são valores númericos
        Validation.allValuesAreValidNumbers(valueProducts);
        res.status(200).json({ message: 'Planilha Validada!' });
      } catch (error) {
        if (error instanceof ValidationError) {
          const data = error.data;
          const message = error.message;
          const status = error.status > 0 ? error.status : 400;
          const responseObject: {
            message: string;
            data?: {};
          } = {
            message,
          };

          // Adicionar objeto data se exister data
          Object.keys(data).length > 0 && Object.assign(responseObject, { data });
        }
        res.status(500).json({ message: 'Erro do servidor, contate o departamento <T.I>' });
      }
    });

    route.post('/action', async (req: Request, res: Response) => {
      const { content } = req.body;
      try {
        const [_, ...items] = content;
        const codeProducts = items.map(([codeProduct, _]: [string, string]) => Number(codeProduct));

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

        // Validação preço menor que custo
        Validation.priceCantBeLessThanCost({ newPrices: items, products });

        // Validação há algum preço maior que 10%
        Validation.isPriceGreaterThan10Percent({ newPrices: items, products });

        // Produtos enviados que também são packs
        const packs = await AppDataSource.getRepository(Packs).find({
          where: {
            pack_id: In(codeProducts),
          },
        });

        const packProductsId = packs.map((pack) => pack.product_id);

        // Validação código dos produtos de pack estão no arquivo
        Validation.productPackCodesPresentOnFile({ codeProducts, packProductsId });

        const newPackProductsPrice = packs.map((pack) => {
          const product = products.find((product) => product.code == pack.product_id) as Products;

          return {
            pack_id: pack.id,
            qty: pack.qty,
            sales_price: product.sales_price,
            product_id: pack.product_id,
          };
        });

        Validation.packPriceMustChange({ packs, newPackProductsPrice, items });

        // Começar transaction
        const productsUpdated = await AppDataSource.transaction(async (entityManager) => {
          const allProducts = await entityManager.getRepository(Products).find({
            select: {
              code: true,
              cost_price: true,
              sales_price: true,
              name: true,
            },
            where: {
              code: In(codeProducts),
            },
          });

          const old_prices_array: number[] = [];
          for (const product of allProducts) {
            const newItem = items.find(([code, _]: [string, string]) => product.code == Number(code));

            const formattedNewValue = Number(newItem[1]);
            old_prices_array.push(product.sales_price);
            product.sales_price = formattedNewValue;
          }

          return (await entityManager.save(allProducts)).map((product, index) => ({
            ...product,
            cost_price: Number(product.cost_price),
            new_price: product.sales_price,
            sales_price: Number(old_prices_array[index]),
          }));
        });

        return res.status(200).json({ message: 'Todos os produtos foram atualizados', data: productsUpdated });
      } catch (error) {
        if (error instanceof ValidationError) {
          const data = error.data;
          const message = error.message;
          const status = error.status > 0 ? error.status : 400;
          const responseObject: {
            message: string;
            data?: {};
          } = {
            message,
          };

          // Adicionar objeto data se exister data
          Object.keys(data).length > 0 && Object.assign(responseObject, { data });

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
