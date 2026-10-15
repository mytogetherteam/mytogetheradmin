const fs = require('fs');

// 1. Update twilio.service.ts
const twilioServicePath = 'd:/shop_api/src/modules/twilio/twilio.service.ts';
const newTwilioService = `import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TwilioService implements OnModuleInit {
  private readonly logger = new Logger('TwilioService');
  private client: Twilio | null = null;
  private fromNumber: string | null = null;
  private audioUrl: string | null = null;
  private flowSid: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER') || null;
    this.audioUrl = this.config.get<string>('TWILIO_ALERT_AUDIO_URL') || null;
    this.flowSid = this.config.get<string>('TWILIO_FLOW_SID') || null;

    if (!accountSid || !authToken || !this.fromNumber) {
      this.logger.warn('Twilio credentials missing. Automated voice calls are DISABLED.');
      return;
    }

    this.client = new Twilio(accountSid, authToken);
    this.logger.log(\`Twilio initialized. From number: \${this.fromNumber}\`);
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  /**
   * Get or initialize platform-wide Twilio config.
   */
  async getOrCreateConfig() {
    try {
      const existing = await (this.prisma as any).twilioConfig.findFirst({
        orderBy: { id: 'asc' },
      });
      if (existing) return existing;
      return await (this.prisma as any).twilioConfig.create({
        data: { id: 1, orderCallEnabled: true },
      });
    } catch (error) {
      this.logger.warn(\`Could not read twilio_config table: \${error}\`);
      return {
        id: 1,
        orderCallEnabled: true,
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Checks if automated order calls are globally enabled.
   */
  async isOrderCallEnabled(): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const config = await this.getOrCreateConfig();
      return Boolean(config.orderCallEnabled);
    } catch {
      return true;
    }
  }

  /**
   * Update platform-wide automated order call switch.
   */
  async updateConfig(orderCallEnabled: boolean) {
    try {
      const existing = await (this.prisma as any).twilioConfig.findFirst({
        orderBy: { id: 'asc' },
      });
      if (existing) {
        return await (this.prisma as any).twilioConfig.update({
          where: { id: existing.id },
          data: { orderCallEnabled },
        });
      }
      return await (this.prisma as any).twilioConfig.create({
        data: { id: 1, orderCallEnabled },
      });
    } catch (error) {
      this.logger.error(\`Failed to update twilio_config: \${error}\`);
      throw error;
    }
  }

  /**
   * Status details for Admin dashboard
   */
  async getStatusInfo() {
    const config = await this.getOrCreateConfig();
    return {
      orderCallEnabled: config.orderCallEnabled,
      isConfigured: this.enabled,
      fromNumber: this.fromNumber,
      hasStudioFlow: Boolean(this.flowSid),
      hasAlertAudio: Boolean(this.audioUrl),
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Calls the given phone number using a Studio Flow (preferred) or basic TwiML.
   */
  async callShop(phone: string) {
    if (!this.client || !this.fromNumber) return;

    if (!phone) {
      this.logger.warn('Twilio call skipped: Shop phone number is missing.');
      return;
    }

    // If multiple phone numbers are provided (comma-separated), use the first one
    let primaryPhone = phone.split(',')[0].trim();

    if (!primaryPhone) {
      this.logger.warn('Twilio call skipped: Primary phone number is empty.');
      return;
    }

    // Format local Thai numbers (e.g., 0818031341) to international E.164 (+66818031341)
    if (primaryPhone.startsWith('0')) {
      primaryPhone = '+66' + primaryPhone.substring(1);
    } else if (!primaryPhone.startsWith('+')) {
      primaryPhone = '+66' + primaryPhone;
    }

    try {
      if (this.flowSid) {
        // Trigger the Twilio Studio Flow directly
        await this.client.studio.v2.flows(this.flowSid).executions.create({
          to: primaryPhone,
          from: this.fromNumber,
        });
        this.logger.log(\`Initiated Twilio Studio Flow to shop phone: \${primaryPhone}\`);
      } else {
        // Fallback to basic TwiML
        let twiml = '';
        if (this.audioUrl) {
          twiml = \`<Response><Play>\${this.audioUrl}</Play></Response>\`;
        } else {
          twiml = \`<Response><Say language="en-US">You have a new order. Please check the application.</Say></Response>\`;
        }

        await this.client.calls.create({
          twiml,
          to: primaryPhone,
          from: this.fromNumber,
        });
        this.logger.log(\`Initiated Twilio basic call to shop phone: \${primaryPhone}\`);
      }
    } catch (error) {
      this.logger.error(\`Twilio Call Failed to \${primaryPhone}: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }
}
`;
fs.writeFileSync(twilioServicePath, newTwilioService, 'utf8');
console.log('Updated twilio.service.ts');

// 2. Create admin-twilio.controller.ts
const adminTwilioControllerPath = 'd:/shop_api/src/modules/twilio/admin-twilio.controller.ts';
const adminTwilioControllerContent = `import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/admin/super-admin.guard';
import { ApiResponse } from '../../common/http/api-response';
import { TwilioService } from './twilio.service';
import { IsBoolean } from 'class-validator';

export class UpdateTwilioConfigDto {
  @ApiProperty({ description: 'Enable or disable automated voice calls for new orders platform-wide' })
  @IsBoolean()
  orderCallEnabled: boolean;
}

@ApiTags('admin-twilio')
@ApiBearerAuth()
@Controller('admin/twilio')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminTwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get Twilio automated order call status and configuration' })
  async getConfig() {
    const info = await this.twilioService.getStatusInfo();
    return ApiResponse.success(info, 'Twilio configuration retrieved.');
  }

  @Put('config')
  @ApiOperation({ summary: 'Toggle automated order phone calls on/off platform-wide' })
  async updateConfig(@Body() dto: UpdateTwilioConfigDto) {
    await this.twilioService.updateConfig(dto.orderCallEnabled);
    const updated = await this.twilioService.getStatusInfo();
    return ApiResponse.success(updated, 'Twilio configuration updated.');
  }
}
`;
fs.writeFileSync(adminTwilioControllerPath, adminTwilioControllerContent, 'utf8');
console.log('Created admin-twilio.controller.ts');

// 3. Update twilio.module.ts
const twilioModulePath = 'd:/shop_api/src/modules/twilio/twilio.module.ts';
const twilioModuleContent = `import { Module, Global } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { AdminTwilioController } from './admin-twilio.controller';

@Global()
@Module({
  controllers: [AdminTwilioController],
  providers: [TwilioService],
  exports: [TwilioService],
})
export class TwilioModule {}
`;
fs.writeFileSync(twilioModulePath, twilioModuleContent, 'utf8');
console.log('Updated twilio.module.ts');
