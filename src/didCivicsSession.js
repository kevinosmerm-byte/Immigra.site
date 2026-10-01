// D-ID provides only video/voice transport. Never send user answers to chat().
export async function createDidCivicsSession(sdk, credentials, callbacks) {
  const manager = await sdk.createAgentManager(credentials.agentId, {
    auth: { type: "key", clientKey: credentials.clientKey },
    mode: sdk.ChatMode.DirectPlayback,
    analytics: { enabled: false },
    persistentChat: false,
    callbacks,
  });
  return {
    connect: () => manager.connect(),
    disconnect: () => manager.disconnect(),
    speak: text => manager.speak({ type: "text", input: text }),
  };
}
