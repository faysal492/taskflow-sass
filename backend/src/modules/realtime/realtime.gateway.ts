import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	ConnectedSocket,
	MessageBody,
} from "@nestjs/websockets";
import {
	Server,
	Socket
} from "socket.io";
import {
	Logger,
	UseGuards
} from "@nestjs/common";
import {
	OnEvent
} from "@nestjs/event-emitter";
import {
	JwtService
} from "@nestjs/jwt";
import {
	EventType
} from "@common/events/event-types";

@WebSocketGateway({
	cors: {
		origin: "*",
	},
	namespace: "/realtime",
})
export class RealtimeGateway
implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(RealtimeGateway.name);
	private connectedUsers = new Map < string, Set < string >> (); // userId -> socketIds

	constructor(private jwtService: JwtService) {}

	async handleConnection(client: Socket) {
		try {
			// Authenticate user from token
			const token = client.handshake.auth.token;
			const payload = this.jwtService.verify(token);

			client.data.userId = payload.sub;
			client.data.tenantId = payload.tenantId;

			// Track connection
			if (!this.connectedUsers.has(payload.sub)) {
				this.connectedUsers.set(payload.sub, new Set());
			}
			this.connectedUsers.get(payload.sub)?.add(client.id);

			// Join tenant room
			client.join(`tenant:${payload.tenantId}`);
			client.join(`user:${payload.sub}`);

			this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);

			// Send connection confirmation
			client.emit("connected", {
				userId: payload.sub,
				timestamp: new Date(),
			});
		} catch (error) {
			this.logger.error(`Connection error: ${error.message}`);
			client.disconnect();
		}
	}

	handleDisconnect(client: Socket) {
		const userId = client.data.userId;

		if (userId && this.connectedUsers.has(userId)) {
			this.connectedUsers.get(userId)?.delete(client.id);

			if (this.connectedUsers.get(userId)?.size === 0) {
				this.connectedUsers.delete(userId);
			}
		}

		this.logger.log(`Client disconnected: ${client.id}`);
	}

	@SubscribeMessage("subscribe:tasks")
	handleSubscribeTasks(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: {
			projectId ? : string
		},
	) {
		if (data.projectId) {
			client.join(`project:${data.projectId}:tasks`);
			this.logger.log(
				`Client ${client.id} subscribed to project ${data.projectId} tasks`,
			);
		}
		return {
			success: true
		};
	}

	@SubscribeMessage("unsubscribe:tasks")
	handleUnsubscribeTasks(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: {
			projectId ? : string
		},
	) {
		if (data.projectId) {
			client.leave(`project:${data.projectId}:tasks`);
		}
		return {
			success: true
		};
	}

	// Listen to task events and broadcast
	@OnEvent(EventType.TASK_CREATED)
	handleTaskCreated(event: any) {
		const {
			task,
			tenantId
		} = event;

		// Broadcast to tenant
		this.server.to(`tenant:${tenantId}`).emit("task:created", {
			task,
			timestamp: new Date(),
		});

		// Broadcast to project subscribers
		this.server
			.to(`project:${task.projectId}:tasks`)
			.emit("task:created", {
				task
			});

		this.logger.log(`Broadcasted task.created event to tenant ${tenantId}`);
	}

	@OnEvent(EventType.TASK_UPDATED)
	handleTaskUpdated(event: any) {
		const {
			task,
			tenantId
		} = event;

		this.server.to(`tenant:${tenantId}`).emit("task:updated", {
			task,
			timestamp: new Date(),
		});

		this.server
			.to(`project:${task.projectId}:tasks`)
			.emit("task:updated", {
				task
			});
	}

	@OnEvent(EventType.TASK_ASSIGNED)
	handleTaskAssigned(event: any) {
		const {
			task,
			assignee,
			tenantId
		} = event;

		// Notify the assignee directly
		this.server.to(`user:${assignee.id}`).emit("task:assigned", {
			task,
			message: `You have been assigned to: ${task.title}`,
			timestamp: new Date(),
		});

		// Broadcast to tenant
		this.server.to(`tenant:${tenantId}`).emit("task:assigned", {
			task,
			assignee,
		});

		this.logger.log(`Notified user ${assignee.id} about task assignment`);
	}

	@OnEvent(EventType.TASK_STATUS_CHANGED)
	handleTaskStatusChanged(event: any) {
		const {
			task,
			oldStatus,
			newStatus,
			tenantId
		} = event;

		this.server.to(`tenant:${tenantId}`).emit("task:status:changed", {
			task,
			oldStatus,
			newStatus,
			timestamp: new Date(),
		});

		// Notify task creator if completed
		if (newStatus === "COMPLETED" && task.creator) {
			this.server.to(`user:${task.creator.id}`).emit("task:completed", {
				task,
				message: `Task "${task.title}" has been completed`,
			});
		}
	}

	/**
	 * Send notification to specific user
	 */
	sendToUser(userId: string, event: string, data: any) {
		this.server.to(`user:${userId}`).emit(event, data);
	}

	/**
	 * Send notification to tenant
	 */
	sendToTenant(tenantId: string, event: string, data: any) {
		this.server.to(`tenant:${tenantId}`).emit(event, data);
	}

	/**
	 * Get online users count
	 */
	getOnlineUsers(): number {
		return this.connectedUsers.size;
	}

	/**
	 * Check if user is online
	 */
	isUserOnline(userId: string): boolean {
		return this.connectedUsers.has(userId);
	}
}
