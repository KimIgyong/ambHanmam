import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enChat from './locales/en/chat.json';
import enSettings from './locales/en/settings.json';
import enDashboard from './locales/en/dashboard.json';
import enUnits from './locales/en/units.json';
import enMembers from './locales/en/members.json';
import enTodos from './locales/en/todos.json';
import enMeetingNotes from './locales/en/meetingNotes.json';
import enAgents from './locales/en/agents.json';
import enAttendance from './locales/en/attendance.json';
import enNotices from './locales/en/notices.json';
import enDrive from './locales/en/drive.json';
import enAccounting from './locales/en/accounting.json';
import enHr from './locales/en/hr.json';
import enBilling from './locales/en/billing.json';
import enAcl from './locales/en/acl.json';
import enKms from './locales/en/kms.json';
import enProject from './locales/en/project.json';
import enService from './locales/en/service.json';
import enTalk from './locales/en/talk.json';
import enMyPage from './locales/en/myPage.json';
import enAssistant from './locales/en/assistant.json';
import enIssues from './locales/en/issues.json';
import enTranslation from './locales/en/translation.json';
import enCalendar from './locales/en/calendar.json';
import enAsset from './locales/en/asset.json';
import enExpenseRequest from './locales/en/expenseRequest.json';
import enSite from './locales/en/site.json';
import enNotifications from './locales/en/notifications.json';
import enEntitySettings from './locales/en/entitySettings.json';
import enTotalUsers from './locales/en/totalUsers.json';
import enEntityManagement from './locales/en/entityManagement.json';
import enToday from './locales/en/today.json';
import enReport from './locales/en/report.json';
import enClientPortal from './locales/en/clientPortal.json';
import enPartnerPortal from './locales/en/partnerPortal.json';
import enAdmin from './locales/en/admin.json';
import enExternalTask from './locales/en/externalTask.json';
import enOauth from './locales/en/oauth.json';
import enAtkConnect from './locales/en/atkConnect.json';
import enSubscription from './locales/en/subscription.json';

import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
import koChat from './locales/ko/chat.json';
import koSettings from './locales/ko/settings.json';
import koDashboard from './locales/ko/dashboard.json';
import koUnits from './locales/ko/units.json';
import koMembers from './locales/ko/members.json';
import koTodos from './locales/ko/todos.json';
import koMeetingNotes from './locales/ko/meetingNotes.json';
import koAgents from './locales/ko/agents.json';
import koAttendance from './locales/ko/attendance.json';
import koNotices from './locales/ko/notices.json';
import koDrive from './locales/ko/drive.json';
import koAccounting from './locales/ko/accounting.json';
import koHr from './locales/ko/hr.json';
import koBilling from './locales/ko/billing.json';
import koAcl from './locales/ko/acl.json';
import koKms from './locales/ko/kms.json';
import koProject from './locales/ko/project.json';
import koService from './locales/ko/service.json';
import koTalk from './locales/ko/talk.json';
import koMyPage from './locales/ko/myPage.json';
import koAssistant from './locales/ko/assistant.json';
import koIssues from './locales/ko/issues.json';
import koTranslation from './locales/ko/translation.json';
import koCalendar from './locales/ko/calendar.json';
import koAsset from './locales/ko/asset.json';
import koExpenseRequest from './locales/ko/expenseRequest.json';
import koSite from './locales/ko/site.json';
import koNotifications from './locales/ko/notifications.json';
import koEntitySettings from './locales/ko/entitySettings.json';
import koTotalUsers from './locales/ko/totalUsers.json';
import koEntityManagement from './locales/ko/entityManagement.json';
import koToday from './locales/ko/today.json';
import koReport from './locales/ko/report.json';
import koClientPortal from './locales/ko/clientPortal.json';
import koPartnerPortal from './locales/ko/partnerPortal.json';
import koAdmin from './locales/ko/admin.json';
import koExternalTask from './locales/ko/externalTask.json';
import koOauth from './locales/ko/oauth.json';
import koAtkConnect from './locales/ko/atkConnect.json';
import koSubscription from './locales/ko/subscription.json';

import viCommon from './locales/vi/common.json';
import viAuth from './locales/vi/auth.json';
import viChat from './locales/vi/chat.json';
import viSettings from './locales/vi/settings.json';
import viDashboard from './locales/vi/dashboard.json';
import viUnits from './locales/vi/units.json';
import viMembers from './locales/vi/members.json';
import viTodos from './locales/vi/todos.json';
import viMeetingNotes from './locales/vi/meetingNotes.json';
import viAgents from './locales/vi/agents.json';
import viAttendance from './locales/vi/attendance.json';
import viNotices from './locales/vi/notices.json';
import viDrive from './locales/vi/drive.json';
import viAccounting from './locales/vi/accounting.json';
import viHr from './locales/vi/hr.json';
import viBilling from './locales/vi/billing.json';
import viAcl from './locales/vi/acl.json';
import viKms from './locales/vi/kms.json';
import viProject from './locales/vi/project.json';
import viService from './locales/vi/service.json';
import viTalk from './locales/vi/talk.json';
import viMyPage from './locales/vi/myPage.json';
import viAssistant from './locales/vi/assistant.json';
import viIssues from './locales/vi/issues.json';
import viTranslation from './locales/vi/translation.json';
import viCalendar from './locales/vi/calendar.json';
import viAsset from './locales/vi/asset.json';
import viExpenseRequest from './locales/vi/expenseRequest.json';
import viSite from './locales/vi/site.json';
import viNotifications from './locales/vi/notifications.json';
import viEntitySettings from './locales/vi/entitySettings.json';
import viTotalUsers from './locales/vi/totalUsers.json';
import viEntityManagement from './locales/vi/entityManagement.json';
import viToday from './locales/vi/today.json';
import viReport from './locales/vi/report.json';
import viClientPortal from './locales/vi/clientPortal.json';
import viPartnerPortal from './locales/vi/partnerPortal.json';
import viAdmin from './locales/vi/admin.json';
import viExternalTask from './locales/vi/externalTask.json';
import viOauth from './locales/vi/oauth.json';
import viAtkConnect from './locales/vi/atkConnect.json';
import viSubscription from './locales/vi/subscription.json';
import enHanmam from './locales/en/hanmam.json';
import koHanmam from './locales/ko/hanmam.json';
import viHanmam from './locales/vi/hanmam.json';

const savedLang = localStorage.getItem('amb-lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      chat: enChat,
      settings: enSettings,
      dashboard: enDashboard,
      units: enUnits,
      members: enMembers,
      todos: enTodos,
      meetingNotes: enMeetingNotes,
      agents: enAgents,
      attendance: enAttendance,
      notices: enNotices,
      drive: enDrive,
      accounting: enAccounting,
      hr: enHr,
      billing: enBilling,
      acl: enAcl,
      kms: enKms,
      project: enProject,
      service: enService,
      talk: enTalk,
      myPage: enMyPage,
      assistant: enAssistant,
      issues: enIssues,
      translation: enTranslation,
      calendar: enCalendar,
      asset: enAsset,
      expenseRequest: enExpenseRequest,
      site: enSite,
      notifications: enNotifications,
      entitySettings: enEntitySettings,
      totalUsers: enTotalUsers,
      entityManagement: enEntityManagement,
      today: enToday,
      report: enReport,
      clientPortal: enClientPortal,
      partnerPortal: enPartnerPortal,
      admin: enAdmin,
      externalTask: enExternalTask,
      oauth: enOauth,
      atkConnect: enAtkConnect,
      subscription: enSubscription,
      hanmam: enHanmam,
    },
    ko: {
      common: koCommon,
      auth: koAuth,
      chat: koChat,
      settings: koSettings,
      dashboard: koDashboard,
      units: koUnits,
      members: koMembers,
      todos: koTodos,
      meetingNotes: koMeetingNotes,
      agents: koAgents,
      attendance: koAttendance,
      notices: koNotices,
      drive: koDrive,
      accounting: koAccounting,
      hr: koHr,
      billing: koBilling,
      acl: koAcl,
      kms: koKms,
      project: koProject,
      service: koService,
      talk: koTalk,
      myPage: koMyPage,
      assistant: koAssistant,
      issues: koIssues,
      translation: koTranslation,
      calendar: koCalendar,
      asset: koAsset,
      expenseRequest: koExpenseRequest,
      site: koSite,
      notifications: koNotifications,
      entitySettings: koEntitySettings,
      totalUsers: koTotalUsers,
      entityManagement: koEntityManagement,
      today: koToday,
      report: koReport,
      clientPortal: koClientPortal,
      partnerPortal: koPartnerPortal,
      admin: koAdmin,
      externalTask: koExternalTask,
      oauth: koOauth,
      atkConnect: koAtkConnect,
      subscription: koSubscription,
      hanmam: koHanmam,
    },
    vi: {
      common: viCommon,
      auth: viAuth,
      chat: viChat,
      settings: viSettings,
      dashboard: viDashboard,
      units: viUnits,
      members: viMembers,
      todos: viTodos,
      meetingNotes: viMeetingNotes,
      agents: viAgents,
      attendance: viAttendance,
      notices: viNotices,
      drive: viDrive,
      accounting: viAccounting,
      hr: viHr,
      billing: viBilling,
      acl: viAcl,
      kms: viKms,
      project: viProject,
      service: viService,
      talk: viTalk,
      myPage: viMyPage,
      assistant: viAssistant,
      issues: viIssues,
      translation: viTranslation,
      calendar: viCalendar,
      asset: viAsset,
      expenseRequest: viExpenseRequest,
      site: viSite,
      notifications: viNotifications,
      entitySettings: viEntitySettings,
      totalUsers: viTotalUsers,
      entityManagement: viEntityManagement,
      today: viToday,
      report: viReport,
      clientPortal: viClientPortal,
      partnerPortal: viPartnerPortal,
      admin: viAdmin,
      externalTask: viExternalTask,
      oauth: viOauth,
      atkConnect: viAtkConnect,
      subscription: viSubscription,
      hanmam: viHanmam,
    },
  },
  lng: savedLang,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'auth', 'chat', 'settings', 'dashboard', 'units', 'members', 'todos', 'meetingNotes', 'agents', 'attendance', 'notices', 'drive', 'accounting', 'hr', 'billing', 'acl', 'kms', 'project', 'service', 'talk', 'myPage', 'assistant', 'issues', 'translation', 'calendar', 'asset', 'expenseRequest', 'site', 'notifications', 'entitySettings', 'totalUsers', 'entityManagement', 'today', 'report', 'clientPortal', 'partnerPortal', 'admin', 'externalTask', 'oauth', 'atkConnect', 'subscription', 'hanmam'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
