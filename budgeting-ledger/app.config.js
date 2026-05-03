/**
 * Dynamic Expo configuration.
 *
 * Static values live in app.json. This file handles anything that must come
 * from environment variables (e.g. secrets injected by EAS Secrets at build
 * time or from a local .env.local file during development).
 *
 * Setting up secrets:
 *   EAS (CI/production):
 *     eas env:create --name GOOGLE_ANDROID_CLIENT_ID --value <your-id>
 *     eas env:create --name GOOGLE_IOS_CLIENT_ID     --value <your-id>
 *
 *   Local development:
 *     Copy .env.local.example → .env.local and fill in your values.
 *     Expo CLI picks up .env.local automatically.
 */

const { withDangerousMod, withAndroidManifest } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

const androidClientId = process.env.GOOGLE_ANDROID_CLIENT_ID ?? '';
const iosClientId     = process.env.GOOGLE_IOS_CLIENT_ID     ?? '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONFIG_DIR = path.join(__dirname, 'config', 'android');

const readConfigXml = (filename) =>
  fs.readFileSync(path.join(CONFIG_DIR, filename), 'utf8');

const writeToResXml = (cfg, filename) => {
  const xmlDir = path.join(cfg.modRequest.projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
  fs.mkdirSync(xmlDir, { recursive: true });
  fs.writeFileSync(path.join(xmlDir, filename), readConfigXml(filename));
  return cfg;
};

// ─── Config plugins ───────────────────────────────────────────────────────────

/**
 * Writes res/xml/secure_store_backup_rules.xml (Android 6–11) and
 * res/xml/secure_store_data_extraction_rules.xml (Android 12+).
 *
 * expo-secure-store's plugin sets the manifest attributes pointing to these
 * files but never writes them — that is left to the developer.
 */
const withBackupRules = (config) =>
  withDangerousMod(config, [
    'android',
    (cfg) => {
      writeToResXml(cfg, 'secure_store_backup_rules.xml');
      writeToResXml(cfg, 'secure_store_data_extraction_rules.xml');
      return cfg;
    },
  ]);

/**
 * Writes res/xml/network_security_config.xml and wires it into the manifest.
 * Blocks HTTP traffic and restricts TLS trust to the system CA bundle only.
 */
const withNetworkSecurityConfig = (config) => {
  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      writeToResXml(cfg, 'network_security_config.xml');
      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return cfg;
  });

  return config;
};

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = {
  expo: {
    name: 'budgeting-ledger',
    slug: 'budgeting-ledger',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'budgetingledger',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.teodorstrut.budgetingledger',
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: 'com.teodorstrut.budgetingledger' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [{ scheme: 'com.googleusercontent.apps.660137098982-rnidtv4vs36sd520l38rahgspt82k3mm' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      '@react-native-community/datetimepicker',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: { backgroundColor: '#000000' },
        },
      ],
      ['expo-sqlite', { useSQLCipher: true }],
      'expo-secure-store',
      'expo-background-task',
      withBackupRules,
      withNetworkSecurityConfig,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      googleAuth: {
        androidClientId,
        iosClientId,
      },
      eas: {
        projectId: '14b1caf5-ca53-45ee-b51f-dbe0bc6b89e6',
      },
    },
  },
};
