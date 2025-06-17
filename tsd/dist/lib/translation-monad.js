var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function createTranslationMonad(value) {
  return {
    map(fn) {
      if (value === void 0) {
        return createTranslationMonad();
      }
      try {
        return createTranslationMonad(fn(value));
      } catch (error) {
        console.error("[TSd] Error in monad map:", error);
        return createTranslationMonad();
      }
    },
    flatMap(fn) {
      if (value === void 0) {
        return createTranslationMonad();
      }
      try {
        const result = fn(value);
        if (result && typeof result.then === "function") {
          return createAsyncTranslationMonad(
            result.then((m) => m.value())
          );
        }
        return result;
      } catch (error) {
        console.error("[TSd] Error in monad flatMap:", error);
        return createTranslationMonad();
      }
    },
    getOrElse(defaultValue) {
      return value ?? defaultValue;
    },
    value() {
      return value;
    }
  };
}
__name(createTranslationMonad, "createTranslationMonad");
function createAsyncTranslationMonad(promise) {
  const asyncValue = promise.catch((error) => {
    console.error("[TSd] Async monad error:", error);
    return void 0;
  });
  return {
    map(fn) {
      const mappedPromise = asyncValue.then((val) => {
        if (val === void 0) return void 0;
        try {
          return fn(val);
        } catch (error) {
          console.error("[TSd] Error in async monad map:", error);
          return void 0;
        }
      });
      return createAsyncTranslationMonad(mappedPromise);
    },
    flatMap(fn) {
      const flatMappedPromise = asyncValue.then(async (val) => {
        if (val === void 0) return void 0;
        try {
          const result = await fn(val);
          return result.value();
        } catch (error) {
          console.error("[TSd] Error in async monad flatMap:", error);
          return void 0;
        }
      });
      return createAsyncTranslationMonad(flatMappedPromise);
    },
    async getOrElse(defaultValue) {
      const val = await asyncValue;
      return val ?? defaultValue;
    },
    async value() {
      return asyncValue;
    }
  };
}
__name(createAsyncTranslationMonad, "createAsyncTranslationMonad");
function chainTranslations(...monads) {
  const values = monads.map((m) => m.value()).filter((v) => v !== void 0);
  return createTranslationMonad(values.length > 0 ? values : void 0);
}
__name(chainTranslations, "chainTranslations");
function failedTranslation(error) {
  if (error) {
    console.error("[TSd] Translation failed:", error);
  }
  return createTranslationMonad();
}
__name(failedTranslation, "failedTranslation");
export {
  chainTranslations,
  createAsyncTranslationMonad,
  createTranslationMonad,
  failedTranslation
};
//# sourceMappingURL=translation-monad.js.map
