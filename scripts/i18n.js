#!/usr/bin/env node

/**
 * i18n Translation Management Script
 *
 * Usage:
 *   node scripts/i18n.js add <key> <en> <es> <ht>
 *   node scripts/i18n.js update <key> <en> <es> <ht>
 *   node scripts/i18n.js check
 *   node scripts/i18n.js get <key>
 *
 * Examples:
 *   node scripts/i18n.js add "support.newKey" "English text" "Texto en español" "Tèks kreyòl"
 *   node scripts/i18n.js update "support.transparent" "New English" "Nuevo español" "Nouvo kreyòl"
 *   node scripts/i18n.js check
 *   node scripts/i18n.js get "support.title"
 */

const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '../src/i18n');
const LANGUAGES = ['en', 'es', 'ht'];

// Load a language file
function loadLanguage(lang) {
  const filePath = path.join(I18N_DIR, `${lang}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Save a language file
function saveLanguage(lang, data) {
  const filePath = path.join(I18N_DIR, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// Get nested value from object using dot notation
function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((current, key) => current?.[key], obj);
}

// Set nested value in object using dot notation
function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Get all keys from an object (flattened with dot notation)
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Commands
const commands = {
  // Add a new translation key to all languages
  add(args) {
    const [keyPath, en, es, ht] = args;

    if (!keyPath || !en || !es || !ht) {
      console.error('Usage: node scripts/i18n.js add <key> <en> <es> <ht>');
      console.error('Example: node scripts/i18n.js add "support.newKey" "English" "Español" "Kreyòl"');
      process.exit(1);
    }

    const translations = { en, es, ht };

    for (const lang of LANGUAGES) {
      const data = loadLanguage(lang);

      if (getNestedValue(data, keyPath) !== undefined) {
        console.error(`Key "${keyPath}" already exists in ${lang}.json. Use 'update' instead.`);
        process.exit(1);
      }

      setNestedValue(data, keyPath, translations[lang]);
      saveLanguage(lang, data);
      console.log(`Added "${keyPath}" to ${lang}.json: "${translations[lang]}"`);
    }

    console.log('\nTranslation added successfully to all languages.');
  },

  // Update an existing translation key in all languages
  update(args) {
    const [keyPath, en, es, ht] = args;

    if (!keyPath || !en || !es || !ht) {
      console.error('Usage: node scripts/i18n.js update <key> <en> <es> <ht>');
      console.error('Example: node scripts/i18n.js update "support.title" "New Title" "Nuevo Título" "Nouvo Tit"');
      process.exit(1);
    }

    const translations = { en, es, ht };

    for (const lang of LANGUAGES) {
      const data = loadLanguage(lang);
      const oldValue = getNestedValue(data, keyPath);

      if (oldValue === undefined) {
        console.error(`Key "${keyPath}" does not exist in ${lang}.json. Use 'add' instead.`);
        process.exit(1);
      }

      setNestedValue(data, keyPath, translations[lang]);
      saveLanguage(lang, data);
      console.log(`Updated "${keyPath}" in ${lang}.json: "${oldValue}" -> "${translations[lang]}"`);
    }

    console.log('\nTranslation updated successfully in all languages.');
  },

  // Check for missing keys between language files
  check() {
    const allData = {};
    const allKeys = new Set();

    // Load all languages and collect all keys
    for (const lang of LANGUAGES) {
      allData[lang] = loadLanguage(lang);
      const keys = getAllKeys(allData[lang]);
      keys.forEach(key => allKeys.add(key));
    }

    // Check each language for missing keys
    let hasErrors = false;
    const missing = {};

    for (const lang of LANGUAGES) {
      missing[lang] = [];
      const langKeys = new Set(getAllKeys(allData[lang]));

      for (const key of allKeys) {
        if (!langKeys.has(key)) {
          missing[lang].push(key);
          hasErrors = true;
        }
      }
    }

    // Report results
    if (hasErrors) {
      console.log('Missing translations found:\n');
      for (const lang of LANGUAGES) {
        if (missing[lang].length > 0) {
          console.log(`${lang}.json is missing ${missing[lang].length} key(s):`);
          missing[lang].forEach(key => console.log(`  - ${key}`));
          console.log('');
        }
      }
      process.exit(1);
    } else {
      console.log(`All ${allKeys.size} translation keys are present in all ${LANGUAGES.length} languages.`);
    }
  },

  // Get a translation value from all languages
  get(args) {
    const [keyPath] = args;

    if (!keyPath) {
      console.error('Usage: node scripts/i18n.js get <key>');
      console.error('Example: node scripts/i18n.js get "support.title"');
      process.exit(1);
    }

    console.log(`Values for "${keyPath}":\n`);

    for (const lang of LANGUAGES) {
      const data = loadLanguage(lang);
      const value = getNestedValue(data, keyPath);

      if (value === undefined) {
        console.log(`  ${lang}: (not found)`);
      } else if (typeof value === 'object') {
        console.log(`  ${lang}: ${JSON.stringify(value, null, 2).split('\n').join('\n       ')}`);
      } else {
        console.log(`  ${lang}: "${value}"`);
      }
    }
  },

  // List all keys (for reference)
  list() {
    const data = loadLanguage('en');
    const keys = getAllKeys(data);

    console.log(`All translation keys (${keys.length} total):\n`);
    keys.forEach(key => console.log(`  ${key}`));
  }
};

// Main
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  console.log('i18n Translation Management Script\n');
  console.log('Commands:');
  console.log('  add <key> <en> <es> <ht>    Add a new translation to all languages');
  console.log('  update <key> <en> <es> <ht> Update an existing translation');
  console.log('  check                        Check for missing keys between languages');
  console.log('  get <key>                    Get translation values for a key');
  console.log('  list                         List all translation keys');
  console.log('\nExamples:');
  console.log('  node scripts/i18n.js add "buttons.save" "Save" "Guardar" "Sove"');
  console.log('  node scripts/i18n.js update "support.title" "Support Us" "Apóyanos" "Sipòte Nou"');
  console.log('  node scripts/i18n.js check');
  process.exit(0);
}

commands[command](args);
