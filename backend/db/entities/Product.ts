import { Entity, Column, PrimaryColumn, ManyToMany, JoinTable } from 'typeorm';
import { Packs } from './Pack';

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

  @ManyToMany(() => Packs, (pack) => pack.products)
  @JoinTable()
  packs: Packs[];
}
