import { Packs } from '../../db/entities/Pack';
import { Products } from '../../db/entities/Product';

export enum AcceptedFields {
  product_code = 'product_code',
  new_price = 'new_price',
}

export type ProductModel = {
  code: number;
  cost_price: number;
  sales_price: number;
};
type ValueValidationParams = {
  newPrices: Array<Array<number>>;
  products: Array<Products>;
};

type PackProductsPrice = Pick<Products, 'sales_price'> & Pick<Packs, 'pack_id' | 'qty' | 'product_id'>;

type newPackPriceIsWrongParams = {
  packs: Array<Packs>;
  newPackProductsPrice: PackProductsPrice[];
  items: Array<Array<number>>;
};

type allCodeProductsExistsParams = Pick<ValueValidationParams, 'products'> & {
  codeProducts: Array<number>;
};

type productPackCodesPresentOnFileParams = Pick<allCodeProductsExistsParams, 'codeProducts'> & {
  packProductsId: Array<number>;
};

type packPriceWillChangeParams = {
  packsWithProducts: Array<Packs & Pick<Products, 'sales_price'>>;
  items: Array<Array<number>>;
};

export class Validation {
  errors: Array<any> = [];
  constructor() {}

  // ToDo -> Criar classe helper
  private static existsDiferences(array1: Array<number>, array2: Array<number>) {
    let majorArray = [];
    let minorArray: number[] = [];

    if (array1.length > array2.length) {
      majorArray = array1;
      minorArray = array2;
    } else {
      majorArray = array2;
      minorArray = array1;
    }
    const array = majorArray.filter((item) => !minorArray.includes(item));
    if (array.length == 0) return [];
    return array;
  }

  allFieldsExists(fields: Array<string>) {
    const fieldSet = new Set(fields);
    const containsProductCode = fieldSet.has(AcceptedFields.product_code);
    const containsNewPrice = fieldSet.has(AcceptedFields.new_price);
    if (!containsProductCode && !containsNewPrice) {
      this.errors.push({
        reason: '<Geral> Planilha não contém coluna do código de produto nem de novo preço',
        data: {},
      });
      return;
    }
    if (!containsProductCode) {
      this.errors.push({ reason: '<Geral> Planilha não contém coluna do código de produto', data: {} });
      return;
    }

    if (!containsNewPrice) {
      this.errors.push({ reason: '<Geral> Planilha não contém coluna do novo preço', data: {} });
      return;
    }
  }

  allValuesAreValidNumbers(values: Array<Array<any>>) {
    values.forEach(([code, value]) => {
      if (Number.isNaN(Number(value))) {
        this.errors.push({ reason: '<Geral> Valor deste produto não é númerico', data: code });
      }
    });
  }

  isPriceGreaterThan10Percent({ newPrices, products }: ValueValidationParams) {
    const unallowedItems: number[] = [];
    newPrices.forEach(([productCode, newPrice]) => {
      const dbProductSalesValue = Number(products.find((product) => product.code == productCode)?.sales_price);

      const dbProductPlus10Percent = dbProductSalesValue * 1.1;

      const dbProductMinus10Percent = dbProductSalesValue * 0.9;

      const formattedNewPrice = Number(String(newPrice).replace(',', '.'));

      if (formattedNewPrice > dbProductPlus10Percent || formattedNewPrice < dbProductMinus10Percent) {
        unallowedItems.push(productCode);
      }
    });

    if (unallowedItems.length == 0) return;
    this.errors.push({
      reason: '<Marketing> Este item não pode ter o preço alterado ele é menor ou maior que 10%',
      data: unallowedItems,
    });
  }

  priceCantBeLessThanCost({ newPrices, products }: ValueValidationParams) {
    const unallowedItems: number[] = [];

    newPrices.forEach(([productCode, newPrice]) => {
      const dbProductCostValue = Number(products.find((product) => product.code == productCode)?.cost_price);
      const formattedNewPrice = Number(newPrice);

      if (formattedNewPrice < dbProductCostValue) {
        unallowedItems.push(productCode);
      }
    });

    if (unallowedItems.length == 0) return;
    this.errors.push({
      reason: '<Financeiro> Este item não pode ter o preço alterado ( preço < custo)',
      data: unallowedItems,
    });
  }

  allCodeProductsExists({ codeProducts, products }: allCodeProductsExistsParams) {
    const onlyDbCodeProducts = products.map((product) => product.code);

    const differencesArray = Validation.existsDiferences(codeProducts, onlyDbCodeProducts);
    if (differencesArray.length == 0) return;
    this.errors.push({
      reason: '<Requisitos> O item não esta cadastrado',
      data: differencesArray,
    });
  }

  productPackCodesPresentOnFile({ codeProducts, packProductsId }: productPackCodesPresentOnFileParams) {
    const productsIdsMissing = packProductsId.filter((packProductId) => !codeProducts.includes(packProductId));
    if (productsIdsMissing.length == 0) return;
    const reason = [...productsIdsMissing];
    productsIdsMissing.push(...codeProducts.filter((codeProduct) => !packProductsId.includes(codeProduct)));
    this.errors.push({
      reason: `<Requisitos> O arquivo também deve conter alteração de preço destes produto ${reason.join(',')} `,
      data: productsIdsMissing,
    });
  }

  newPackPriceIsWrong({ packs, newPackProductsPrice, items }: newPackPriceIsWrongParams) {
    type correctPackType = Array<
      Pick<Packs, 'pack_id'> & {
        newPackPrice: number;
        priceItemsTotal: number;
      }
    >;
    const uniquePackIds = new Set();
    const correctPacks: correctPackType = packs.reduce((accumulator, pack) => {
      if (uniquePackIds.has(pack.pack_id)) return accumulator;
      uniquePackIds.add(pack.pack_id);
      accumulator.push({ pack_id: pack.pack_id, newPackPrice: 0, priceItemsTotal: 0 });
      return accumulator;
    }, [] as correctPackType);

    newPackProductsPrice.forEach((packProduct) => {
      const correctPack = packs.find((pack) => pack.product_id == packProduct.product_id) as Packs;

      // Procura dentro dos itens enviado o novo preço do pack
      let [, newPackPrice] = items.find(([code, _]) => code == correctPack.pack_id) || [null, null];

      // Caso não exista novo preço do pack retorne
      if (!newPackPrice) return;

      let [, newPriceItem] = items.find(([code]) => code == correctPack.product_id) || [null, null];

      const formattedNewPriceItem = Number(newPriceItem) * 1000;

      const priceItemTimesQuantity = (formattedNewPriceItem * correctPack.qty) / 1000;

      const index = correctPacks.findIndex((correct) => correct.pack_id == correctPack.pack_id);

      correctPacks[index].newPackPrice = newPackPrice == 0 ? priceItemTimesQuantity : Number(newPackPrice);
      correctPacks[index].priceItemsTotal = Number(
        (correctPacks[index].priceItemsTotal + priceItemTimesQuantity).toPrecision(4)
      );
    });

    const wrongValuePack = correctPacks
      .filter((correctPack) => correctPack.newPackPrice !== correctPack.priceItemsTotal)
      .map((correctPack) => correctPack.pack_id);

    if (wrongValuePack.length == 0) return;
    this.errors.push({
      reason: `<Requisitos> O(s) produto(s) ${wrongValuePack.join(
        ','
      )} estão com seus valores incorretos, verifique e tente novamente`,
      data: wrongValuePack,
    });
  }

  // ToDo -> Remover daqui e criar um service para o products
  newItemsWithTheNewPackSalesPrice({
    packsWithProducts,
    items,
  }: packPriceWillChangeParams): Array<Array<number | string>> {
    const packWithProductsSet = new Set();

    interface packWithProductContentProductType extends Products {
      newPriceItem: number;
      qty: number;
    }
    type packWithProductContentType = Array<{
      pack_id: number;
      sales_price: number;
      products: Array<packWithProductContentProductType>;
    }>;

    const packWithProductContent: packWithProductContentType = [];

    for (const pack of packsWithProducts) {
      const correctArrayItem = items.find(([code]) => code == pack.product_id);
      const newPriceItem = correctArrayItem ? correctArrayItem[1] : Number(pack.product.sales_price);
      if (!packWithProductsSet.has(pack.pack_id)) {
        packWithProductsSet.add(pack.pack_id);
        packWithProductContent.push({
          pack_id: pack.pack_id,
          sales_price: pack.sales_price,
          products: [{ ...pack.product, newPriceItem, qty: pack.qty }],
        });
      } else {
        const indexOfProductContent = packWithProductContent.findIndex((item) => item.pack_id == pack.pack_id);
        packWithProductContent[indexOfProductContent].products.push({ ...pack.product, newPriceItem, qty: pack.qty });
      }
    }

    const formattedPackWithProductContent = packWithProductContent.map((productContent) => {
      const newSalesPrice = productContent.products
        .map((product) => product.newPriceItem * product.qty)
        .reduce((acc, actual) => Number((acc + actual).toPrecision(4)), 0);
      return {
        ...productContent,
        sales_price: newSalesPrice,
      };
    });
    formattedPackWithProductContent.forEach((productContent) =>
      items.push([Number(productContent.pack_id), productContent.sales_price])
    );

    return items;
  }
}
