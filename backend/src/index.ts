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

      const ProductErrors = new Validation();
      const valueProducts = items.map(([_, valueProduct]: [string, string]) => Number(valueProduct));

      try {
        // Há os campos previamente definidos
        ProductErrors.allFieldsExists(fields);
        // Os campos de valor são valores númericos
        ProductErrors.allValuesAreValidNumbers(items);

        if (ProductErrors.errors.length > 0) throw new ValidationError('ERROR', ProductErrors.errors);
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
      const ProductErrors = new Validation();
      const productsRepository = AppDataSource.getRepository(Products);
      const packsRepository = AppDataSource.getRepository(Packs);

      try {
        const [_, ...items] = content;
        const codeProducts = items.map(([codeProduct, _]: [string, string]) => Number(codeProduct));

        // Consulta no BD
        const products = (await productsRepository.find({
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
        ProductErrors.allCodeProductsExists({ codeProducts, products });

        // Validação preço menor que custo
        ProductErrors.priceCantBeLessThanCost({ newPrices: items, products });

        // Validação há algum preço maior que 10%
        ProductErrors.isPriceGreaterThan10Percent({ newPrices: items, products });

        // Produtos enviados que também são packs
        const packs = await packsRepository.find({
          select: {
            product: {
              code: true,
              sales_price: true,
              name: true,
            },
          },
          where: [
            {
              pack_id: In(codeProducts),
            },
            {
              product_id: In(codeProducts),
            },
          ],
          relations: ['product'],
        });

        const packsId = packs.map((pack) => pack.pack_id);

        const packProductsId: number[] = packs.map((pack) => pack.product.code);

        // Validação código dos produtos de pack estão no arquivo
        ProductErrors.productPackCodesPresentOnFile({ codeProducts, packProductsId });

        if (ProductErrors.errors.length > 0)
          throw new ValidationError('Há algo de errado com as informações do arquivo', ProductErrors.errors);

        const allPacksWithByProduct = await packsRepository.find({
          where: {
            pack_id: In(packsId),
          },
          relations: ['product'],
        });

        const newPackProductsPrice = allPacksWithByProduct.map((pack) => {
          return {
            pack_id: pack.pack_id,
            product_id: pack.product.code,
            sales_price: pack.product.sales_price,
            qty: pack.qty,
          };
        });

        const packSalesPrice = await productsRepository.find({
          select: {
            code: true,
            sales_price: true,
          },
          where: {
            code: In(packsId),
          },
        });

        const packsWithProducts = allPacksWithByProduct.map((pack) => {
          const indexOfProductOnSalesPrice = packSalesPrice.findIndex((item) => item.code == pack.pack_id);
          return {
            ...pack,
            sales_price: packSalesPrice[indexOfProductOnSalesPrice].sales_price,
            product: {
              ...pack.product,
              qty: Number(pack.qty),
            },
          };
        });

        if (allPacksWithByProduct.length > 0)
          ProductErrors.newPackPriceIsWrong({ packs: allPacksWithByProduct, newPackProductsPrice, items });

        const newItems = ProductErrors.newItemsWithTheNewPackSalesPrice({ packsWithProducts, items });

        if (ProductErrors.errors.length > 0) throw new ValidationError('x', ProductErrors.errors);

        // Começar transaction
        const productsUpdated = await AppDataSource.transaction(async (entityManager) => {
          const newCodeProducts = newItems.map(([codeProduct, _]) => Number(codeProduct));
          const allProducts = await entityManager.getRepository(Products).find({
            select: {
              code: true,
              sales_price: true,
              name: true,
            },
            where: {
              code: In(newCodeProducts),
            },
          });

          const old_prices_array: number[] = [];
          for (const product of allProducts) {
            const newItem = newItems.find(([code]) => product.code == Number(code)) as [
              number | string,
              number | string
            ];

            const formattedNewValue = Number(newItem[1]);
            old_prices_array.push(product.sales_price);
            product.sales_price = formattedNewValue;
          }
          return (await entityManager.save(allProducts)).map((product, index) => ({
            ...product,
            new_price: product.sales_price,
            sales_price: Number(old_prices_array[index]),
          }));
        });
        return res.status(200).json({ message: 'Todos os produtos foram atualizados', data: productsUpdated });
      } catch (error) {
        if (error instanceof ValidationError) {
          const data = error.data;
          const message = error.message;
          const responseObject: {
            message: string;
            data?: {};
          } = {
            message,
          };

          // Adicionar objeto data se exister data
          Object.keys(data).length > 0 && Object.assign(responseObject, { data });

          return res.status(error.status).json(responseObject);
        }
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
