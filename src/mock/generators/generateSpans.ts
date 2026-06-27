import type { Rng } from '../seed'
import type { AgentTask, ErrorCategory, SpanStatus, SpanType, TraceSpan } from '../../types'

const AGENT_SPAN_TYPES: SpanType[] = ['model_call', 'shell_command', 'git_operation', 'test_run', 'policy_check']

const ERROR_CATEGORY_FOR_TYPE: Record<SpanType, ErrorCategory> = {
  model_call: 'model_error',
  shell_command: 'tool_error',
  git_operation: 'tool_error',
  test_run: 'test_failure',
  policy_check: 'policy_block',
  env_setup: 'env_setup',
}

export function generateSpans(rng: Rng, tasks: AgentTask[]): TraceSpan[] {
  const spans: TraceSpan[] = []
  let idCounter = 1

  // Filter to only completed and failed tasks
  const terminalTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed')

  for (const task of terminalTasks) {
    const taskStart = new Date(task.startedAt).getTime()

    // env_setup span (from operator)
    const envDuration = Math.round(rng.logNormal(Math.log(8000), 0.4))
    spans.push({
      id: `span-${idCounter++}`,
      taskId: task.id,
      type: 'env_setup',
      name: 'provision-environment',
      startedAt: new Date(taskStart).toISOString(),
      durationMs: envDuration,
      status: rng.nextBool(0.96) ? 'ok' : 'error',
      errorCategory: undefined,
      source: 'operator',
    })
    const lastSpan = spans[spans.length - 1]
    if (lastSpan.status === 'error') lastSpan.errorCategory = 'env_setup'

    // 4–12 agent spans
    const spanCount = rng.nextInt(4, 12)
    let cursor = taskStart + envDuration
    for (let i = 0; i < spanCount; i++) {
      const type = rng.pick(AGENT_SPAN_TYPES)
      const duration = Math.round(rng.logNormal(Math.log(15000), 0.7))
      const isError = task.status === 'failed' && i === spanCount - 1
        ? rng.nextBool(0.7)
        : rng.nextBool(0.05)
      const isTimeout = !isError && rng.nextBool(0.02)
      const status: SpanStatus = isTimeout ? 'timeout' : isError && type === 'policy_check' ? 'blocked' : isError ? 'error' : 'ok'
      const isModelCall = type === 'model_call'

      spans.push({
        id: `span-${idCounter++}`,
        taskId: task.id,
        type,
        name: `${type.replace('_', '-')}-${i + 1}`,
        startedAt: new Date(cursor).toISOString(),
        durationMs: duration,
        status,
        errorCategory: status !== 'ok' ? ERROR_CATEGORY_FOR_TYPE[type] : undefined,
        source: 'agent',
        ...(isModelCall && {
          costUsd: rng.nextFloat(0.001, 0.5),
          inputTokens: rng.nextInt(500, 10000),
          outputTokens: rng.nextInt(200, 4000),
        }),
      })
      cursor += duration + rng.nextInt(100, 2000)
    }
  }

  return spans
}
