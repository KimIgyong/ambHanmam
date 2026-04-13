import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { SvcClientEntity } from '../../../shared-entities/client.entity';
import { SvcPlanEntity } from '../../../shared-entities/service-plan.entity';
import { SvcSubscriptionEntity } from '../../../shared-entities/subscription.entity';
import { SvcSubscriptionHistoryEntity } from '../../../shared-entities/subscription-history.entity';
import { PortalCustomerEntity } from '../../auth/entity/portal-customer.entity';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepo: Repository<SvcClientEntity>,
    @InjectRepository(SvcPlanEntity)
    private readonly planRepo: Repository<SvcPlanEntity>,
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SvcSubscriptionEntity>,
    @InjectRepository(SvcSubscriptionHistoryEntity)
    private readonly historyRepo: Repository<SvcSubscriptionHistoryEntity>,
    @InjectRepository(PortalCustomerEntity)
    private readonly customerRepo: Repository<PortalCustomerEntity>,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
      });
    } else {
      this.stripe = null;
      this.logger.warn('STRIPE_SECRET_KEY not configured — Stripe features disabled');
    }
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  private ensureStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  /**
   * Create or retrieve Stripe customer for a portal customer
   */
  async getOrCreateStripeCustomer(customerId: string): Promise<string> {
    const customer = await this.customerRepo.findOne({ where: { pctId: customerId } });
    if (!customer) throw new BadRequestException('Customer not found');

    // Already has Stripe customer
    if (customer.pctStripeCustomerId) {
      return customer.pctStripeCustomerId;
    }

    // Create Stripe customer
    const stripeCustomer = await this.ensureStripe().customers.create({
      email: customer.pctEmail,
      name: customer.pctName,
      metadata: {
        portalCustomerId: customer.pctId,
        clientId: customer.pctCliId || '',
      },
    });

    // Save Stripe customer ID
    customer.pctStripeCustomerId = stripeCustomer.id;
    await this.customerRepo.save(customer);

    // Also update client record
    if (customer.pctCliId) {
      await this.clientRepo.update(customer.pctCliId, {
        cliStripeCustomerId: stripeCustomer.id,
      });
    }

    return stripeCustomer.id;
  }

  /**
   * Create a Checkout Session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'ANNUAL',
  ): Promise<{ sessionId: string; url: string }> {
    const plan = await this.planRepo.findOne({ where: { splId: planId } });
    if (!plan) throw new BadRequestException('Plan not found');

    const stripePriceId =
      billingCycle === 'ANNUAL'
        ? plan.splStripePriceAnnualId
        : plan.splStripePriceMonthlyId;

    if (!stripePriceId) {
      throw new BadRequestException('Stripe price not configured for this plan');
    }

    const stripeCustomerId = await this.getOrCreateStripeCustomer(customerId);
    const portalUrl = this.configService.get<string>('PORTAL_URL', 'http://localhost:5190');

    const session = await this.ensureStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${portalUrl}/portal/subscriptions?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${portalUrl}/pricing?checkout=cancelled`,
      subscription_data: {
        trial_period_days: plan.splTrialDays || undefined,
        metadata: {
          portalCustomerId: customerId,
          planId: plan.splId,
        },
      },
      metadata: {
        portalCustomerId: customerId,
        planId: plan.splId,
      },
    });

    return { sessionId: session.id, url: session.url! };
  }

  /**
   * Create Stripe billing portal session
   */
  async createBillingPortalSession(customerId: string): Promise<{ url: string }> {
    const stripeCustomerId = await this.getOrCreateStripeCustomer(customerId);
    const portalUrl = this.configService.get<string>('PORTAL_URL', 'http://localhost:5190');

    const session = await this.ensureStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${portalUrl}/portal/billing`,
    });

    return { url: session.url };
  }

  /**
   * Verify and construct webhook event
   */
  constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    return this.ensureStripe().webhooks.constructEvent(body, signature, this.webhookSecret);
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const customerId = session.metadata?.portalCustomerId;
    const planId = session.metadata?.planId;
    if (!customerId || !planId) return;

    this.logger.log(`Checkout completed for customer ${customerId}, plan ${planId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.metadata?.portalCustomerId;
    const planId = subscription.metadata?.planId;
    if (!customerId) return;

    // Find or create subscription record
    let sub = await this.subscriptionRepo.findOne({
      where: { subStripeSubscriptionId: subscription.id },
    });

    const customer = await this.customerRepo.findOne({ where: { pctId: customerId } });
    if (!customer?.pctCliId) return;

    const status = this.mapStripeStatus(subscription.status);

    if (!sub) {
      sub = new SvcSubscriptionEntity();
      sub.cliId = customer.pctCliId!;
      sub.svcId = ''; // Will be resolved from plan
      sub.splId = planId || '';
      sub.subStripeSubscriptionId = subscription.id;
      const periodStart = (subscription as any).current_period_start;
      sub.subStartDate = periodStart
        ? new Date(periodStart * 1000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      // Resolve svcId from plan
      if (planId) {
        const plan = await this.planRepo.findOne({ where: { splId: planId } });
        if (plan) sub.svcId = plan.svcId;
      }
    }

    sub.subStatus = status;
    sub.subStripePriceId = subscription.items.data[0]?.price?.id;
    const cpStart = (subscription as any).current_period_start;
    const cpEnd = (subscription as any).current_period_end;
    if (cpStart) sub.subCurrentPeriodStart = new Date(cpStart * 1000);
    if (cpEnd) sub.subCurrentPeriodEnd = new Date(cpEnd * 1000);
    sub.subCancelAtPeriodEnd = subscription.cancel_at_period_end;

    if (subscription.status === 'canceled') {
      sub.subEndDate = new Date().toISOString().split('T')[0];
    }

    await this.subscriptionRepo.save(sub);

    // Record history
    const history = new SvcSubscriptionHistoryEntity();
    history.subId = sub.subId;
    history.sbhAction = `STRIPE_${subscription.status.toUpperCase()}`;
    history.sbhNote = `Stripe subscription ${subscription.id} - ${subscription.status}`;
    await this.historyRepo.save(history);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const sub = await this.subscriptionRepo.findOne({
      where: { subStripeSubscriptionId: subscription.id },
    });
    if (!sub) return;

    sub.subStatus = 'CANCELLED';
    sub.subEndDate = new Date().toISOString().split('T')[0];
    await this.subscriptionRepo.save(sub);

    const history = new SvcSubscriptionHistoryEntity();
    history.subId = sub.subId;
    history.sbhAction = 'STRIPE_CANCELLED';
    history.sbhNote = `Stripe subscription ${subscription.id} deleted`;
    await this.historyRepo.save(history);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice paid: ${invoice.id}, amount: ${invoice.amount_paid}`);
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.warn(`Invoice payment failed: ${invoice.id}`);

    // Suspend subscription if payment fails
    const subField = (invoice as any).subscription;
    const stripeSubId = typeof subField === 'string'
      ? subField
      : subField?.id;
    if (!stripeSubId) return;

    const sub = await this.subscriptionRepo.findOne({
      where: { subStripeSubscriptionId: stripeSubId },
    });
    if (sub && sub.subStatus === 'ACTIVE') {
      sub.subStatus = 'SUSPENDED';
      await this.subscriptionRepo.save(sub);
    }
  }

  private mapStripeStatus(stripeStatus: string): string {
    switch (stripeStatus) {
      case 'trialing': return 'TRIAL';
      case 'active': return 'ACTIVE';
      case 'past_due': return 'SUSPENDED';
      case 'canceled': return 'CANCELLED';
      case 'unpaid': return 'SUSPENDED';
      case 'incomplete': return 'PENDING';
      case 'incomplete_expired': return 'EXPIRED';
      default: return 'PENDING';
    }
  }
}
