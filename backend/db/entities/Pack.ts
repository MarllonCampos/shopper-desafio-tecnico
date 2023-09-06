import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';

import { Products } from './Product';

@Entity('packs')
export class Packs {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  pack_id: number;

  @Column()
  product_id: number;
  @Column()
  qty: number;

  @ManyToMany(() => Products, (products) => products.packs)
  @JoinTable()
  products: Products[];
}
