import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from '../entity/invoice.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { InvoiceTodoService } from './invoice-todo.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoiceEmailService } from './invoice-email.service';

const APPROVAL_TRANSITIONS: Record<string, { next: string; requiredRole?: string }> = {
  NONE: { next: 'PENDING_REVIEW' },
  PENDING_REVIEW: { next: 'PENDING_APPROVAL' },
  PENDING_APPROVAL: { next: 'APPROVED_MANAGER', requiredRole: 'MANAGER' },
  APPROVED_MANAGER: { next: 'APPROVED_ADMIN', requiredRole: 'ADMIN' },
};

@Injectable()
export class InvoiceApprovalService {
  private readonly logger = new Logger(InvoiceApprovalService.name);

  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly todoService: InvoiceTodoService,
    private readonly pdfService: InvoicePdfService,
    private readonly emailService: InvoiceEmailService,
  ) {}

  /**
   * DRAFT → PENDING_REVIEW: Submit for review by the assigned reviewer
   */
  async submitForReview(invoiceId: string, entityId: string, userId: string) {
    const invoice = await this.getInvoice(invoiceId, entityId);

    if (invoice.invStatus !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can be submitted for review');
    }
    if (invoice.invApprovalStatus !== 'NONE') {
      throw new BadRequestException('Invoice is already in the approval process');
    }

    invoice.invApprovalStatus = 'PENDING_REVIEW';
    await this.invoiceRepo.save(invoice);

    // Create todo for assigned user (reviewer)
    const assignedUserId = invoice.contract?.ctrAssignedUserId;
    if (assignedUserId) {
      await this.todoService.createReviewTodo(invoice, assignedUserId);
    }

    return { approvalStatus: invoice.invApprovalStatus };
  }

  /**
   * PENDING_REVIEW → PENDING_APPROVAL: Reviewer approves and passes to manager
   */
  async approveReview(invoiceId: string, entityId: string, userId: string) {
    const invoice = await this.getInvoice(invoiceId, entityId);

    if (invoice.invApprovalStatus !== 'PENDING_REVIEW') {
      throw new BadRequestException('Invoice is not pending review');
    }

    invoice.invApprovalStatus = 'PENDING_APPROVAL';
    invoice.invReviewerId = userId;
    invoice.invReviewedAt = new Date();
    await this.invoiceRepo.save(invoice);

    // Create todo for MANAGER role users
    await this.todoService.createManagerApprovalTodo(invoice, entityId);

    return { approvalStatus: invoice.invApprovalStatus };
  }

  /**
   * PENDING_APPROVAL → APPROVED_MANAGER: Manager approves
   */
  async approveManager(invoiceId: string, entityId: string, userId: string) {
    const user = await this.getUser(userId);
    if (user.usrRole !== 'MANAGER' && user.usrRole !== 'ADMIN') {
      throw new BadRequestException('Only MANAGER or ADMIN can approve at this stage');
    }

    const invoice = await this.getInvoice(invoiceId, entityId);
    if (invoice.invApprovalStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Invoice is not pending manager approval');
    }

    invoice.invApprovalStatus = 'APPROVED_MANAGER';
    invoice.invApproverManagerId = userId;
    invoice.invApprovedManagerAt = new Date();
    await this.invoiceRepo.save(invoice);

    // Create todo for ADMIN role users
    await this.todoService.createAdminApprovalTodo(invoice, entityId);

    return { approvalStatus: invoice.invApprovalStatus };
  }

  /**
   * APPROVED_MANAGER → APPROVED_ADMIN: Final approval by admin/CEO
   * After approval: generate PDF with stamp/signature → save to Drive → email to partner → mark SENT
   */
  async approveAdmin(invoiceId: string, entityId: string, userId: string) {
    const user = await this.getUser(userId);
    if (user.usrRole !== 'ADMIN') {
      throw new BadRequestException('Only ADMIN can give final approval');
    }

    const invoice = await this.getInvoice(invoiceId, entityId);
    if (invoice.invApprovalStatus !== 'APPROVED_MANAGER') {
      throw new BadRequestException('Invoice is not pending admin approval');
    }

    invoice.invApprovalStatus = 'APPROVED_ADMIN';
    invoice.invApproverAdminId = userId;
    invoice.invApprovedAdminAt = new Date();
    invoice.invStatus = 'ISSUED';
    await this.invoiceRepo.save(invoice);

    // Post-approval automation (non-blocking: errors here should not fail the approval)
    this.postApprovalAutomation(invoiceId, entityId, userId, invoice).catch((err) => {
      this.logger.error(`Post-approval automation failed for invoice ${invoiceId}: ${err.message}`, err.stack);
    });

    return { approvalStatus: invoice.invApprovalStatus, status: invoice.invStatus };
  }

  /**
   * Post-approval automation:
   * 1. Generate PDF with stamp + signature
   * 2. Save PDF to Google Drive
   * 3. Send email to partner contact
   * 4. Update status to SENT
   * 5. Create "sent" todo for assigned user
   */
  private async postApprovalAutomation(
    invoiceId: string,
    entityId: string,
    approverId: string,
    invoice: InvoiceEntity,
  ) {
    // 1. Generate PDF (stamp + signature included because status is APPROVED_ADMIN)
    const { buffer, filename, partnerId } = await this.pdfService.generatePdf(invoiceId, entityId);

    // 2. Save to Google Drive
    if (partnerId) {
      try {
        await this.pdfService.saveToDrive(invoiceId, entityId, partnerId, buffer, filename, approverId);
        this.logger.log(`Invoice ${invoiceId} PDF saved to Drive`);
      } catch (err) {
        this.logger.warn(`Failed to save invoice ${invoiceId} PDF to Drive: ${err.message}`);
      }
    }

    // 3. Send email to partner contact
    const contactEmail = invoice.partner?.ptnContactEmail;
    if (contactEmail) {
      try {
        await this.emailService.sendInvoiceEmail(invoiceId, entityId, {
          to: [contactEmail],
          subject: '',
          body: '',
        });
        this.logger.log(`Invoice ${invoiceId} email sent to ${contactEmail}`);
      } catch (err) {
        this.logger.warn(`Failed to send invoice ${invoiceId} email to ${contactEmail}: ${err.message}`);
        // Even if email fails, don't revert - the invoice is still approved
        // The user can manually re-send from the UI
      }
    }

    // 4. Update status to SENT (emailService already does this if invStatus was ISSUED,
    //    but handle case where email was skipped)
    if (!contactEmail) {
      // No email to send, but status should stay as ISSUED
      this.logger.log(`Invoice ${invoiceId} has no partner contact email, staying as ISSUED`);
    }

    // 5. Create "sent" notification todo for assigned user
    const assignedUserId = invoice.contract?.ctrAssignedUserId;
    if (assignedUserId) {
      await this.todoService.createSentNotificationTodo(invoice, assignedUserId);
    }
  }

  /**
   * Any approval stage → REJECTED
   */
  async reject(invoiceId: string, entityId: string, userId: string, reason: string) {
    const invoice = await this.getInvoice(invoiceId, entityId);

    const rejectableStatuses = ['PENDING_REVIEW', 'PENDING_APPROVAL', 'APPROVED_MANAGER'];
    if (!rejectableStatuses.includes(invoice.invApprovalStatus)) {
      throw new BadRequestException('Invoice cannot be rejected at this stage');
    }

    invoice.invApprovalStatus = 'REJECTED';
    invoice.invRejectionReason = reason;
    await this.invoiceRepo.save(invoice);

    // Notify assigned user about rejection
    const assignedUserId = invoice.contract?.ctrAssignedUserId;
    if (assignedUserId) {
      await this.todoService.createRejectionTodo(invoice, assignedUserId, reason);
    }

    return { approvalStatus: invoice.invApprovalStatus };
  }

  private async getInvoice(invoiceId: string, entityId: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['partner', 'contract'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async getUser(userId: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { usrId: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
