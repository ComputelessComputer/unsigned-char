import { type UIEventHandler, useCallback, useEffect, useState } from "react";

type ScrollFadeState = {
  showBottom: boolean;
  showTop: boolean;
};

export function useScrollFade<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
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

  useEffect(() => {
    if (!node) {
      return;
    }

    const update = () => {
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
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [node, updateState]);

  const attachRef = useCallback((nextNode: T | null) => {
    setNode((current) => (current === nextNode ? current : nextNode));

    if (!nextNode) {
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
    showBottom: state.showBottom,
    showTop: state.showTop,
  };
}
