import { SetMetadata } from "@nestjs/common";
import { RoleEnum } from "src/utils/enum/role";

export const ROLES_KEY = "roles";
export const HasRoles = (...roles: RoleEnum[]) => SetMetadata(ROLES_KEY, roles);
