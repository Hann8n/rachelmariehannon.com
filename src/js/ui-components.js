import {
  provideFluentDesignSystem,
  fluentButton,
  fluentDialog,
} from "https://esm.sh/@fluentui/web-components";

try {
  provideFluentDesignSystem().register(fluentButton(), fluentDialog());
} catch (error) {
  console.warn("Fluent UI component registration failed; using native fallback.", error);
}
