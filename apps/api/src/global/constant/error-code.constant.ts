export const ERROR_CODE = {
  // E1xxx: Authentication/Authorization
  UNAUTHORIZED: { code: 'E1001', message: 'Authentication required.' },
  INVALID_CREDENTIALS: { code: 'E1002', message: 'Invalid email or password.' },
  TOKEN_EXPIRED: { code: 'E1003', message: 'Token has expired.' },
  INVALID_TOKEN: { code: 'E1004', message: 'Invalid token.' },
  FORBIDDEN: { code: 'E1005', message: 'Access denied.' },

  // E2xxx: User
  USER_NOT_FOUND: { code: 'E2001', message: 'User not found.' },
  USER_ALREADY_EXISTS: { code: 'E2002', message: 'Email already registered.' },

  // E3xxx: Conversation
  CONVERSATION_NOT_FOUND: { code: 'E3001', message: 'Conversation not found.' },
  CONVERSATION_ACCESS_DENIED: { code: 'E3002', message: 'Access denied to this conversation.' },

  // E4xxx: Agent
  AGENT_NOT_FOUND: { code: 'E4001', message: 'Agent not found.' },
  INVALID_DEPARTMENT: { code: 'E4002', message: 'Invalid department code.' },

  INSUFFICIENT_ROLE: { code: 'E1006', message: 'Insufficient role permissions.' },
  RESET_TOKEN_EXPIRED: { code: 'E1007', message: 'Password reset token has expired.' },
  RESET_TOKEN_INVALID: { code: 'E1008', message: 'Invalid or already used reset token.' },
  CURRENT_PASSWORD_WRONG: { code: 'E1009', message: 'Current password is incorrect.' },
  ACCOUNT_PENDING: { code: 'E1010', message: 'Account is pending approval.' },
  MUST_CHANGE_PASSWORD: { code: 'E1011', message: 'Password change required.' },
  INSUFFICIENT_LEVEL: { code: 'E1012', message: 'Insufficient user level.' },
  INSUFFICIENT_ROLE_FOR_ENTITY: { code: 'E1013', message: 'Insufficient role for entity access.' },
  EMAIL_NOT_FOUND: { code: 'E1014', message: 'Email not registered.' },
  PASSWORD_INCORRECT: { code: 'E1015', message: 'Incorrect password.' },
  ACCOUNT_LOCKED: { code: 'E1020', message: 'Account is temporarily locked due to too many failed login attempts.' },

  // E5xxx: Settings/API Key
  API_KEY_NOT_FOUND: { code: 'E5001', message: 'API key not found.' },
  API_KEY_ALREADY_EXISTS: { code: 'E5002', message: 'An active API key already exists for this provider.' },
  API_KEY_DECRYPT_FAILED: { code: 'E5003', message: 'Failed to decrypt API key.' },
  API_KEY_TEST_FAILED: { code: 'E5004', message: 'API connection test failed.' },

  // E6xxx: Invitation
  INVITATION_NOT_FOUND: { code: 'E6001', message: 'Invitation not found.' },
  INVITATION_EXPIRED: { code: 'E6002', message: 'Invitation has expired.' },
  INVITATION_ALREADY_ACCEPTED: { code: 'E6003', message: 'Invitation has already been accepted.' },
  INVITATION_EMAIL_MISMATCH: { code: 'E6004', message: 'Email does not match invitation.' },
  INVITATION_SEND_FAILED: { code: 'E6005', message: 'Failed to send invitation email.' },
  INVITATION_ALREADY_SENT: { code: 'E6006', message: 'An active invitation already exists for this email.' },
  INVITATION_CANCELLED: { code: 'E6007', message: 'Invitation has been cancelled.' },

  // E7xxx: Group
  GROUP_NOT_FOUND: { code: 'E7001', message: 'Group not found.' },
  GROUP_ALREADY_EXISTS: { code: 'E7002', message: 'Group name already exists.' },
  GROUP_MEMBER_ALREADY_EXISTS: { code: 'E7003', message: 'User is already a member of this group.' },
  GROUP_MEMBER_NOT_FOUND: { code: 'E7004', message: 'User is not a member of this group.' },

  // E8xxx: Settings (SMTP / Menu Permission)
  SMTP_SETTINGS_NOT_FOUND: { code: 'E8001', message: 'SMTP settings not found.' },
  SMTP_TEST_FAILED: { code: 'E8002', message: 'SMTP connection test failed.' },
  MENU_PERMISSION_NOT_FOUND: { code: 'E8003', message: 'Menu permission not found.' },

  // E10xxx: Todo
  TODO_NOT_FOUND: { code: 'E10001', message: 'Todo not found.' },
  TODO_ACCESS_DENIED: { code: 'E10002', message: 'Access denied to this todo.' },
  TODO_COMMENT_NOT_FOUND: { code: 'E10003', message: 'Todo comment not found.' },
  TODO_SAME_DEPARTMENT_REQUIRED: { code: 'E10004', message: 'Same department required.' },
  TODO_CANNOT_COMMENT_OWN: { code: 'E10005', message: 'Cannot comment on your own todo.' },

  // E11xxx: Meeting Notes
  MEETING_NOTE_NOT_FOUND: { code: 'E11001', message: 'Meeting note not found.' },
  MEETING_NOTE_ACCESS_DENIED: { code: 'E11002', message: 'Access denied to this meeting note.' },

  // E12xxx: Attendance
  ATTENDANCE_NOT_FOUND: { code: 'E12001', message: 'Attendance record not found.' },
  ATTENDANCE_ACCESS_DENIED: { code: 'E12002', message: 'Access denied to this attendance record.' },
  ATTENDANCE_DUPLICATE_DATE: { code: 'E12003', message: 'An attendance record already exists for this date.' },
  ATTENDANCE_INVALID_DATE_RANGE: { code: 'E12004', message: 'Attendance date must be between next week and one month from now.' },
  ATTENDANCE_REMOTE_LIMIT_EXCEEDED: { code: 'E12005', message: 'Remote work is limited to once per month.' },
  ATTENDANCE_WEEKEND_NOT_ALLOWED: { code: 'E12006', message: 'Cannot register attendance on weekends.' },
  ATTENDANCE_AMENDMENT_PERMISSION_DENIED: { code: 'E12007', message: 'Only MASTER or MANAGER can amend attendance.' },
  ATTENDANCE_AMENDMENT_NOTE_REQUIRED: { code: 'E12008', message: 'Note is required for attendance amendment.' },

  // E13xxx: Notices
  NOTICE_NOT_FOUND: { code: 'E13001', message: 'Notice not found.' },
  NOTICE_ACCESS_DENIED: { code: 'E13002', message: 'Access denied to this notice.' },
  NOTICE_FILE_TOO_LARGE: { code: 'E13003', message: 'File size exceeds the maximum limit.' },
  NOTICE_FILE_TYPE_NOT_ALLOWED: { code: 'E13004', message: 'File type is not allowed.' },

  // E14xxx: Drive
  DRIVE_FOLDER_NOT_FOUND: { code: 'E14001', message: 'Drive folder registration not found.' },
  DRIVE_FILE_NOT_FOUND: { code: 'E14002', message: 'File not found in Google Drive.' },
  DRIVE_API_ERROR: { code: 'E14003', message: 'Google Drive API error.' },
  DRIVE_NOT_CONFIGURED: { code: 'E14004', message: 'Google Drive is not configured.' },
  DRIVE_FOLDER_ALREADY_EXISTS: { code: 'E14005', message: 'This folder is already registered.' },

  // E15xxx: Accounting
  ACCOUNT_NOT_FOUND: { code: 'E15001', message: 'Bank account not found.' },
  ACCOUNT_NUMBER_DUPLICATE: { code: 'E15002', message: 'This account number already exists.' },
  TRANSACTION_NOT_FOUND: { code: 'E15003', message: 'Transaction not found.' },
  EXCEL_PARSE_ERROR: { code: 'E15004', message: 'Failed to parse Excel file.' },
  EXCEL_INVALID_FORMAT: { code: 'E15005', message: 'Invalid Excel file format.' },

  // E16xxx: HR
  HR_EMPLOYEE_NOT_FOUND: { code: 'E16001', message: 'Employee not found.' },
  HR_EMPLOYEE_DUPLICATE_CCCD: { code: 'E16002', message: 'Duplicate CCCD number.' },
  HR_EMPLOYEE_DUPLICATE_CODE: { code: 'E16003', message: 'Duplicate employee code.' },
  HR_DEPENDENT_NOT_FOUND: { code: 'E16004', message: 'Dependent not found.' },
  HR_SALARY_NOT_FOUND: { code: 'E16005', message: 'Salary history not found.' },
  HR_TIMESHEET_LOCKED: { code: 'E16006', message: 'Timesheet is locked for this period.' },
  HR_OT_RECORD_NOT_FOUND: { code: 'E16007', message: 'OT record not found.' },
  HR_PAYROLL_PERIOD_EXISTS: { code: 'E16008', message: 'Payroll period already exists.' },
  HR_PAYROLL_NOT_FOUND: { code: 'E16009', message: 'Payroll period not found.' },
  HR_PAYROLL_ALREADY_FINAL: { code: 'E16010', message: 'Payroll is already finalized.' },
  HR_PAYROLL_INVALID_STATUS: { code: 'E16011', message: 'Invalid payroll status transition.' },
  HR_PAYROLL_CALC_ERROR: { code: 'E16012', message: 'Payroll calculation error.' },
  HR_PARAM_NOT_FOUND: { code: 'E16013', message: 'System parameter not found.' },
  HR_INSUFFICIENT_DATA: { code: 'E16014', message: 'Insufficient data for payroll calculation.' },
  HR_LEAVE_CALC_ERROR: { code: 'E16015', message: 'Leave calculation error.' },
  HR_ENTITY_NOT_FOUND: { code: 'E16016', message: 'Entity not found.' },
  HR_ENTITY_DUPLICATE_CODE: { code: 'E16017', message: 'Entity code already exists.' },
  HR_ENTITY_NO_ACCESS: { code: 'E16018', message: 'No access to this entity.' },
  HR_ENTITY_CONTEXT_REQUIRED: { code: 'E16019', message: 'Entity context required.' },
  HR_FREELANCER_NOT_FOUND: { code: 'E16020', message: 'Freelancer not found.' },
  HR_FREELANCER_DUPLICATE_CODE: { code: 'E16021', message: 'Freelancer code already exists.' },
  HR_EMPLOYEE_KR_NOT_FOUND: { code: 'E16022', message: 'KR employee info not found.' },
  HR_BUSINESS_INCOME_NOT_FOUND: { code: 'E16023', message: 'Business income payment not found.' },
  HR_YEAREND_NOT_FOUND: { code: 'E16024', message: 'Year-end adjustment not found.' },

  // E17xxx: Billing / Contract / Invoice
  PARTNER_NOT_FOUND: { code: 'E17001', message: 'Business partner not found.' },
  PARTNER_CODE_DUPLICATE: { code: 'E17002', message: 'Partner code already exists in this entity.' },
  CONTRACT_NOT_FOUND: { code: 'E17003', message: 'Contract not found.' },
  CONTRACT_INVALID_TRANSITION: { code: 'E17004', message: 'Invalid contract status transition.' },
  CONTRACT_EXPIRED: { code: 'E17005', message: 'Contract has expired.' },
  SOW_NOT_FOUND: { code: 'E17006', message: 'SOW not found.' },
  SOW_INVALID_TRANSITION: { code: 'E17007', message: 'Invalid SOW status transition.' },
  INVOICE_NOT_FOUND: { code: 'E17008', message: 'Invoice not found.' },
  INVOICE_NUMBER_DUPLICATE: { code: 'E17009', message: 'Invoice number already exists.' },
  INVOICE_IMMUTABLE: { code: 'E17010', message: 'Finalized invoice cannot be modified.' },
  INVOICE_GENERATION_FAILED: { code: 'E17011', message: 'Failed to generate invoice.' },
  PAYMENT_NOT_FOUND: { code: 'E17012', message: 'Payment not found.' },
  PAYMENT_EXCEEDS_BALANCE: { code: 'E17013', message: 'Payment amount exceeds outstanding balance.' },
  DOCUMENT_NOT_FOUND: { code: 'E17014', message: 'Document not found.' },
  DOCUMENT_UPLOAD_FAILED: { code: 'E17015', message: 'Failed to upload document to Google Drive.' },
  BILLING_NO_ELIGIBLE_CONTRACTS: { code: 'E17016', message: 'No eligible contracts for invoice generation.' },
  NTS_NOT_CONFIGURED: { code: 'E17020', message: 'NTS tax invoice service is not configured.' },
  NTS_ISSUE_FAILED: { code: 'E17021', message: 'Failed to issue NTS tax invoice.' },
  NTS_CANCEL_FAILED: { code: 'E17022', message: 'Failed to cancel NTS tax invoice.' },
  NTS_INVALID_STATE: { code: 'E17023', message: 'Invoice is not in a valid state for NTS issuance.' },
  NTS_ALREADY_ISSUED: { code: 'E17024', message: 'NTS tax invoice already issued.' },
  NTS_MISSING_TAX_ID: { code: 'E17025', message: 'Partner tax ID (사업자등록번호) is required.' },
  NTS_MISSING_ENTITY_INFO: { code: 'E17026', message: 'Entity registration number is required.' },

  // E19xxx: ACL (Access Control)
  DEPARTMENT_NOT_FOUND: { code: 'E19001', message: 'Department not found.' },
  DEPARTMENT_DUPLICATE_NAME: { code: 'E19002', message: 'Department name already exists.' },
  DEPARTMENT_HAS_CHILDREN: { code: 'E19003', message: 'Cannot delete department with sub-departments.' },
  DEPARTMENT_HAS_MEMBERS: { code: 'E19004', message: 'Cannot delete department with active members.' },
  USER_DEPT_ROLE_NOT_FOUND: { code: 'E19005', message: 'User department role not found.' },
  USER_DEPT_ROLE_DUPLICATE: { code: 'E19006', message: 'User already assigned to this department.' },
  WORK_ITEM_NOT_FOUND: { code: 'E19007', message: 'Work item not found.' },
  WORK_ITEM_ACCESS_DENIED: { code: 'E19008', message: 'Access denied to this work item.' },
  SHARE_NOT_FOUND: { code: 'E19009', message: 'Share record not found.' },

  // E20xxx: KMS (Knowledge Management)
  KMS_TAG_NOT_FOUND: { code: 'E20001', message: 'Tag not found.' },
  KMS_TAG_DUPLICATE: { code: 'E20002', message: 'Tag already exists.' },
  KMS_TAG_EXTRACTION_FAILED: { code: 'E20003', message: 'AI tag extraction failed.' },

  // E21xxx: Project Management
  PROJECT_NOT_FOUND: { code: 'E21001', message: 'Project not found.' },
  PROJECT_ACCESS_DENIED: { code: 'E21002', message: 'Access denied to this project.' },
  PROJECT_INVALID_TRANSITION: { code: 'E21003', message: 'Invalid project status transition.' },
  PROJECT_CODE_DUPLICATE: { code: 'E21004', message: 'Project code already exists.' },
  PROJECT_NOT_DRAFT: { code: 'E21005', message: 'Project must be in DRAFT status.' },
  PROJECT_NOT_SUBMITTED: { code: 'E21006', message: 'Project must be SUBMITTED to start review.' },
  PROJECT_MEMBER_DUPLICATE: { code: 'E21007', message: 'User is already a member.' },
  PROJECT_MEMBER_NOT_FOUND: { code: 'E21008', message: 'Project member not found.' },
  PROJECT_AI_DRAFT_FAILED: { code: 'E21009', message: 'AI proposal draft generation failed.' },
  PROJECT_AI_ANALYSIS_FAILED: { code: 'E21010', message: 'AI pre-analysis generation failed.' },
  PROJECT_REVIEW_NOT_ALLOWED: { code: 'E21011', message: 'Review not allowed for current status.' },
  PROJECT_FILE_NOT_FOUND: { code: 'E21012', message: 'Project file not found.' },
  EPIC_NOT_FOUND: { code: 'E21013', message: 'Epic not found.' },
  EPIC_CLOSED: { code: 'E21014', message: 'Cannot assign issues to a closed Epic.' },
  EPIC_COMPONENT_EXCLUSIVE: { code: 'E21015', message: 'Issue cannot belong to both Epic and Component.' },
  COMPONENT_NOT_FOUND: { code: 'E21016', message: 'Component not found.' },

  // E22xxx: Service Management
  SERVICE_NOT_FOUND: { code: 'E22001', message: 'Service not found.' },
  SERVICE_CODE_DUPLICATE: { code: 'E22002', message: 'Service code already exists.' },
  SERVICE_PLAN_NOT_FOUND: { code: 'E22003', message: 'Service plan not found.' },
  SVC_CLIENT_NOT_FOUND: { code: 'E22004', message: 'Client not found.' },
  SVC_CLIENT_CODE_DUPLICATE: { code: 'E22005', message: 'Client code already exists.' },
  CLIENT_CONTACT_NOT_FOUND: { code: 'E22006', message: 'Client contact not found.' },
  SUBSCRIPTION_NOT_FOUND: { code: 'E22007', message: 'Subscription not found.' },
  SUBSCRIPTION_INVALID_TRANSITION: { code: 'E22008', message: 'Invalid subscription status transition.' },
  SUBSCRIPTION_ALREADY_EXISTS: { code: 'E22009', message: 'Client already subscribed to this service.' },
  SUBSCRIPTION_CANNOT_CANCEL: { code: 'E22010', message: 'Subscription cannot be cancelled in current status.' },
  CLIENT_NOTE_NOT_FOUND: { code: 'E22011', message: 'Client note not found.' },
  SERVICE_PLAN_IN_USE: { code: 'E22012', message: 'Cannot delete plan with active subscriptions.' },

  // E6xxx: Amoeba Talk
  CHANNEL_NOT_FOUND: { code: 'E6001', message: 'Channel not found.' },
  CHANNEL_ACCESS_DENIED: { code: 'E6002', message: 'Access denied to this channel.' },
  CHANNEL_MEMBER_ALREADY_EXISTS: { code: 'E6003', message: 'User is already a member of this channel.' },
  TALK_MESSAGE_NOT_FOUND: { code: 'E6004', message: 'Message not found.' },
  TALK_MESSAGE_ACCESS_DENIED: { code: 'E6005', message: 'You can only edit/delete your own messages.' },
  CANNOT_LEAVE_OWNED_CHANNEL: { code: 'E6006', message: 'Channel owner cannot leave. Transfer ownership first.' },
  TALK_TRANSLATION_FAILED: { code: 'E6007', message: 'Translation failed.' },
  TALK_DELETE_TIME_EXPIRED: { code: 'E6008', message: 'Messages can only be deleted within 1 hour of sending.' },
  TALK_CHANNEL_ALREADY_ARCHIVED: { code: 'E6009', message: 'Channel is already archived.' },
  TALK_CHANNEL_NOT_ARCHIVED: { code: 'E6010', message: 'Channel is not archived.' },

  // E23xxx: Issues
  ISSUE_NOT_FOUND: { code: 'E23001', message: 'Issue not found.' },
  ISSUE_INVALID_STATUS_TRANSITION: { code: 'E23002', message: 'Invalid issue status transition.' },
  ISSUE_COMMENT_NOT_FOUND: { code: 'E23003', message: 'Issue comment not found.' },
  ISSUE_PERMISSION_DENIED: { code: 'E23004', message: 'Only reporter, assignee, or manager can change issue status.' },
  ISSUE_DELETE_NOT_ALLOWED: { code: 'E23005', message: 'You do not have permission to delete this issue.' },

  // E24xxx: Translation
  TRANSLATION_SERVICE_ERROR: { code: 'E24001', message: 'Translation service error.' },
  TRANSLATION_SOURCE_NOT_FOUND: { code: 'E24002', message: 'Source content not found.' },
  TRANSLATION_NOT_FOUND: { code: 'E24003', message: 'Translation not found.' },
  TRANSLATION_LOCKED: { code: 'E24004', message: 'Translation is locked.' },
  TRANSLATION_SAME_LANG: { code: 'E24005', message: 'Source and target language are the same.' },
  TRANSLATION_EMPTY: { code: 'E24006', message: 'Translation content is empty.' },
  GLOSSARY_TERM_EXISTS: { code: 'E24007', message: 'Glossary term already exists.' },
  GLOSSARY_NOT_FOUND: { code: 'E24008', message: 'Glossary term not found.' },

  // E25xxx: Asset Management
  ASSET_NOT_FOUND: { code: 'E25001', message: 'Asset not found.' },
  ASSET_REQUEST_NOT_FOUND: { code: 'E25002', message: 'Asset request not found.' },
  ASSET_REQUEST_INVALID_STATUS: { code: 'E25003', message: 'Invalid asset request status transition.' },
  ASSET_REQUEST_VALIDATION_FAILED: { code: 'E25004', message: 'Asset request validation failed.' },

  // E26xxx: Calendar (일정관리)
  CALENDAR_NOT_FOUND: { code: 'E26001', message: 'Calendar event not found.' },
  CALENDAR_ACCESS_DENIED: { code: 'E26002', message: 'Access denied to this calendar event.' },
  CALENDAR_OPTIMISTIC_LOCK_CONFLICT: { code: 'E26003', message: 'Calendar event was modified by another user. Please refresh and try again.' },
  CALENDAR_RECURRENCE_ONLY: { code: 'E26004', message: 'Only recurring events can have exceptions.' },
  CALENDAR_PARTICIPANT_NOT_FOUND: { code: 'E26005', message: 'Participant not found.' },
  CALENDAR_DATE_RANGE_EXCEEDED: { code: 'E26006', message: 'Date range cannot exceed 90 days.' },
  CALENDAR_MAX_ITEMS_EXCEEDED: { code: 'E26007', message: 'Maximum 500 items per request.' },
  GOOGLE_AUTH_FAILED: { code: 'E26010', message: 'Google Calendar authentication failed.' },
  GOOGLE_SYNC_FAILED: { code: 'E26011', message: 'Google Calendar sync failed.' },
  GOOGLE_SYNC_RETRY_EXCEEDED: { code: 'E26012', message: 'Google Calendar sync retry limit exceeded.' },

  // E27xxx: CMS (Site Management)
  CMS_MENU_SLUG_DUPLICATE: { code: 'E27001', message: 'Menu slug already exists.' },
  CMS_MENU_INVALID_PARENT: { code: 'E27002', message: 'Invalid parent menu.' },
  CMS_MENU_NOT_FOUND: { code: 'E27003', message: 'CMS menu not found.' },
  CMS_MENU_HAS_CHILDREN: { code: 'E27004', message: 'Cannot delete menu with children.' },
  CMS_PAGE_NOT_FOUND: { code: 'E27010', message: 'CMS page not found.' },
  CMS_PAGE_ALREADY_ARCHIVED: { code: 'E27011', message: 'Page is already archived.' },
  CMS_PAGE_CONTENT_EMPTY: { code: 'E27012', message: 'Page content is empty. Cannot publish.' },
  CMS_PAGE_SLUG_DUPLICATE: { code: 'E27013', message: 'Page slug already exists.' },
  CMS_PAGE_INVALID_TYPE: { code: 'E27014', message: 'Invalid page type.' },
  CMS_VERSION_NOT_FOUND: { code: 'E27020', message: 'Page version not found.' },
  CMS_SECTION_NOT_FOUND: { code: 'E27030', message: 'Section not found.' },
  CMS_SECTION_INVALID_TYPE: { code: 'E27031', message: 'Invalid section type.' },
  CMS_POST_NOT_FOUND: { code: 'E27040', message: 'Post not found.' },
  CMS_POST_CATEGORY_NOT_FOUND: { code: 'E27041', message: 'Post category not found.' },
  CMS_POST_ATTACHMENT_TOO_LARGE: { code: 'E27042', message: 'Attachment size exceeds 10MB limit.' },
  CMS_POST_ATTACHMENT_LIMIT: { code: 'E27043', message: 'Maximum 5 attachments per post.' },
  CMS_SUBSCRIBER_ALREADY_EXISTS: { code: 'E27050', message: 'Email is already subscribed.' },
  CMS_SUBSCRIBER_NOT_FOUND: { code: 'E27051', message: 'Subscriber not found.' },
  CMS_PREVIEW_TOKEN_EXPIRED: { code: 'E27060', message: 'Preview token has expired.' },
  CMS_IMAGE_UPLOAD_FAILED: { code: 'E27070', message: 'Image upload failed.' },

  // E28xxx: Payment Gateway
  PG_CONFIG_NOT_FOUND: { code: 'E28001', message: 'Payment gateway configuration not found.' },
  PG_TRANSACTION_NOT_FOUND: { code: 'E28002', message: 'Payment transaction not found.' },
  PG_PAYMENT_FAILED: { code: 'E28003', message: 'Payment processing failed.' },
  PG_REFUND_FAILED: { code: 'E28004', message: 'Refund processing failed.' },
  QUOTA_EXCEEDED_PURCHASE_AVAILABLE: { code: 'E28010', message: 'Token quota exceeded. Purchase additional tokens to continue.' },
  QUOTA_PRODUCT_NOT_FOUND: { code: 'E28011', message: 'Quota product not found.' },

  // E29xxx: Subscription
  SUB_TOKEN_BALANCE_ZERO: { code: 'E29001', message: 'AI service suspended. Token balance is zero. Please recharge.' },
  SUB_STORAGE_BLOCKED: { code: 'E29002', message: 'Storage upload blocked. Quota exceeded 120%. Please add storage.' },
  SUB_PLAN_NOT_FOUND: { code: 'E29003', message: 'Subscription plan not found.' },
  SUB_STORAGE_QUOTA_NOT_FOUND: { code: 'E29004', message: 'Storage quota not found.' },
  SUB_VALIDATION_ERROR: { code: 'E29005', message: 'Subscription validation error.' },
  SUB_POLAR_CONFIG_MISSING: { code: 'E29006', message: 'Polar product ID not configured.' },
  SUB_WEBHOOK_SIGNATURE_INVALID: { code: 'E29010', message: 'Invalid webhook signature.' },

  // E9xxx: System
  INTERNAL_ERROR: { code: 'E9001', message: 'A system error occurred.' },
  AI_SERVICE_ERROR: { code: 'E9002', message: 'AI service error occurred.' },
} as const;
