import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export type CurrentUserType = Omit<User, 'passwordHash'>;

export const CurrentUser = createParamDecorator(
  (
    data: keyof CurrentUserType | undefined,
    ctx: ExecutionContext,
  ): CurrentUserType | CurrentUserType[keyof CurrentUserType] | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: CurrentUserType }>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
