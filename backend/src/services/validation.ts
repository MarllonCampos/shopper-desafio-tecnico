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

type packPriceMustChangeParams = {
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
        name: '<Geral> Planilha não contém coluna do código de produto nem de novo preço',
        data: 0,
      });
      return;
    }
    if (!containsProductCode) {
      this.errors.push({ name: '<Geral> Planilha não contém coluna do código de produto', data: 0 });
      return;
    }

    if (!containsNewPrice) {
      this.errors.push({ name: '<Geral> Planilha não contém coluna do novo preço', data: 0 });
      return;
    }
  }

  allValuesAreValidNumbers(values: Array<number>) {
    values.forEach((number, index) => {
      if (Number.isNaN(number)) {
        this.errors.push({ name: '<Geral> Valor deste produto não é númerico', data: index + 1 });
      }
    });
  }

  isPriceGreaterThan10Percent({ newPrices, products }: ValueValidationParams) {
    const unallowedItems: number[] = [];
    newPrices.forEach(([productCode, newPrice]) => {
      const dbProductSalesValue = Number(products.find((product) => product.code == productCode)?.sales_price);

      const dbProductPlus10Percent = dbProductSalesValue * 1.1;

      const dbProductMinus10Percent = dbProductSalesValue * 0.9;

      const formattedNewPrice = Number(newPrice);

      if (formattedNewPrice > dbProductPlus10Percent || formattedNewPrice < dbProductMinus10Percent) {
        unallowedItems.push(productCode);
      }
    });
    if (unallowedItems.length == 0) return;
    this.errors.push({
      name: '<Marketing> Os seguinte items não podem ter o preço alterado (>10%)',
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
      name: '<Financeiro> Os seguinte items não podem ter o preço alterado (< custo)',
      data: unallowedItems,
    });
  }

  allCodeProductsExists({ codeProducts, products }: allCodeProductsExistsParams) {
    const onlyDbCodeProducts = products.map((product) => product.code);
    const differencesArray = Validation.existsDiferences(codeProducts, onlyDbCodeProducts);
    if (differencesArray.length == 0) return;
    this.errors.push({
      name: '<Requisitos> Os seguintes items não estão cadastrados',
      data: differencesArray,
    });
  }

  productPackCodesPresentOnFile({ codeProducts, packProductsId }: productPackCodesPresentOnFileParams) {
    const productsIdsMissing = packProductsId.filter((packProductId) => !codeProducts.includes(packProductId));
    if (productsIdsMissing.length == 0) return;
    this.errors.push({
      name: '<Requisitos> O arquivo também deve conter alteração de preço dos seguintes produtos',
      data: productsIdsMissing,
    });
  }

  packPriceMustChange({ packs, newPackProductsPrice, items }: packPriceMustChangeParams) {
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

      let [, newPackPrice] = items.find(([code, _]) => code == correctPack.pack_id) as [any, number];

      const [, newPriceItem] = items.find(([code]) => code == correctPack.product_id) as [any, number];

      const formattedNewPriceItem = Number(newPriceItem) * 1000;

      const priceItemTimesQuantity = (formattedNewPriceItem * correctPack.qty) / 1000;

      const index = correctPacks.findIndex((correct) => correct.pack_id == correctPack.pack_id);
      console.log(index);

      correctPacks[index].newPackPrice = Number(newPackPrice);
      correctPacks[index].priceItemsTotal = Number(
        (correctPacks[index].priceItemsTotal + priceItemTimesQuantity).toPrecision(4)
      );
    });

    const wrongValuePack = correctPacks
      .filter((correctPack) => correctPack.newPackPrice !== correctPack.priceItemsTotal)
      .map((correctPack) => correctPack.pack_id);

    if (wrongValuePack.length == 0) return;
    this.errors.push({
      name: `<Requisitos> O(s) produto(s) ${wrongValuePack.join(
        ','
      )} estão com seus valores incorretos, verifique e tente novamente`,
      data: wrongValuePack,
    });
  }
}
