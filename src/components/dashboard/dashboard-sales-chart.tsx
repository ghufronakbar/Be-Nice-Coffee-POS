"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type DashboardSalesChartProps = {
  data: Array<{
    label: string
    revenue: number
    profit: number
    orders: number
  }>
}

const chartConfig = {
  revenue: {
    label: "Omzet",
    color: "#2563eb",
  },
  profit: {
    label: "Profit",
    color: "#16a34a",
  },
} satisfies ChartConfig

export function DashboardSalesChart({ data }: DashboardSalesChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="revenue"
          type="monotone"
          fill="var(--color-revenue)"
          fillOpacity={0.15}
          stroke="var(--color-revenue)"
          strokeWidth={2}
        />
        <Area
          dataKey="profit"
          type="monotone"
          fill="var(--color-profit)"
          fillOpacity={0.12}
          stroke="var(--color-profit)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
