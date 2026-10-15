const fs = require('fs');
const path = require('path');

// 1. Create twilio.prisma
const twilioPrismaPath = 'd:/shop_api/prisma/models/twilio.prisma';
const twilioPrismaContent = `/// Platform-wide Twilio automated voice call configuration (singleton row, id=1).
model TwilioConfig {
  id               Int      @id @default(1)
  orderCallEnabled Boolean  @default(true)
  updatedAt        DateTime @updatedAt

  @@map("twilio_config")
}
`;
fs.writeFileSync(twilioPrismaPath, twilioPrismaContent, 'utf8');
console.log('Created twilio.prisma successfully');

// 2. Add orderCallEnabled to shop.prisma
const shopPrismaPath = 'd:/shop_api/prisma/models/shop.prisma';
let shopContent = fs.readFileSync(shopPrismaPath, 'utf8');
if (!shopContent.includes('orderCallEnabled')) {
  const target = '  deliveryEnabled  Boolean          @default(true)';
  const replacement = `  deliveryEnabled  Boolean          @default(true)\n  orderCallEnabled Boolean          @default(true)`;
  if (shopContent.includes(target)) {
    shopContent = shopContent.replace(target, replacement);
    fs.writeFileSync(shopPrismaPath, shopContent, 'utf8');
    console.log('Updated shop.prisma with orderCallEnabled');
  } else {
    console.error('Target deliveryEnabled not found in shop.prisma');
  }
} else {
  console.log('shop.prisma already has orderCallEnabled');
}
