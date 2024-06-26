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
import { mdiHome, mdiMagnify } from '@mdi/js';

const defaultTheme =
  import.meta.env.VITE_THEME ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const defaults = {
  VCardActions: {
    VBtn: {
      ripple: false,
      variant: 'tonal',
      color: 'primary',
    },
  },
  VBtn: {
    ripple: false,
    variant: 'tonal',
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
          primary: colors.grey.darken3,
        },
      },
      dark: {
        colors: {
          primary: colors.grey.base,
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
