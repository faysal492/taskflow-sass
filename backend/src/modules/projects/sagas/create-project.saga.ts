import { Injectable } from '@nestjs/common';
import { SagaService } from '@modules/saga/saga.service';
import { ProjectsService } from '../projects.service';
import { TasksService } from '@modules/tasks/tasks.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { TaskStatus } from '@common/enums/task-status.enum';
import { Priority } from '@common/enums/priority.enum';

@Injectable()
export class CreateProjectSaga {
  constructor(
    private sagaService: SagaService,
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private notificationsService: NotificationsService,
  ) {
    this.registerSaga();
  }

  private registerSaga() {
    this.sagaService.registerSaga({
      name: 'CreateProjectWithSetup',
      steps: [
        // Step 1: Create Project
        {
          name: 'createProject',
          execute: async () => {
            const { tenantId, userId, projectData } = this.getContext();
            const project = await this.projectsService.create(
              tenantId,
              userId,
              projectData,
            );
            return { projectId: project.id };
          },
          compensate: async () => {
            const { projectId } = this.getContext().createProject;
            const { tenantId } = this.getContext();
            await this.projectsService.remove(projectId, tenantId);
          },
        },

        // Step 2: Create Initial Tasks
        {
          name: 'createInitialTasks',
          execute: async () => {
            const { projectId } = this.getContext().createProject;
            const { tenantId, userId } = this.getContext();

            const defaultTasks = [
              {
                title: 'Project Setup',
                description: 'Initial project setup and configuration',
                projectId,
                priority: Priority.HIGH,
                status: TaskStatus.TODO,
              },
              {
                title: 'Team Onboarding',
                description: 'Onboard team members to the project',
                projectId,
                priority: Priority.MEDIUM,
                status: TaskStatus.TODO,
              },
            ];

            const createdTasks = [];
            for (const taskData of defaultTasks) {
              const task = await this.tasksService.create(
                tenantId,
                userId, 
                taskData,
              );
              createdTasks.push(task.id);
            }

            return { taskIds: createdTasks };
          },
          compensate: async () => {
            const { taskIds } = this.getContext().createInitialTasks;
            const { tenantId, userId } = this.getContext();

            for (const taskId of taskIds) {
              await this.tasksService.remove(taskId, tenantId, userId);
            }
          },
        },

        // Step 3: Send Welcome Email
        {
          name: 'sendWelcomeEmail',
          execute: async () => {
            const { projectId } = this.getContext().createProject;
            const { userEmail, userName, projectName } = this.getContext();

            await this.notificationsService.sendWelcomeEmail(
              userEmail,
              userName,
              projectName,
            );

            return { emailSent: true };
          },
          compensate: async () => {
            // No compensation needed for email
            // Could log for auditing
          },
        },

        // Step 4: Create Project Activity Log
        {
          name: 'createActivityLog',
          execute: async () => {
            // Create initial activity entry
            // This would integrate with your audit system
            return { activityLogCreated: true };
          },
          compensate: async () => {
            // Remove activity log if needed
          },
        },
      ],
    });
  }

  private context: any = {};

  private getContext() {
    return this.context;
  }

  async execute(
    tenantId: string,
    userId: string,
    projectData: any,
    userEmail: string,
    userName: string,
  ) {
    this.context = {
      tenantId,
      userId,
      projectData,
      userEmail,
      userName,
      projectName: projectData.name,
    };

    return this.sagaService.executeSaga('CreateProjectWithSetup', this.context);
  }
}