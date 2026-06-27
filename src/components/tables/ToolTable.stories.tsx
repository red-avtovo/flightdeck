import type { Meta, StoryObj } from '@storybook/react'
import { ToolTable } from './ToolTable'
import type { ToolStat } from '../../types'

const meta: Meta<typeof ToolTable> = {
  title: 'Tables/ToolTable',
  component: ToolTable,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ToolTable>

const ROWS: ToolStat[] = [
  { tool: 'model_call',    callCount: 1200, errorRate: 0.02, p50LatencyMs: 1800, p95LatencyMs: 8500 },
  { tool: 'shell_command', callCount: 950,  errorRate: 0.08, p50LatencyMs: 450,  p95LatencyMs: 3200 },
  { tool: 'git_operation', callCount: 600,  errorRate: 0.04, p50LatencyMs: 120,  p95LatencyMs: 800 },
  { tool: 'test_run',      callCount: 400,  errorRate: 0.15, p50LatencyMs: 5000, p95LatencyMs: 25000 },
  { tool: 'policy_check',  callCount: 300,  errorRate: 0.01, p50LatencyMs: 80,   p95LatencyMs: 400 },
  { tool: 'env_setup',     callCount: 250,  errorRate: 0.05, p50LatencyMs: 8000, p95LatencyMs: 35000 },
]

const ALL_ERRORS: ToolStat[] = ROWS.map(r => ({ ...r, errorRate: 0.9 + Math.random() * 0.1 }))

export const Populated:  Story = { args: { rows: ROWS } }
export const AllErrors:  Story = { args: { rows: ALL_ERRORS } }
