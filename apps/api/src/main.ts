import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { TransformInterceptor } from './global/interceptor/transform.interceptor';
import { TimezoneInterceptor } from './global/interceptor/timezone.interceptor';
import { HttpExceptionFilter } from './global/filter/http-exception.filter';
import { BusinessExceptionFilter } from './global/filter/business-exception.filter';
import { SiteErrorService } from './domain/admin/service/site-error.service';
import { AuditContextInterceptor } from './global/interceptor/audit-context.interceptor';
import { REQUEST_CONTEXT } from './global/constant/request-context';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  // Slack webhook: capture raw body for signature verification
  app.use('/api/v1/webhooks/slack', (req: any, res: any, next: any) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => { chunks.push(chunk); });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      req.rawBody = raw;
      req.body = raw ? JSON.parse(raw) : {};
      next();
    });
  });

  // Polar webhook: capture raw body for HMAC-SHA256 signature verification
  app.use('/api/v1/webhooks/polar', (req: any, res: any, next: any) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => { chunks.push(chunk); });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      req.rawBody = raw;
      req.body = raw ? JSON.parse(raw) : {};
      next();
    });
  });

  // Body parser with increased limit for file uploads
  // Skip webhook paths that handle their own body parsing
  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/v1/webhooks/slack')) return next();
    if (req.path.startsWith('/api/v1/webhooks/polar')) return next();
    json({ limit: '50mb' })(req, res, next);
  });
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // Request context for audit logging (AsyncLocalStorage)
  app.use((req: any, _res: any, next: any) => {
    const store: { userId?: string; ip?: string } = { ip: req.ip };
    // JWT가 검증된 후 req.user가 설정되므로, userId는 lazy하게 접근
    // Guard 이후 Interceptor에서 설정하는 방식 대신, subscriber에서 직접 접근
    REQUEST_CONTEXT.run(store, () => next());
  });

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:5189').split(','),
    credentials: true,
  });

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Global interceptors & filters
  app.useGlobalInterceptors(new AuditContextInterceptor(), new TransformInterceptor(), new TimezoneInterceptor());
  const siteErrorService = app.get(SiteErrorService);
  app.useGlobalFilters(
    new HttpExceptionFilter(siteErrorService),
    new BusinessExceptionFilter(siteErrorService),
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  if (configService.get<string>('SWAGGER_ENABLED') === 'true') {
    const config = new DocumentBuilder()
      .setTitle('AMB Management API')
      .setDescription('Corporate AI Agent System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = configService.get<number>('API_PORT', 3019);
  await app.listen(port);
  console.warn(`Application running on port ${port}`);
}

bootstrap();
