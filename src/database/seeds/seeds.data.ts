import { RoleEnum, StatusEnum } from "../../utils/enum/role";

export const legalEntityTypes = [
  "constitution",
  "acts",
  "ordinance",
  "formation orders",
  "rules and regulations",
  "policies",
];

export const adminCredential = {
  username: "admin@gmail.com",
  password: "@password123",
  role: RoleEnum.SUPER_ADMIN,
  status: StatusEnum.PENDING,
};
