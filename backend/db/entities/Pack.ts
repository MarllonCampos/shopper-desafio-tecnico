import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Products } from './Product';

@Entity('packs')
export class Packs {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  pack_id: number;

  @OneToMany(() => Products, (product) => product.code)
  product_id: number;

  @Column()
  qty: number;

  @Column()
  sales_price: number;
}
