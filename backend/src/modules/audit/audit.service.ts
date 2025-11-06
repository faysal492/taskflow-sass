import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';


export interface CreateAuditLogDto {
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name, 'postgres')
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    const log = new this.auditLogModel({
      ...dto,
      timestamp: new Date(),
    });
    return log.save();
  }

  async findByTenant(
    tenantId: string,
    limit: number = 100,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({ tenantId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findByUser(
    userId: string,
    limit: number = 100,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.auditLogModel.aggregate([
      {
        $match: {
          tenantId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }
}
