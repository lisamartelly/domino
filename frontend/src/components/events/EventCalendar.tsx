import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, type CalendarEvent, type RecurrenceRule } from "trud-calendar";
import type { EventSummaryDto } from "../../services/api";

interface EventCalendarProps {
  events: EventSummaryDto[];
}

function buildRecurrence(event: EventSummaryDto): RecurrenceRule | undefined {
  if (event.frequencyType === "ONCE" || event.frequencyCount <= 1) {
    return undefined;
  }

  switch (event.frequencyType) {
    case "WEEKLY":
      return { freq: "weekly", interval: 1, count: event.frequencyCount };
    case "BIWEEKLY":
      return { freq: "weekly", interval: 2, count: event.frequencyCount };
    case "MONTHLY":
      return { freq: "monthly", interval: 1, count: event.frequencyCount };
    default:
      return undefined;
  }
}

function toDateTimeString(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, "").replace(/Z$/, "").slice(0, 19);
}

function toCalendarEvents(events: EventSummaryDto[]): CalendarEvent[] {
  return events
    .filter((e) => e.startTime !== null)
    .map((e) => {
      const start = toDateTimeString(e.startTime!);

      const endMs = new Date(e.startTime!).getTime() + e.durationMinutes * 60000;
      const end = toDateTimeString(new Date(endMs).toISOString());

      const recurrence = buildRecurrence(e);

      return {
        id: String(e.id),
        title: e.name,
        start,
        end,
        color: "#EFAE1E",
        ...(recurrence && { recurrence }),
      };
    });
}

export function EventCalendar({ events }: EventCalendarProps) {
  const navigate = useNavigate();
  const calendarEvents = useMemo(() => toCalendarEvents(events), [events]);

  return (
    <Calendar
      events={calendarEvents}
      defaultView="month"
      onEventClick={(event) => navigate(`/events/${event.id}`)}
    />
  );
}
