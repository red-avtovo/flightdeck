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

// Map a failing span of a given type to a concrete failure status.
function failureStatus(rng: Rng, type: SpanType): SpanStatus {
  if (rng.nextBool(0.15)) return 'timeout'
  if (type === 'policy_check') return 'blocked'
  return 'error'
}

export function generateSpans(rng: Rng, tasks: AgentTask[]): TraceSpan[] {
  const spans: TraceSpan[] = []
  let idCounter = 1

  // Only terminal tasks produce a trace. Coherence invariants enforced below:
  //   • a successful (completed) task contains NO failing spans
  //   • a failed task contains AT LEAST ONE failing span (env, or a final agent span)
  const terminalTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed')

  for (const task of terminalTasks) {
    const isFailed = task.status === 'failed'
    const taskStart = new Date(task.startedAt).getTime()

    // env_setup span (from operator). Provisioning only fails for a failed task.
    const envDuration = Math.round(rng.logNormal(Math.log(8000), 0.4))
    const envFailed = isFailed && rng.nextBool(0.15)
    spans.push({
      id: `span-${idCounter++}`,
      taskId: task.id,
      type: 'env_setup',
      name: 'provision-environment',
      startedAt: new Date(taskStart).toISOString(),
      durationMs: envDuration,
      status: envFailed ? 'error' : 'ok',
      errorCategory: envFailed ? 'env_setup' : undefined,
      source: 'operator',
    })

    // If provisioning failed, the agent never ran — the failed span above is the cause.
    if (envFailed) continue

    // 4–12 agent spans. For a failed task the final span is forced to fail (the cause),
    // and earlier spans may hit transient errors; a completed task stays all-green.
    const spanCount = rng.nextInt(4, 12)
    const failIndex = isFailed ? spanCount - 1 : -1
    let cursor = taskStart + envDuration
    for (let i = 0; i < spanCount; i++) {
      const type = rng.pick(AGENT_SPAN_TYPES)
      const duration = Math.round(rng.logNormal(Math.log(15000), 0.7))

      const isFinalFailure = i === failIndex
      const isTransientFailure = isFailed && !isFinalFailure && rng.nextBool(0.12)
      const status: SpanStatus = (isFinalFailure || isTransientFailure)
        ? failureStatus(rng, type)
        : 'ok'

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
