import { ValidationError } from '../errors/ValidationErrors';

enum AcceptedFields {
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
  products: Array<ProductModel>;
};

type allCodeProductsExistsParams = {
  codeProducts: Array<number>;
  products: Array<ProductModel>;
};

export class Validation {
  static allFieldsExists(fields: Array<string>) {
    const fieldSet = new Set(fields);
    const containsProductCode = fieldSet.has(AcceptedFields.product_code);
    const containsNewPrice = fieldSet.has(AcceptedFields.new_price);
    if (!containsProductCode && !containsNewPrice)
      throw new ValidationError('Planilha não contém coluna do código de produto nem de novo preço ');
    if (!containsProductCode) throw new ValidationError('<Validar> Planilha não contém coluna do código de produto');

    if (!containsNewPrice) throw new ValidationError('<Validar> Planilha não contém coluna do novo preço');
  }

  static isPriceGreaterThan10Percent({ newPrices, products }: ValueValidationParams) {
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
    throw new ValidationError(
      '<Marketing> Os seguinte items não podem ter o preço alterado (>10%)',
      unallowedItems,
      400
    );
  }

  static priceCantBeLessThanCost({ newPrices, products }: ValueValidationParams) {
    const unallowedItems: number[] = [];

    newPrices.forEach(([productCode, newPrice]) => {
      const dbProductCostValue = Number(products.find((product) => product.code == productCode)?.cost_price);
      const formattedNewPrice = Number(newPrice);

      if (formattedNewPrice < dbProductCostValue) {
        unallowedItems.push(productCode);
      }
    });

    if (unallowedItems.length == 0) return;
    throw new ValidationError(
      '<Financeiro> Os seguinte items não podem ter o preço alterado (< custo)',
      unallowedItems,
      400
    );
  }

  static allCodeProductsExists({ codeProducts, products }: allCodeProductsExistsParams) {
    let majorArray = [];
    let minorArray: number[] = [];
    const onlyDbCodeProducts = products.map((product) => product.code);
    if (codeProducts.length > products.length) {
      majorArray = codeProducts;
      minorArray = onlyDbCodeProducts;
    } else {
      majorArray = onlyDbCodeProducts;
      minorArray = codeProducts;
    }
    const array = majorArray.filter((item) => !minorArray.includes(item));
    if (array.length == 0) return;
    throw new ValidationError('<Requisitos> Os seguintes items não estão cadastrados', array, 422);
  }
}
