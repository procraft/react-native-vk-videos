import { useEffect, useRef, useState } from 'react';
import type { VkVideoPlayerHandle } from '../types/VkVideoPlayerTypes';
import { VkVideoEventName, type VkPlayerInjectFn } from '../types/vkPlayerTypes';
import { createInjectUnmuteScript } from '../utils/injectScript';

export function useAutoUnmute(
  autoUnmute: boolean,
  injectScript: VkPlayerInjectFn,
  subscribeEvent: VkVideoPlayerHandle['on']
) {
  const [muted, setMuted] = useState(false);
  const mutedLatest = useRef(muted);
  mutedLatest.current = muted;

  useEffect(() => {
    const disposeres = [
      subscribeEvent(VkVideoEventName.VOLUMECHANGE, ({ data }) => setMuted(data.muted)),
      subscribeEvent(VkVideoEventName.ISMUTED, ({ data }) => setMuted(data)),
    ].filter((d) => d != null);
    return () => disposeres.forEach((d) => d());
  }, [subscribeEvent]);
  useEffect(() => {
    let stateLocal = { needUnmute: muted && autoUnmute };

    if (stateLocal.needUnmute) {
      (async () => {
        let tries = 0;
        while (tries < 20 && mutedLatest.current && stateLocal.needUnmute) {
          injectScript(createInjectUnmuteScript).then(() => {});
          await new Promise((resolve) => setTimeout(resolve, 3000));
          tries++;
        }
      })();
    }

    return () => {
      stateLocal.needUnmute = false;
    };
  }, [muted, autoUnmute, injectScript]);
}
