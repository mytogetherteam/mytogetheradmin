const fs = require('fs');

const servicePath = 'd:/shop_api/src/modules/chat/shop/shop-chat.service.ts';
let content = fs.readFileSync(servicePath, 'utf8');

// Normalize line endings to \n for replace, then we will write
const normalized = content.replace(/\r\n/g, '\n');

const target = `  async sendMessage(
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

const replacement = `  async sendMessage(
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

if (normalized.includes(target)) {
  const result = normalized.replace(target, replacement);
  fs.writeFileSync(servicePath, result.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Successfully patched shop-chat.service.ts with CRLF');
} else {
  console.error('Target still not found in normalized content');
}
