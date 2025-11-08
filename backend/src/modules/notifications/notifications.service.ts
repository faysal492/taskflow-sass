import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendTaskAssignedEmail(data: {
    assigneeEmail: string;
    assigneeName: string;
    assignedByName: string;
    taskId: string;
    taskTitle: string;
    priority: string;
    status: string;
    description?: string;
    dueDate?: Date;
    tenantName: string;
  }) {
    try {
      await this.mailerService.sendMail({
        to: data.assigneeEmail,
        subject: `New Task Assigned: ${data.taskTitle}`,
        template: 'task-assigned',
        context: {
          ...data,
          appUrl: this.configService.get('app.frontendUrl'),
          dueDate: data.dueDate ? data.dueDate.toLocaleDateString() : null,
        },
      });

      this.logger.log(`Task assigned email sent to ${data.assigneeEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
    }
  }

  async sendTaskStatusChangedEmail(data: {
    userEmail: string;
    userName: string;
    taskId: string;
    taskTitle: string;
    oldStatus: string;
    newStatus: string;
    updatedByName: string;
  }) {
    try {
      await this.mailerService.sendMail({
        to: data.userEmail,
        subject: `Task Status Updated: ${data.taskTitle}`,
        template: 'task-status-changed',
        context: {
          ...data,
          appUrl: this.configService.get('app.frontendUrl'),
        },
      });

      this.logger.log(`Status changed email sent to ${data.userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string, tenantName: string) {
    try {
      await this.mailerService.sendMail({
        to: userEmail,
        subject: `Welcome to ${tenantName} on TaskFlow`,
        template: 'welcome',
        context: {
          userName,
          tenantName,
          appUrl: this.configService.get('app.frontendUrl'),
        },
      });

      this.logger.log(`Welcome email sent to ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
    }
  }
}