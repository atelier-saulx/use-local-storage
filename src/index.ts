import { useEffect, useCallback } from "react";
import useGlobalState, { setGlobalState } from "@based/use-global-state";

let listenerMap: Map<string, number> | null = null;
const listener = ({ key, newValue }: StorageEvent) => {
  if (key) {
    setGlobalState(`__local__${key}`, parseLocalStorage(newValue));
  }
};

const parseLocalStorage = (value: string | null): any => {
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

export const setLocalStorage = (key: string, value: any): any => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else if (typeof value === "object") {
      localStorage.setItem(
        key,
        JSON.stringify(
          value instanceof Set
            ? {
                __set__: Array.from(value),
              }
            : value,
        ),
      );
    } else {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error(e);
  }

  return setGlobalState(`__local__${key}`, value);
};

export const getLocalStorage = (key: string): any => {
  try {
    const storage = localStorage.getItem(key);
    return parseLocalStorage(storage);
  } catch (e) {
    console.warn("no localStorage available");
  }

  return null;
};

const useLocalStorage = <T = any>(
  key: string,
  defaultValue?: T,
): [T, (state: T) => void] => {
  const [state] = useGlobalState<T>(
    `__local__${key}`,
    () => getLocalStorage(key) || defaultValue,
  );

  useEffect(() => {
    if (!listenerMap) {
      listenerMap = new Map();
      window.addEventListener("storage", listener);
    }

    const cnt = listenerMap.get(key) || 0;
    listenerMap.set(key, cnt + 1);

    return () => {
      const cnt = listenerMap?.get(key) || 0;
      if (cnt > 1) {
        listenerMap?.set(key, cnt - 1);
      } else {
        listenerMap?.delete(key);
      }
      if (listenerMap && !listenerMap.size) {
        listenerMap = null;
        window.removeEventListener("storage", listener);
      }
    };
  }, [key]);

  return [state, useCallback((state: T) => setLocalStorage(key, state), [key])];
};

export default useLocalStorage;
