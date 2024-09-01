// eslint-disable-next-line import/extensions, import/no-unresolved
import 'vuetify/styles';
// eslint-disable-next-line import/extensions, import/no-unresolved
import * as components from 'vuetify/components';
// eslint-disable-next-line import/extensions, import/no-unresolved
import * as directives from 'vuetify/directives';
// eslint-disable-next-line import/extensions, import/no-unresolved
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVuetify } from 'vuetify';
import ca from 'vuetify/lib/locale/ca.mjs';
import en from 'vuetify/lib/locale/en.mjs';
import es from 'vuetify/lib/locale/es.mjs';
import colors from 'vuetify/lib/util/colors.mjs';
import {
  mdiHome,
  mdiMagnify,
  mdiArrowLeft,
  mdiCalendarMonth,
  mdiOpenInNew,
  mdiMinusBox,
  mdiPlusBox,
} from '@mdi/js';

const defaultTheme =
  import.meta.env.VITE_THEME ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const defaults = {
  VCardActions: {
    VBtn: {
      ripple: false,
      variant: 'elevated',
      color: 'primary',
    },
  },
  VBtn: {
    ripple: false,
    variant: 'elevated',
    color: 'primary',
  },
  VSelect: {
    variant: 'outlined',
    density: 'compact',
  },
  VCombobox: {
    variant: 'outlined',
    density: 'compact',
  },
  VFileInput: {
    variant: 'outlined',
    density: 'compact',
  },
  VTextField: {
    variant: 'outlined',
    density: 'compact',
  },
};

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      home: mdiHome,
      search: mdiMagnify,
      back: mdiArrowLeft,
      calendar: mdiCalendarMonth,
      'open-in-new': mdiOpenInNew,
      minus: mdiMinusBox,
      plus: mdiPlusBox,
    },
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme,
    themes: {
      light: {
        colors: {
          background: colors.blueGrey.lighten3,
          surface: colors.blueGrey.lighten3,
          primary: colors.teal.darken1,
          secondary: colors.teal.lighten1,
          success: colors.green.base,
          warning: colors.yellow.base,
          error: colors.red.base,
          info: colors.blue.base,
        },
      },
      dark: {
        colors: {
          background: colors.blueGrey.darken3,
          surface: colors.blueGrey.darken3,
          primary: colors.teal.darken1,
          secondary: colors.teal.darken3,
          success: colors.green.base,
          warning: colors.yellow.base,
          error: colors.red.base,
          info: colors.blue.base,
        },
      },
    },
  },
  lang: {
    locales: { ca, en, es },
    current: 'ca',
  },
  defaults,
});

export default vuetify;
