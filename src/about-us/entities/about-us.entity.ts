import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('about_us')
export class AboutUs {
  @PrimaryGeneratedColumn("uuid", {name:'about_us_id'})
  id: string;

  @Column({type: 'varchar', length: 255, name:'title'})
  title: string;

  @Column({type: 'varchar', length: 255, name:'description'})
  description: string;

  @Column({type: 'varchar', length: 255, name:'image'})
  image: string;

  @Column({type: 'varchar', length: 255, name:'status'})
  status: boolean;
}
