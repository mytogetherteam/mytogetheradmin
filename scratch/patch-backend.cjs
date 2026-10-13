const fs = require('fs');

// 1. Patch combine-roles.guard.ts
const guardPath = 'd:/shop_api/src/modules/auth/guards/admin/combine-roles.guard.ts';
let guardContent = fs.readFileSync(guardPath, 'utf8');

if (!guardContent.includes('// SuperAdmin has platform-wide access')) {
  const target = `    if (!user) {
      throw new ForbiddenException('Authentication required');
    }`;

  const replacement = `    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // SuperAdmin has platform-wide access
    if (user.role === AdminRoleName.SuperAdmin) {
      const rawShopId = request.headers['x-shop-id'];
      if (rawShopId) {
        (request as any).shopId = parseInt(rawShopId as string);
      }
      return true;
    }`;

  guardContent = guardContent.replace(target, replacement);
  fs.writeFileSync(guardPath, guardContent, 'utf8');
  console.log('Successfully patched combine-roles.guard.ts');
} else {
  console.log('combine-roles.guard.ts already patched');
}

// 2. Patch shop-chat.controller.ts
const controllerPath = 'd:/shop_api/src/modules/chat/shop/shop-chat.controller.ts';
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

controllerContent = controllerContent.replace(
  `@Roles(AdminRoleName.OperationAdmin, AdminRoleName.ShopAdmin)`,
  `@Roles(AdminRoleName.SuperAdmin, AdminRoleName.OperationAdmin, AdminRoleName.ShopAdmin)`
);

const sendTarget = `    @UploadedFiles(chatAttachmentParsePipe)
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

const sendReplacement = `    @UploadedFiles(chatAttachmentParsePipe)
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

if (controllerContent.includes(sendTarget)) {
  controllerContent = controllerContent.replace(sendTarget, sendReplacement);
}
fs.writeFileSync(controllerPath, controllerContent, 'utf8');
console.log('Successfully patched shop-chat.controller.ts');

// 3. Patch shop-chat.service.ts
const servicePath = 'd:/shop_api/src/modules/chat/shop/shop-chat.service.ts';
let serviceContent = fs.readFileSync(servicePath, 'utf8');

const serviceTarget = `  async sendMessage(
    shopId: number,
    adminId: number,
    orderId: number,
    dto: SendChatMessageDto,
    files: Express.Multer.File[],
  ) {
    const order = await this.ensureOrderWritable(shopId, orderId);
    const attachments = await storeChatAttachments(files, dto.durations);
    const type = resolveChatMessageType({
      requestedType: dto.type,
      content: dto.content,
      attachments,
    });
    validateSendAttachments(type, attachments);

    const { message, conversation } = await this.repository.sendMessage({
      orderId,
      userId: order.userId,
      shopId: order.shopId!,
      senderType: ChatSenderType.SHOP,
      senderAdminId: adminId,
      type,
      content: dto.content?.trim() || null,
      attachments,
    });

    this.chatEvents.sendChatMessageToUser(conversation.userId, {
      conversationId: conversation.id,
      orderId,
      message,
      userUnreadCount: conversation.userUnreadCount,
    });

    await this.notifyUserOfNewMessage(conversation, message);

    return ApiResponse.created(message, 'Message sent.');
  }`;

const serviceReplacement = `  async sendMessage(
    shopId: number,
    adminId: number,
    orderId: number,
    dto: SendChatMessageDto,
    files: Express.Multer.File[],
    senderType: ChatSenderType = ChatSenderType.SHOP,
  ) {
    const order = await this.ensureOrderWritable(shopId, orderId);
    const attachments = await storeChatAttachments(files, dto.durations);
    const type = resolveChatMessageType({
      requestedType: dto.type,
      content: dto.content,
      attachments,
    });
    validateSendAttachments(type, attachments);

    const { message, conversation } = await this.repository.sendMessage({
      orderId,
      userId: order.userId,
      shopId: order.shopId!,
      senderType,
      senderAdminId: adminId,
      type,
      content: dto.content?.trim() || null,
      attachments,
    });

    this.chatEvents.sendChatMessageToUser(conversation.userId, {
      conversationId: conversation.id,
      orderId,
      message,
      userUnreadCount: conversation.userUnreadCount,
    });

    this.chatEvents.sendChatMessageToShop(conversation.shopId, {
      conversationId: conversation.id,
      orderId,
      message,
      shopUnreadCount: conversation.shopUnreadCount,
    });

    await this.notifyUserOfNewMessage(conversation, message);

    return ApiResponse.created(message, 'Message sent.');
  }`;

if (serviceContent.includes(serviceTarget)) {
  serviceContent = serviceContent.replace(serviceTarget, serviceReplacement);
  fs.writeFileSync(servicePath, serviceContent, 'utf8');
  console.log('Successfully patched shop-chat.service.ts');
} else {
  console.log('serviceTarget did not match directly, let us check diff');
}
