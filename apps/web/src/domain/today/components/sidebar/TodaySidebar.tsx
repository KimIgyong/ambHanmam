import TodayHistoryCalendar from '../history/TodayHistoryCalendar';
import TodaySidebarNotices from './TodaySidebarNotices';
import TodaySidebarNotes from './TodaySidebarNotes';
import TodaySidebarIssues from './TodaySidebarIssues';

export default function TodaySidebar() {
  return (
    <div className="space-y-4">
      <TodayHistoryCalendar />
      <TodaySidebarNotices />
      <TodaySidebarNotes />
      <TodaySidebarIssues />
    </div>
  );
}
