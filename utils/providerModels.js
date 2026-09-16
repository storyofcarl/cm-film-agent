// Public provider identifiers, verified against the provider catalogs. No secrets.
export const PROVIDER_MODELS = [
  { slot: 'claudeSonnet', id: 'claude-sonnet-5', label: 'Claude Sonnet 5', provider: 'anthropic', kind: 'llm' },
  { slot: 'claudeOpus', id: 'claude-opus-5', label: 'Claude Opus 5', provider: 'anthropic', kind: 'llm' },
  { slot: 'claudeFable51', id: 'claude-fable-5-1', label: 'Claude Fable 5.1', provider: 'anthropic', kind: 'llm' },
  { slot: 'claudeFable5', id: 'claude-fable-5', label: 'Claude Fable 5', provider: 'anthropic', kind: 'llm' },
  { slot: 'minimaxH3', id: 'MiniMax-H3', label: 'MiniMax H3 · MiniMax', provider: 'minimax', kind: 'video', refs: 9, resolutions: ['768p', '2K'], defaultResolution: '2K' },
  { slot: 'minimaxH3Max', id: 'minimax/h3-max', label: 'MiniMax H3 Max · fal', provider: 'fal', kind: 'video', refs: 2, resolutions: ['480p', '768p', '1080p'], defaultResolution: '768p' },
  { slot: 'nanoBananaPro', id: 'google/nano-banana-pro', label: 'Nano Banana Pro · WaveSpeed', provider: 'wavespeed', kind: 'image', refs: 14 },
  { slot: 'nanoBanana2', id: 'google/nano-banana-2', label: 'Nano Banana 2 · WaveSpeed', provider: 'wavespeed', kind: 'image', refs: 14 },
  { slot: 'gptImage2', id: 'openai/gpt-image-2', label: 'GPT Image 2 · WaveSpeed', provider: 'wavespeed', kind: 'image', refs: 16 },
  { slot: 'gptImage25Sunburst', id: 'openai/gpt-image-2.5-sunburst', label: 'GPT Image 2.5 Sunburst · WaveSpeed', provider: 'wavespeed', kind: 'image', refs: 16 },
  { slot: 'gptImage25Flare', id: 'openai/gpt-image-2.5-flare', label: 'GPT Image 2.5 Flare · WaveSpeed', provider: 'wavespeed', kind: 'image', refs: 16 },
];
export const providerModel = (id) => PROVIDER_MODELS.find((model) => model.id === id || model.slot === id);
export const PROVIDER_KEY_NAMES = { anthropic: 'ANTHROPIC_API_KEY', fal: 'FAL_API_KEY', wavespeed: 'WAVESPEED_API_KEY', minimax: 'MINIMAX_API_KEY' };
export const REASONING_MODEL_SLOTS = ['reasoner', ...PROVIDER_MODELS.filter((m) => m.kind === 'llm').map((m) => m.slot), 'seedReasoner'];
export const enabledProviderModels = () => PROVIDER_MODELS.filter((m) => Boolean(process.env[PROVIDER_KEY_NAMES[m.provider]]));
