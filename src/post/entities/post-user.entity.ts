// import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from "typeorm";
// import { Post } from "./post.entity";
// import { User } from "../../user/entities/user.entity";

// @Entity("post_user")
// export class PostUser {
//   @PrimaryColumn({ name: "post_id" })
//   postId: string;

//   @PrimaryColumn({ name: "user_id" })
//   userId: string;

//   @ManyToOne(() => Post, (post) => post.users, {
//     onDelete: "NO ACTION",
//     onUpdate: "NO ACTION",
//   })
//   @JoinColumn({ name: "post_id", referencedColumnName: "id" })
//   post: Post;

//   @ManyToOne(() => User, (user) => user.posts, {
//     onDelete: "NO ACTION",
//     onUpdate: "NO ACTION",
//   })
//   @JoinColumn({ name: "user_id", referencedColumnName: "id" })
//   user: User;
// }
