import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortalCustomerEntity } from '../entity/portal-customer.entity';

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(Strategy, 'portal-jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(PortalCustomerEntity)
    private readonly customerRepo: Repository<PortalCustomerEntity>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; type: string }) {
    if (payload.type !== 'portal') {
      throw new UnauthorizedException('Invalid token type');
    }

    const customer = await this.customerRepo.findOne({
      where: { pctId: payload.sub },
    });

    if (!customer || customer.pctStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Customer not found or inactive');
    }

    return {
      customerId: customer.pctId,
      email: customer.pctEmail,
      name: customer.pctName,
      clientId: customer.pctCliId,
      emailVerified: customer.pctEmailVerified,
    };
  }
}
