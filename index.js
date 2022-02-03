import { useEffect } from "react";
import useGlobalState, { setGlobalState } from "@based/use-global-state";

let listenerMap;
const listener = ({ key, newValue }) =>
  setGlobalState(`__local__${key}`, parseLocalStorage(newValue));

const parseLocalStorage = (value) => {
  if (value !== null) {
    try {
      const obj = JSON.parse(value);
      if (typeof obj === "object" && obj !== null && obj.__set__) {
        return new Set(obj.__set__);
      } else {
        return obj;
      }
    } catch (e) {}
  }
  return value;
};

const useLocalStorage = (key, defaultValue = undefined) => {
  const [state, setState] = useGlobalState(`__local__${key}`, () => {
    try {
      const storage = localStorage.getItem(key);
      return parseLocalStorage(storage) || defaultValue;
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
  }, [key, state]);

  useEffect(() => {
    if (!listenerMap) {
      listenerMap = new Map();
      window.addEventListener("storage", listener);
    }

    const cnt = listenerMap.get(key) || 0;
    listenerMap.set(key, cnt + 1);

    return () => {
      const cnt = listenerMap.get(key) || 0;
      if (cnt > 1) {
        listenerMap.set(key, cnt - 1);
      } else {
        listenerMap.delete(key);
      }
      if (!listenerMap.size) {
        listenerMap = null;
        window.removeEventListener("storage", listener);
      }
    };
  }, [key]);

  return [state, setState];
};

export default useLocalStorage;
