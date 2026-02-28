import {
  provideFASTDesignSystem,
  fastButton,
  fastDialog,
} from "https://esm.sh/@microsoft/fast-components@2.30.6";

try {
  provideFASTDesignSystem().register(fastButton(), fastDialog());
} catch (error) {
  console.warn("FAST component registration failed; using native fallback.", error);
}
