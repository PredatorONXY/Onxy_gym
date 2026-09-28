import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController, ClientsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
