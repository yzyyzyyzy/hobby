import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CirclesModule,
    PostsModule,
    ActivitiesModule,
    ResourcesModule,
    MessagesModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
