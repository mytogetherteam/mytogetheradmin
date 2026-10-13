const fs = require('fs');

const controllerPath = 'd:/shop_api/src/modules/chat/shop/shop-chat.controller.ts';
let content = fs.readFileSync(controllerPath, 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

// Import ChatSenderType
let result = normalized.replace(
  `import { AdminRoleName } from '@prisma/client';`,
  `import { AdminRoleName, ChatSenderType } from '@prisma/client';`
);

const sendTarget = `  async sendMessage(
    @ShopId() shopId: number,
    @Request() req: { user: { id: number } },
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: SendChatMessageDto,
    @UploadedFiles(chatAttachmentParsePipe)
    attachments?: Express.Multer.File[],
  ) {
    return this.shopChatService.sendMessage(
      shopId,
      req.user.id,
      orderId,
      dto,
      attachments ?? [],
    );
  }`;

const sendReplacement = `  async sendMessage(
    @ShopId() shopId: number,
    @Request() req: { user: { id: number; role?: string } },
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: SendChatMessageDto,
    @UploadedFiles(chatAttachmentParsePipe)
    attachments?: Express.Multer.File[],
  ) {
    const isSuperAdmin = (req.user as any)?.role === AdminRoleName.SuperAdmin;
    return this.shopChatService.sendMessage(
      shopId,
      req.user.id,
      orderId,
      dto,
      attachments ?? [],
      isSuperAdmin ? ChatSenderType.SYSTEM : ChatSenderType.SHOP,
    );
  }`;

if (result.includes(sendTarget)) {
  result = result.replace(sendTarget, sendReplacement);
  fs.writeFileSync(controllerPath, result.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Successfully patched shop-chat.controller.ts sendMessage');
} else {
  console.error('sendTarget not found');
}
