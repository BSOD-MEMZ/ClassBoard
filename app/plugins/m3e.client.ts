// Only import the M3E components actually used — saves ~530KB vs @m3e/web/all (~944KB → ~414KB)
import "@m3e/web/theme";
import "@m3e/web/app-bar";
import "@m3e/web/icon-button";
import "@m3e/web/nav-bar";
import "@m3e/web/card";
import "@m3e/web/button";
import "@m3e/web/button-group";
import "@m3e/web/dialog";
import "@m3e/web/list";
import "@m3e/web/progress-indicator";
import "@m3e/web/slider";
import "@m3e/web/snackbar";

export default defineNuxtPlugin(() => {
  // M3E custom elements registered via individual imports above
});
