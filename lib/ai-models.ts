// Anthropic model ids. The previous hard-coded ids (claude-3-5-sonnet-20241022,
// claude-3-haiku-20240307) were retired by Anthropic in Oct 2025 / Apr 2026, so
// every AI request failed. Override with env vars when models change again.
export function anthropicSearchModel(): string {
  return process.env.ANTHROPIC_SEARCH_MODEL?.trim() || 'claude-sonnet-5-5'
}

export function anthropicFastModel(): string {
  return process.env.ANTHROPIC_FAST_MODEL?.trim() || 'claude-haiku-5-5'
}

export function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}
