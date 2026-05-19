import { useEffect, type RefObject } from "react";

export function useMaterializeInit(
  ref: RefObject<HTMLElement | null>,
  componentName: string,
  options?: any,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof (window as any).M === "undefined") return;
    const Component = (window as any).M[componentName];
    if (!Component?.init) return;
    const instances = Component.init(el, options);
    return () => {
      if (instances?.destroy) instances.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}
