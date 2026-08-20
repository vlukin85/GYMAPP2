export function getVkRedirectUri(appId: string) {
  return `vk${appId}://vk.ru/blank.html`;
}

export function buildVkAuthorizeUrl({ appId, verifier, challenge, state }: { appId: string; verifier: string; challenge: string; state: string }) {
  const query = new URLSearchParams({
    response_type: "code",
    client_id: appId,
    redirect_uri: getVkRedirectUri(appId),
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    scope: "wall photos",
  });
  return { url: `https://id.vk.ru/authorize?${query.toString()}`, verifier };
}
