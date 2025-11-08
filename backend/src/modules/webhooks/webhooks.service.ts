import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, W } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import axios from 'axios';
import * as crypto from 'crypto';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { EventType } from '@common/events/event-types';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepo: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private deliveryRepo: Repository<WebhookDelivery>,
  ) {}

  async create(tenantId: string, data: Partial<Webhook>): Promise<Webhook> {
    const webhook = this.webhookRepo.create({
      ...data,
      tenantId,
      secret: data.secret || this.generateSecret(),
    });
    return this.webhookRepo.save(webhook);
  }

  async findByTenant(tenantId: string): Promise<Webhook[]> {
    return this.webhookRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, tenantId: string, data: Partial<Webhook>): Promise<Webhook> {
    await this.webhookRepo.update({ id, tenantId }, data);
    const webhook = await this.webhookRepo.findOne({ where: { id, tenantId } });
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    return webhook;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.webhookRepo.delete({ id, tenantId });
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Listen to all events
  @OnEvent('**')
  async handleEvent(event: any) {
    const eventType = event.constructor.name || 'unknown';
    const tenantId = event.tenantId;

    if (!tenantId) return;

    // Find webhooks subscribed to this event
    const webhooks = await this.webhookRepo.find({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const relevantWebhooks = webhooks.filter((webhook) =>
      webhook.events.some((e) => eventType.includes(e) || e === '*'),
    );

    if (relevantWebhooks.length === 0) return;

    this.logger.log(
      `Triggering ${relevantWebhooks.length} webhooks for event: ${eventType}`,
    );

    for (const webhook of relevantWebhooks) {
      await this.triggerWebhook(webhook, eventType, event);
    }
  }

  private async triggerWebhook(
    webhook: Webhook,
    eventType: string,
    payload: any,
  ): Promise<WebhookDelivery> {
    const startTime = Date.now();
    const delivery = this.deliveryRepo.create({
      webhookId: webhook.id,
      tenantId: webhook.tenantId,
      eventType,
      payload,
      url: webhook.url,
      success: false,
    });

    try {
      const payloadString = JSON.stringify(payload);
      const signature = this.generateSignature(payloadString, webhook.secret || '');

      const headers = {
        'Content-Type': 'application/json',
        'X-TaskFlow-Event': eventType,
        'X-TaskFlow-Signature': signature,
        'X-TaskFlow-Delivery': delivery.id,
        'User-Agent': 'TaskFlow-Webhook/1.0',
        ...webhook.headers,
      };

      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 10000, // 10 seconds
      });

      delivery.statusCode = response.status;
      delivery.response = JSON.stringify(response.data);
      delivery.success = true;
      delivery.durationMs = Date.now() - startTime;

      webhook.lastSuccessAt = new Date();
      webhook.failureCount = 0;

      this.logger.log(
        `✅ Webhook ${webhook.id} delivered successfully in ${delivery.durationMs}ms`,
      );

      return delivery; // Add this return statement
    } catch (error) {
      delivery.statusCode = error.response?.status;
      delivery.error = error.message;
      delivery.durationMs = Date.now() - startTime;

      webhook.lastFailureAt = new Date();
      webhook.failureCount++;

      this.logger.error(
        `❌ Webhook ${webhook.id} failed with error ${error.message} in ${delivery.durationMs}ms`,
      );

      return delivery; // Add this return statement
    }
  }

  async getDeliveries(
    webhookId: string,
    tenantId: string,
    limit: number = 50,
  ): Promise<WebhookDelivery[]> {
    return this.deliveryRepo.find({
      where: { webhookId, tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async retryDelivery(deliveryId: string, tenantId: string): Promise<void> {
    const delivery = await this.deliveryRepo.findOne({
      where: { id: deliveryId, tenantId },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const webhook = await this.webhookRepo.findOne({
      where: { id: delivery.webhookId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    delivery.retryCount++;
    await this.deliveryRepo.save(delivery);

    await this.triggerWebhook(webhook, delivery.eventType, delivery.payload);
  }
}