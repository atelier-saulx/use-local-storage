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

const setLocalStorage = (key, value) => {
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
            : value
        )
      );
    } else {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error(e);
  }
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

  return [
    state,
    (state) => {
      setLocalStorage(key, state);
      setState(state);
    },
  ];
};

export default useLocalStorage;
