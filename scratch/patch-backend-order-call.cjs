const fs = require('fs');

// 1. Update user-order.service.ts
const orderServicePath = 'd:/shop_api/src/modules/orders/user/user-order.service.ts';
let orderContent = fs.readFileSync(orderServicePath, 'utf8');
const isCrlf = orderContent.includes('\r\n');
let normOrder = orderContent.replace(/\r\n/g, '\n');

const targetCall = `    // Auto-call the shop immediately via Twilio
    this.prisma.shopProfile.findUnique({ where: { id: shopId }, select: { phone: true } })
      .then(shop => {
        if (shop?.phone) {
          this.twilioService.callShop(shop.phone);
        }
      })
      .catch(err => console.error('Failed to fetch shop phone for Twilio call', err));`;

const replacementCall = `    // Auto-call the shop via Twilio if enabled (both platform-wide and per-shop)
    this.triggerTwilioOrderCall(shopId);`;

if (normOrder.includes(targetCall)) {
  normOrder = normOrder.replace(targetCall, replacementCall);

  const helperMethod = `  private async triggerTwilioOrderCall(shopId: number) {
    try {
      if (!this.twilioService?.enabled) return;

      const isGloballyEnabled = await this.twilioService.isOrderCallEnabled();
      if (!isGloballyEnabled) {
        return;
      }

      const shop = await this.prisma.shopProfile.findUnique({
        where: { id: shopId },
        select: { phone: true, orderCallEnabled: true },
      });

      if (!shop?.phone) return;
      if ((shop as any).orderCallEnabled === false) return;

      await this.twilioService.callShop(shop.phone);
    } catch (err) {
      console.error('Failed to trigger Twilio call for order', err);
    }
  }

  private async buildOrderItemsData(`;

  normOrder = normOrder.replace('  private async buildOrderItemsData(', helperMethod);
  fs.writeFileSync(orderServicePath, isCrlf ? normOrder.replace(/\n/g, '\r\n') : normOrder, 'utf8');
  console.log('Updated user-order.service.ts with triggerTwilioOrderCall');
} else {
  console.error('Target call block not found in user-order.service.ts');
}

// 2. Update create-admin-shop-profile.dto.ts
const createDtoPath = 'd:/shop_api/src/modules/shop-profile/admin/dto/create-admin-shop-profile.dto.ts';
let createDtoContent = fs.readFileSync(createDtoPath, 'utf8');
const isDtoCrlf = createDtoContent.includes('\r\n');
let normDto = createDtoContent.replace(/\r\n/g, '\n');

if (!normDto.includes('orderCallEnabled?: boolean')) {
  const targetDto = `  @IsOptional()
  @Transform(({ value }) => toBool(value) ?? false)
  @IsBoolean()
  deliveryEnabled?: boolean;`;

  const replacementDto = `  @IsOptional()
  @Transform(({ value }) => toBool(value) ?? false)
  @IsBoolean()
  deliveryEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBool(value) ?? true)
  @IsBoolean()
  orderCallEnabled?: boolean;`;

  if (normDto.includes(targetDto)) {
    normDto = normDto.replace(targetDto, replacementDto);
    fs.writeFileSync(createDtoPath, isDtoCrlf ? normDto.replace(/\n/g, '\r\n') : normDto, 'utf8');
    console.log('Updated create-admin-shop-profile.dto.ts with orderCallEnabled');
  } else {
    console.error('Target deliveryEnabled not found in create-admin-shop-profile.dto.ts');
  }
} else {
  console.log('create-admin-shop-profile.dto.ts already has orderCallEnabled');
}
