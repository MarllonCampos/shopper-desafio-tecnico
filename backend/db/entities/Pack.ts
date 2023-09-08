import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Products } from './Product';

@Entity('packs')
export class Packs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  pack_id: number;

  @ManyToOne(() => Products, (product) => product.packs)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'code' })
  product: Products;

  @Column({ type: 'bigint' })
  product_id: number;

  @Column({ type: 'bigint' })
  qty: number;
}
