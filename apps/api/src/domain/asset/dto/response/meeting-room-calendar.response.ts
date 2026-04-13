export interface MeetingRoomCalendarResponse {
  view: 'day' | 'week';
  range: {
    from: string;
    to: string;
  };
  rooms: Array<{
    roomId: string;
    roomCode: string;
    roomName: string;
    location: string | null;
    capacity: number | null;
    status: 'AVAILABLE' | 'RESERVED' | 'IN_USE';
    reservations: Array<{
      requestId: string;
      requestNo: string;
      title: string;
      requesterName: string | null;
      startAt: string;
      endAt: string;
      requestStatus: string;
    }>;
    availableSlots?: Array<{
      startAt: string;
      endAt: string;
    }>;
  }>;
}