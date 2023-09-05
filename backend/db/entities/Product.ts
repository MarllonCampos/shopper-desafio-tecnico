import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('products')
export class Products {
  @PrimaryColumn()
  code: number;

  @Column()
  name: string;

  @Column('decimal')
  cost_price: number;

  @Column('decimal')
  sales_price: number;
}
