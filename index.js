import { useEffect } from "react";
import useGlobalState from "@based/use-global-state";

const useLocalStorage = (key, defaultValue = undefined) => {
  const [state, setState] = useGlobalState(`__local__${key}`, () => {
    try {
      const storage = localStorage.getItem(key);
      if (storage !== null) {
        try {
          const obj = JSON.parse(storage);
          if (typeof obj === "object" && obj !== null && obj.__set__) {
            return new Set(obj.__set__);
          } else {
            return obj;
          }
        } catch (e) {
          return storage;
        }
      }
    } catch (e) {
      console.warn("no localStorage available");
    }

    return defaultValue;
  });

  useEffect(() => {
    try {
      if (state === null || state === undefined) {
        localStorage.removeItem(key);
      } else if (typeof state === "object") {
        localStorage.setItem(
          key,
          JSON.stringify(
            state instanceof Set
              ? {
                  __set__: Array.from(state),
                }
              : state
          )
        );
      } else {
        localStorage.setItem(key, state);
      }
    } catch (e) {
      console.error(e);
    }
  }, [state]);

  return [state, setState];
};

export default useLocalStorage;
