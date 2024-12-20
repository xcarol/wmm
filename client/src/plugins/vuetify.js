// eslint-disable-next-line import/extensions, import/no-unresolved
import 'vuetify/styles';
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
  mdiMagnify,
  mdiArrowLeft,
  mdiCalendarMonth,
  mdiOpenInNew,
  mdiMinusBox,
  mdiPlusBox,
  mdiInvoiceTextArrowRightOutline,
  mdiTrashCanOutline,
  mdiRefresh,
  mdiConnection,
} from '@mdi/js';

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const defaultTheme = import.meta.env.VITE_THEME || (mediaQuery.matches ? 'dark' : 'light');

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
  VCardTitle: {
    style: 'white-space: normal; text-overflow: initial; overflow: visible;',
  },
  VCardSubtitle: {
    style: 'white-space: normal; text-overflow: initial; overflow: visible;',
  },
  VCardText: {
    style: 'white-space: normal; text-overflow: initial; overflow: visible;',
  },
  VListItemTitle: {
    style: 'white-space: normal; text-overflow: initial; overflow: visible;',
  },
  VListItemSubtitle: {
    style: 'white-space: normal; text-overflow: initial; overflow: visible; display: block;',
  },
};

const darkColorsDevelopment = {
  background: colors.blueGrey.darken3,
  surface: colors.blueGrey.darken3,
  primary: colors.teal.darken1,
  secondary: colors.teal.darken3,
};

const lightColorsDevelopment = {
  background: colors.blueGrey.lighten3,
  surface: colors.blueGrey.lighten3,
  primary: colors.teal.darken1,
  secondary: colors.teal.lighten1,
};

const darkColorsProduction = {
  primary: colors.grey.lighten1,
  secondary: colors.grey.darken1,
};

const lightColorsProduction = {
  primary: colors.grey.lighten1,
  secondary: colors.grey.darken1,
};

const vuetify = createVuetify({
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      search: mdiMagnify,
      back: mdiArrowLeft,
      calendar: mdiCalendarMonth,
      'open-in-new': mdiOpenInNew,
      minus: mdiMinusBox,
      plus: mdiPlusBox,
      'show-drawer': mdiInvoiceTextArrowRightOutline,
      remove: mdiTrashCanOutline,
      refresh: mdiRefresh,
      reconnect: mdiConnection,
    },
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme,
    themes: {
      light: {
        colors:
          import.meta.env.MODE === 'production' ? lightColorsProduction : lightColorsDevelopment,
      },
      dark: {
        colors:
          import.meta.env.MODE === 'production' ? darkColorsProduction : darkColorsDevelopment,
      },
    },
  },
  lang: {
    locales: { ca, en, es },
    current: 'ca',
  },
  defaults,
});

mediaQuery.addEventListener('change', (e) => {
  vuetify.theme.global.name.value = e.matches ? 'dark' : 'light';
});

export default vuetify;
