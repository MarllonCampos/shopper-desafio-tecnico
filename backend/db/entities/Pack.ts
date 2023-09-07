import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

import { Products } from './Product';

@Entity('packs')
export class Packs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pack_id' })
  pack_id: number;

  @Column({ name: 'product_id' })
  product_id: number;

  @Column()
  qty: number;

  @ManyToMany(() => Products, (products) => products.packs)
  products: Products[];
}
