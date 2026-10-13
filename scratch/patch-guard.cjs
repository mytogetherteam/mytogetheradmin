const fs = require('fs');
const guardPath = 'd:/shop_api/src/modules/auth/guards/admin/combine-roles.guard.ts';
let content = fs.readFileSync(guardPath, 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

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

if (normalized.includes(target)) {
  const result = normalized.replace(target, replacement);
  fs.writeFileSync(guardPath, result.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Successfully patched combine-roles.guard.ts with CRLF');
} else {
  console.error('Target not found in combine-roles.guard.ts');
}
