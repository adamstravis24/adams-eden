const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const filesToPatch = [
  path.join(
    rootDir,
    'node_modules',
    'expo-modules-autolinking',
    'android',
    'expo-gradle-plugin',
    'expo-autolinking-settings-plugin',
    'src',
    'main',
    'kotlin',
    'expo',
    'modules',
    'plugin',
    'SettingsManager.kt'
  ),
  path.join(
    rootDir,
    'node_modules',
    'expo-modules-autolinking',
    'android',
    'expo-gradle-plugin',
    'expo-autolinking-plugin',
    'src',
    'main',
    'kotlin',
    'expo',
    'modules',
    'plugin',
    'ExpoRootProjectPlugin.kt'
  ),
  path.join(
    rootDir,
    'node_modules',
    'expo-modules-core',
    'expo-module-gradle-plugin',
    'src',
    'main',
    'kotlin',
    'expo',
    'modules',
    'plugin',
    'ExpoModulesGradlePlugin.kt'
  ),
  path.join(
    rootDir,
    'node_modules',
    'expo-modules-core',
    'expo-module-gradle-plugin',
    'src',
    'main',
    'kotlin',
    'expo',
    'modules',
    'plugin',
    'ProjectConfiguration.kt'
  ),
  path.join(
    rootDir,
    'node_modules',
    'expo-modules-core',
    'expo-module-gradle-plugin',
    'src',
    'main',
    'kotlin',
    'expo',
    'modules',
    'plugin',
    'gradle',
    'ExpoModuleExtension.kt'
  ),
];

function insertImport(source, importLine) {
  if (source.includes(importLine)) {
    return source;
  }
  const lines = source.split('\n');
  const lastImportIndex = lines.reduce(
    (acc, line, idx) => (line.startsWith('import ') ? idx : acc),
    -1
  );
  if (lastImportIndex === -1) {
    lines.splice(1, 0, importLine);
  } else {
    lines.splice(lastImportIndex + 1, 0, importLine);
  }
  return lines.join('\n');
}

function patchFile(filePath) {
  let contents;
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn('[patch-expo-autolinking] Missing file:', filePath);
    return;
  }

  let updated = contents;
  const original = contents;

  [
    'import org.gradle.internal.extensions.core.extra',
    'import org.gradle.api.plugins.ExtensionContainer',
    'import org.gradle.api.invocation.Gradle',
  ].forEach((needle) => {
    if (updated.includes(needle)) {
      updated = updated.replace(`${needle}\n`, '');
    }
  });

  if (updated.includes('.extra')) {
    updated = insertImport(updated, 'import org.gradle.api.plugins.ExtraPropertiesExtension');
  }
  updated = insertImport(updated, 'import org.gradle.api.plugins.ExtensionAware');

  if (filePath.endsWith('SettingsManager.kt')) {
    if (updated.includes('project.extra.set("coreFeatures", config.coreFeatures)')) {
      updated = updated.replace(
        'project.extra.set("coreFeatures", config.coreFeatures)',
        [
          'val extraProps = (project as ExtensionAware).extensions.extraProperties',
          '      extraProps.set("coreFeatures", config.coreFeatures)',
        ].join('\n      ')
      );
    }
    const gradleCreateNeedle =
      'settings.gradle.extensions.create("expoGradle", ExpoGradleExtension::class.java, config, autolinkingOptions, projectRoot)';
    if (updated.includes(gradleCreateNeedle)) {
      updated = updated.replace(
        gradleCreateNeedle,
        [
          '(settings.gradle as ExtensionAware).extensions.create(',
          '      "expoGradle",',
          '      ExpoGradleExtension::class.java,',
          '      config,',
          '      autolinkingOptions,',
          '      projectRoot',
          '    )',
        ].join('\n    ')
      );
    }
  }

  if (filePath.includes(path.join('expo-module-gradle-plugin', 'src', 'main', 'kotlin', 'expo', 'modules', 'plugin', 'gradle'))) {
    updated = insertImport(updated, 'import expo.modules.plugin.extra');
  }

  updated = updated.replace(/\n{3,}/g, '\n\n');

  if (updated !== original) {
    fs.writeFileSync(filePath, `${updated.trimEnd()}\n`, 'utf8');
    console.log('[patch-expo-autolinking] Patched', path.relative(rootDir, filePath));
  } else {
    console.log('[patch-expo-autolinking] Already applied for', path.relative(rootDir, filePath));
  }
}

function ensureCompatHelpers() {
  const compatContent = `package expo.modules.plugin

import org.gradle.api.plugins.ExtensionAware
import org.gradle.api.plugins.ExtraPropertiesExtension

internal val ExtensionAware.extraCompat: ExtraPropertiesExtension
  get() = (this as ExtensionAware).extensions.extraProperties

@Suppress("EXTENSION_SHADOWED_BY_MEMBER")
internal val ExtensionAware.extra: ExtraPropertiesExtension
  get() = (this as ExtensionAware).extensions.extraProperties
`;

  const compatTargets = [
    path.join(
      rootDir,
      'node_modules',
      'expo-modules-autolinking',
      'android',
      'expo-gradle-plugin',
      'expo-autolinking-plugin',
      'src',
      'main',
      'kotlin',
      'expo',
      'modules',
      'plugin',
      'ExtensionAwareCompat.kt'
    ),
    path.join(
      rootDir,
      'node_modules',
      'expo-modules-autolinking',
      'android',
      'expo-gradle-plugin',
      'expo-autolinking-settings-plugin',
      'src',
      'main',
      'kotlin',
      'expo',
      'modules',
      'plugin',
      'ExtensionAwareCompat.kt'
    ),
    path.join(
      rootDir,
      'node_modules',
      'expo-modules-core',
      'expo-module-gradle-plugin',
      'src',
      'main',
      'kotlin',
      'expo',
      'modules',
      'plugin',
      'ExtensionAwareCompat.kt'
    ),
  ];

  compatTargets.forEach((filePath) => {
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== compatContent) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, compatContent, 'utf8');
      console.log('[patch-expo-autolinking] Wrote compat helper to', path.relative(rootDir, filePath));
    }
  });
}

filesToPatch.forEach(patchFile);
ensureCompatHelpers();

