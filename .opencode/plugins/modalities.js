export const ModalitiesPlugin = async (ctx) => {
  return {
    config: async (config) => {
      const patterns = [
        "gpt-4o", "gpt-4o-", "gpt-4.5",
        "claude-sonnet-4", "claude-3.5-sonnet", "claude-3.5-haiku", "claude-opus-4",
        "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0", "gemini-2.5",
        "MiniCPM-V", "llava",
      ]

      for (const provider of Object.values(config.provider || {})) {
        if (!provider.models) continue
        for (const [modelId, model] of Object.entries(provider.models)) {
          if (model.modalities) continue
          const name = model.name || modelId
          if (!patterns.some((p) => name.startsWith(p) || modelId.startsWith(p))) continue
          model.modalities = {
            input: ["text", "image", "pdf"],
            output: ["text"],
          }
        }
      }
    },
  }
}
