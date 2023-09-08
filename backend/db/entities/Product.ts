import { Entity, Column, PrimaryColumn, OneToMany, JoinColumn } from 'typeorm';
import { Packs } from './Pack';

@Entity('products')
export class Products {
  @PrimaryColumn()
  code: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 9, scale: 2 })
  cost_price: number;

  @Column({ type: 'decimal', precision: 9, scale: 2 })
  sales_price: number;

  // Defina a relação de um produto para muitos pacotes
  @OneToMany(() => Packs, (pack) => pack.product)
  @JoinColumn([
    { name: 'code', referencedColumnName: 'pack_id' },
    { name: 'code', referencedColumnName: 'product_id' },
  ])
  packs: Packs;
}
