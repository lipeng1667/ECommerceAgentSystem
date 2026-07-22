/**
 * File: TrendBarChart.tsx
 * Purpose: Compact reusable multi-bar trend chart for management dashboards where full charting
 * libraries would be too heavy for simple comparative trend displays.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 *
 * Main exports:
 * - TrendBarChart: renders grouped vertical bars with labels.
 *
 * Major updates:
 * - 2026-07-03: Added ownership and function documentation for AI-assisted collaboration.
 * - 2026-07-22 (WS-C): `max` is now optional and derived per series from the data so bars never
 *   clip; added always-visible per-point value labels (touch friendly) and aria labels per bar.
 */
import { Typography } from 'antd';

export interface TrendBarItem {
  value: number;
  /** Scale ceiling for this bar. When omitted, the series maximum (per bar index) is used. */
  max?: number;
  title: string;
  className?: string;
  color?: string;
  minHeight?: number;
  width?: number;
}

export interface TrendPoint {
  key: string;
  label: string;
  bars: TrendBarItem[];
  /** Optional compact value label rendered above the bars (visible without hover). */
  valueLabel?: string;
}

interface TrendBarChartProps {
  points: TrendPoint[];
  ariaLabel?: string;
  className?: string;
  barAreaHeight?: number;
  maxBarHeight?: number;
  labelMaxWidth?: number;
}

/**
 * Renders a compact grouped bar trend chart from normalized point data.
 *
 * @param points - Ordered trend points; each point can contain one or more bars.
 * @param ariaLabel - Accessible label for the chart container.
 * @param className - Optional CSS class for domain-specific styling.
 * @param barAreaHeight - Optional fixed height for the bar area.
 * @param maxBarHeight - Maximum rendered bar height in pixels.
 * @param labelMaxWidth - Optional width used to clamp labels.
 * @returns React element containing the trend chart.
 *
 * Author: Michael Lee
 * Created: 2026-07-03
 */
export function TrendBarChart({
  points,
  ariaLabel,
  className,
  barAreaHeight,
  maxBarHeight = 140,
  labelMaxWidth
}: TrendBarChartProps) {
  // Data-derived scale ceiling per bar index (series), used when a bar does not specify `max`.
  const seriesMax: number[] = [];
  for (const point of points) {
    point.bars.forEach((bar, index) => {
      seriesMax[index] = Math.max(seriesMax[index] ?? 0, bar.value);
    });
  }

  return (
    <div className={['trend-chart', className].filter(Boolean).join(' ')} role="img" aria-label={ariaLabel}>
      {points.map((point) => (
        <div className="trend-column" key={point.key}>
          {point.valueLabel !== undefined && (
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}
            >
              {point.valueLabel}
            </Typography.Text>
          )}
          <div className="trend-bars" style={barAreaHeight ? { height: barAreaHeight } : undefined}>
            {point.bars.map((bar, index) => {
              const scale = Math.max(bar.max ?? seriesMax[index] ?? 1, 1);
              return (
                <span
                  className={['trend-bar', bar.className].filter(Boolean).join(' ')}
                  key={`${point.key}-${index}`}
                  style={{
                    height: `${Math.max(bar.minHeight ?? 8, Math.min(bar.value / scale, 1) * maxBarHeight)}px`,
                    width: bar.width,
                    background: bar.color
                  }}
                  title={bar.title}
                  aria-label={bar.title}
                />
              );
            })}
          </div>
          <Typography.Text
            type="secondary"
            style={labelMaxWidth ? { fontSize: 12, textAlign: 'center', maxWidth: labelMaxWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : undefined}
          >
            {point.label}
          </Typography.Text>
        </div>
      ))}
    </div>
  );
}
