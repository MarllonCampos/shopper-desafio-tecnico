import { Entity, Column, PrimaryColumn, ManyToMany, JoinTable } from 'typeorm';
import { Packs } from './Pack';

@Entity('products')
export class Products {
  @PrimaryColumn()
  code: number;

  @Column()
  name: string;

  @Column({ type: 'double precision' })
  cost_price: number;

  @Column({ type: 'double precision' })
  sales_price: number;

  @ManyToMany(() => Packs, (pack) => pack.products)
  @JoinTable({
    name: 'packs', // Nome da tabela "Packs"
    joinColumn: {
      name: 'pack_id', // Coluna na tabela "Packs" que se refere a "Products"
      referencedColumnName: 'code', // Coluna na tabela "Products" a ser relacionada
    },
    inverseJoinColumn: {
      name: 'product_id', // Coluna na tabela "Packs" que se refere a outros "Packs"
      referencedColumnName: 'product_id', // Coluna na tabela "Products" a ser relacionada
    },
  })
  packs: Packs[];
}
