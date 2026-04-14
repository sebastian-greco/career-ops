#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function usage() {
  console.log(`Usage:
  node validate-resume-json.mjs <resume.json>
`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateWebsite(value, path) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${path} must be an object`);
  assert(typeof value.url === 'string', `${path}.url must be a string`);
  assert(typeof value.label === 'string', `${path}.label must be a string`);
}

function validateProjectItem(item, index) {
  const path = `sections.projects.items[${index}]`;
  assert(item && typeof item === 'object' && !Array.isArray(item), `${path} must be an object`);
  assert(typeof item.id === 'string' && item.id.length > 0, `${path}.id must be a non-empty string`);
  assert(typeof item.hidden === 'boolean', `${path}.hidden must be a boolean`);
  assert(typeof item.name === 'string', `${path}.name must be a string`);
  assert(typeof item.period === 'string', `${path}.period must be a string`);
  assert(typeof item.description === 'string', `${path}.description must be a string`);
  validateWebsite(item.website, `${path}.website`);
}

function validateResume(data) {
  assert(data && typeof data === 'object' && !Array.isArray(data), 'Top-level JSON must be an object');
  assert(data.basics && typeof data.basics === 'object', 'basics must exist');
  assert(typeof data.basics.name === 'string' && data.basics.name.length > 0, 'basics.name must be a non-empty string');
  assert(typeof data.basics.headline === 'string', 'basics.headline must be a string');

  assert(data.summary && typeof data.summary === 'object', 'summary must exist');
  assert(typeof data.summary.content === 'string', 'summary.content must be a string');

  assert(data.sections && typeof data.sections === 'object', 'sections must exist');

  if (data.sections.projects) {
    assert(Array.isArray(data.sections.projects.items), 'sections.projects.items must be an array');
    data.sections.projects.items.forEach(validateProjectItem);
  }

  if (Array.isArray(data.customSections)) {
    for (let i = 0; i < data.customSections.length; i += 1) {
      const section = data.customSections[i];
      assert(section && typeof section === 'object', `customSections[${i}] must be an object`);
      assert(typeof section.id === 'string' && section.id.length > 0, `customSections[${i}].id must be a non-empty string`);
      assert(Array.isArray(section.items), `customSections[${i}].items must be an array`);
    }
  }
}

function main() {
  const input = process.argv[2];
  if (!input || input === '--help' || input === '-h') {
    usage();
    if (!input || input.startsWith('-')) process.exit(input ? 0 : 1);
  }

  const filePath = resolve(input);
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }

  validateResume(data);
  console.log(JSON.stringify({ ok: true, file: filePath }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
