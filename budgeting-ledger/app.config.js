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

const appJson = require('./app.json');

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
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      googleAuth: {
        androidClientId,
        iosClientId,
      },
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      withBackupRules,
      withNetworkSecurityConfig,
    ],
  },
};
