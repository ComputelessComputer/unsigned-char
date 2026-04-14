import { type UIEventHandler, useCallback, useEffect, useRef, useState } from "react";

type ScrollFadeState = {
  showBottom: boolean;
  showTop: boolean;
};

type UseScrollFadeOptions = {
  stickToBottom?: boolean;
};

export function useScrollFade<T extends HTMLElement>(options: UseScrollFadeOptions = {}) {
  const { stickToBottom = false } = options;
  const [node, setNode] = useState<T | null>(null);
  const pendingScrollFrame = useRef<number | null>(null);
  const [state, setState] = useState<ScrollFadeState>({
    showBottom: false,
    showTop: false,
  });

  const updateState = useCallback((element: T) => {
    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
    const scrollTop = Math.max(0, element.scrollTop);
    const nextState = {
      showTop: maxScrollTop > 1 && scrollTop > 1,
      showBottom: maxScrollTop > 1 && scrollTop < maxScrollTop - 1,
    };

    setState((current) =>
      current.showTop === nextState.showTop && current.showBottom === nextState.showBottom
        ? current
        : nextState,
    );
  }, []);

  const scrollToBottom = useCallback(
    (element: T | null = node) => {
      if (!element) {
        return;
      }

      const syncScrollPosition = () => {
        const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);

        if (Math.abs(element.scrollTop - maxScrollTop) > 1) {
          element.scrollTop = maxScrollTop;
        }

        updateState(element);
      };

      if (pendingScrollFrame.current !== null) {
        window.cancelAnimationFrame(pendingScrollFrame.current);
      }

      syncScrollPosition();
      pendingScrollFrame.current = window.requestAnimationFrame(() => {
        pendingScrollFrame.current = null;
        syncScrollPosition();
      });
    },
    [node, updateState],
  );

  useEffect(() => {
    if (!node) {
      return;
    }

    const update = () => {
      if (stickToBottom) {
        scrollToBottom(node);
        return;
      }

      updateState(node);
    };

    const frame = window.requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    const mutationObserver = new MutationObserver(update);

    resizeObserver.observe(node);
    mutationObserver.observe(node, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener("resize", update);

    return () => {
      window.cancelAnimationFrame(frame);
      if (pendingScrollFrame.current !== null) {
        window.cancelAnimationFrame(pendingScrollFrame.current);
        pendingScrollFrame.current = null;
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [node, scrollToBottom, stickToBottom, updateState]);

  const attachRef = useCallback((nextNode: T | null) => {
    setNode((current) => (current === nextNode ? current : nextNode));

    if (!nextNode) {
      if (pendingScrollFrame.current !== null) {
        window.cancelAnimationFrame(pendingScrollFrame.current);
        pendingScrollFrame.current = null;
      }
      setState((current) =>
        current.showBottom || current.showTop
          ? {
              showBottom: false,
              showTop: false,
            }
          : current,
      );
    }
  }, []);

  const handleScroll: UIEventHandler<T> = useCallback((event) => {
    updateState(event.currentTarget);
  }, [updateState]);

  return {
    attachRef,
    handleScroll,
    scrollToBottom,
    showBottom: state.showBottom,
    showTop: state.showTop,
  };
}
