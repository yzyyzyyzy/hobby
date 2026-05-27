import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { CirclesModule } from '@/modules/circles/circles.module';
import { PostsModule } from '@/modules/posts/posts.module';
import { ActivitiesModule } from '@/modules/activities/activities.module';
import { ResourcesModule } from '@/modules/resources/resources.module';
import { MessagesModule } from '@/modules/messages/messages.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { CustomerServiceModule } from '@/modules/customer-service/customer-service.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    CirclesModule,
    PostsModule,
    ActivitiesModule,
    ResourcesModule,
    MessagesModule,
    ReportsModule,
    AdminModule,
    CustomerServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
