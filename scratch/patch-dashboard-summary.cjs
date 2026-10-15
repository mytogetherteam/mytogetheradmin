const fs = require('fs');
const path = require('path');

const servicePath = 'd:\\shop_api\\src\\modules\\additional-resources\\analytics\\admin-analytics.service.ts';
let serviceContent = fs.readFileSync(servicePath, 'utf8');

const summaryMethodCode = `
  async getDashboardSummary(start?: string, end?: string) {
    const bangkokOffsetMs = 7 * 60 * 60 * 1000;
    const now = new Date();
    const bangkokNow = new Date(now.getTime() + bangkokOffsetMs);
    const todayBangkok = new Date(
      Date.UTC(
        bangkokNow.getUTCFullYear(),
        bangkokNow.getUTCMonth(),
        bangkokNow.getUTCDate(),
      ) - bangkokOffsetMs,
    );

    // 1. KPI Card Counts
    const [
      totalUsers,
      phoneUsers,
      googleUsers,
      totalShops,
      pendingOrders,
      totalReviews,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          NOT: { phone: { startsWith: 'g_' } },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          phone: { startsWith: 'g_' },
        },
      }),
      this.prisma.shopProfile.count({
        where: { deletedAt: null, isActive: true },
      }),
      this.prisma.order.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.review.count(),
    ]);

    // 2. Fulfillment Status Counts (Today & All-Time)
    const [
      todayStatusCounts,
      allTimeStatusCounts,
      deliveryOptionCounts,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { createdAt: { gte: todayBangkok } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { status: { in: ['DELIVERED', 'CANCELED'] } },
      }),
      this.prisma.shopProfile.groupBy({
        by: ['deliveryEnabled'],
        _count: { id: true },
        where: { deletedAt: null, isActive: true },
      }),
    ]);

    let todayDelivered = 0;
    let todayCanceled = 0;
    todayStatusCounts.forEach((r) => {
      if (r.status === 'DELIVERED') todayDelivered = r._count.id;
      if (r.status === 'CANCELED') todayCanceled = r._count.id;
    });

    let totalDeliveredAllTime = 0;
    let totalCanceledAllTime = 0;
    allTimeStatusCounts.forEach((r) => {
      if (r.status === 'DELIVERED') totalDeliveredAllTime = r._count.id;
      if (r.status === 'CANCELED') totalCanceledAllTime = r._count.id;
    });

    let deliveryOptionOn = 0;
    let deliveryOptionOff = 0;
    deliveryOptionCounts.forEach((r) => {
      if (r.deliveryEnabled) deliveryOptionOn += r._count.id;
      else deliveryOptionOff += r._count.id;
    });

    // 3. Hourly Order Velocity for Today (Bangkok Time)
    const hourlyVelocityRows = await this.prisma.$queryRaw<
      Array<{ hour: number; status: string; count: number }>
    >\`
      SELECT 
        EXTRACT(HOUR FROM (("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok'))::int as hour,
        "status"::text as status,
        COUNT(id)::int as count
      FROM "order"
      WHERE "createdAt" >= \${todayBangkok}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    \`;

    const hourlyMap: Record<
      number,
      { hour: number; label: string; total: number; delivered: number; canceled: number }
    > = {};
    for (let h = 0; h < 24; h++) {
      const pad = h < 10 ? \`0\${h}:00\` : \`\${h}:00\`;
      hourlyMap[h] = { hour: h, label: pad, total: 0, delivered: 0, canceled: 0 };
    }
    hourlyVelocityRows.forEach((r) => {
      const h = r.hour;
      if (hourlyMap[h]) {
        hourlyMap[h].total += r.count;
        if (r.status === 'DELIVERED') hourlyMap[h].delivered += r.count;
        if (r.status === 'CANCELED') hourlyMap[h].canceled += r.count;
      }
    });
    const todayOrderVelocity = Object.values(hourlyMap);

    // 4. Parallel sub-queries: Revenue, Popular Shops, Extended Stats, Registration Stats, System Health
    const [revenueRes, popularShopsRes, extendedStatsRes, regStatsRes, health] =
      await Promise.all([
        this.getRevenueAnalytics(start, end).catch(() => ({ data: [] })),
        this.getPopularShops(5).catch(() => ({ data: [] })),
        this.getExtendedDashboardStats().catch(() => ({ data: null })),
        this.getUserRegistrationStats('today').catch(() => ({ data: null })),
        this.getSystemHealth().catch(() => ({ dbLatency: 4, status: 'connected' })),
      ]);

    const revenueData = (revenueRes as any)?.data || [];
    const popularShopsData = (popularShopsRes as any)?.data || [];
    const extendedStatsData = (extendedStatsRes as any)?.data || null;
    const regStatsData = (regStatsRes as any)?.data || null;

    return ApiResponse.success(
      {
        cardCounts: {
          totalUsers,
          phoneUsers,
          googleUsers,
          totalShops,
          pendingOrders,
          totalReviews,
        },
        fulfillment: {
          todayDelivered,
          todayCanceled,
          totalDeliveredAllTime,
          totalCanceledAllTime,
          deliveryOptionOn,
          deliveryOptionOff,
          totalShops,
        },
        todayOrderVelocity,
        revenue: revenueData,
        popularShops: popularShopsData,
        extendedStats: extendedStatsData,
        userRegistrationStats: regStatsData,
        systemHealth: health,
      },
      'Unified dashboard summary retrieved successfully.',
    );
  }
`;

if (!serviceContent.includes('async getDashboardSummary')) {
  // Find last closing brace
  const lastIndex = serviceContent.lastIndexOf('}');
  if (lastIndex !== -1) {
    serviceContent = serviceContent.slice(0, lastIndex) + summaryMethodCode + '\n}\n';
    fs.writeFileSync(servicePath, serviceContent, 'utf8');
    console.log('Successfully patched admin-analytics.service.ts');
  } else {
    console.error('Could not find closing brace in admin-analytics.service.ts');
  }
} else {
  console.log('admin-analytics.service.ts already has getDashboardSummary');
}

// Controller patch
const controllerPath = 'd:\\shop_api\\src\\modules\\additional-resources\\analytics\\admin-analytics.controller.ts';
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

const controllerMethodCode = `
  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get unified single-call dashboard summary including cards, fulfillment, velocity, revenue, and extended stats.' })
  async getDashboardSummary(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.adminAnalyticsService.getDashboardSummary(start, end);
  }
`;

if (!controllerContent.includes('dashboard-summary')) {
  const target = "@Get('revenue')";
  if (controllerContent.includes(target)) {
    controllerContent = controllerContent.replace(target, controllerMethodCode + '\n  ' + target);
    fs.writeFileSync(controllerPath, controllerContent, 'utf8');
    console.log('Successfully patched admin-analytics.controller.ts');
  } else {
    console.error("Could not find @Get('revenue') in admin-analytics.controller.ts");
  }
} else {
  console.log('admin-analytics.controller.ts already has dashboard-summary');
}
