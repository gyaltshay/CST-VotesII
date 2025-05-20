import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logAction(
  action,
  entityType,
  entityId,
  userId,
  metadata = {}
) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        metadata: JSON.stringify(metadata),
        timestamp: new Date()
      }
    });

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    throw new Error('Failed to log action');
  }
}

export async function getAuditLogs({
  page = 1,
  limit = 10,
  filters = {}
}) {
  try {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate && filters.endDate) {
      where.timestamp = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              studentId: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}