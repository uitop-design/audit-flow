import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AuditEventStats } from '@/lib/api/types';
import { formatNumber, formatUtcDay } from '@/lib/format';

const chartConfig = {
  count: { label: 'Events', color: 'var(--primary)' },
} satisfies ChartConfig;

/** Events per UTC day for the last 14 days, with a text equivalent for assistive technology. */
export function ActivityChart({ days }: { days: AuditEventStats['dailyVolume'] }) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const busiest = days.reduce(
    (max, day) => (day.count > max.count ? day : max),
    days[0] ?? { date: '', count: 0 },
  );
  const summary =
    total === 0
      ? 'No events in the last 14 days.'
      : `${formatNumber(total)} events in the last 14 days; busiest day ${formatUtcDay(busiest.date)} with ${formatNumber(busiest.count)}.`;

  return (
    <figure className="space-y-2">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[280px] w-full"
        aria-hidden="true"
      >
        <BarChart data={days} margin={{ left: -16, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
            tickFormatter={formatUtcDay}
          />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent labelFormatter={(value) => formatUtcDay(String(value))} />
            }
          />
          {/* No grow-in animation: it only delays the data (and the brief asks for no unnecessary motion). */}
          <Bar dataKey="count" fill="var(--color-count)" radius={3} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
      <figcaption className="text-muted-foreground text-xs">{summary} Days are in UTC.</figcaption>
      <table className="sr-only">
        <caption>Events per day</caption>
        <thead>
          <tr>
            <th scope="col">Day (UTC)</th>
            <th scope="col">Events</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <td>{formatUtcDay(day.date)}</td>
              <td>{day.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
