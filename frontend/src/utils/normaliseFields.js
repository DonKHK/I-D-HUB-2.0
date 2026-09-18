/**
 * normaliseFields.js — one-time field-name normalisation.
 *
 * Master schema = Submit Idea (see utils/fields.js). This module converts legacy
 * project / idea documents to the canonical keys. It is a pure function so it can
 * run in Firestore mode, in the localStorage fallback, and in tests.
 *
 * Order of operations (never loses data):
 *   1. copy the legacy value to the canonical key (only when that key is empty)
 *   2. merge conditional sources — the legacy key is dropped ONLY when its value
 *      was actually moved
 *   3. drop keys that have no meaning anywhere anymore
 *   4. mark the document with `_fieldsNormalised` so the migration never re-runs
 */
import {
  PROJECT_KEY_RENAMES,
  PROJECT_MERGE_KEYS,
  PROJECT_DROP_KEYS,
  STAGE_KEY_RENAMES,
  STAGE_STATUS_RENAMES,
  IDEA_KEY_RENAMES,
  IDEA_DROP_KEYS,
} from './fields';

const isEmpty = (value) => value === undefined || value === null || value === '';

/** Apply a `{ legacy: canonical }` rename map in place. Returns true when something moved. */
function renameKeys(target, renames) {
  let changed = false;
  Object.entries(renames).forEach(([legacy, canonical]) => {
    if (legacy === canonical || !(legacy in target)) return;
    if (isEmpty(target[legacy])) {
      delete target[legacy];
      changed = true;
      return;
    }
    if (isEmpty(target[canonical])) target[canonical] = target[legacy];
    delete target[legacy];
    changed = true;
  });
  return changed;
}

/** Merge `{ source: target }` pairs — drop the source only when the value was moved. */
function mergeKeys(target, merges) {
  let changed = false;
  Object.entries(merges).forEach(([source, canonical]) => {
    if (!(source in target)) return;
    if (isEmpty(target[source])) {
      delete target[source];
      changed = true;
      return;
    }
    if (isEmpty(target[canonical])) {
      target[canonical] = target[source];
      delete target[source];
      changed = true;
    }
    // When both hold a different value the legacy key is kept so nothing is lost.
  });
  return changed;
}

/** Canonicalise one item of `project.stages[]`. */
export function normaliseStageDoc(stage) {
  if (!stage || typeof stage !== 'object') return stage;
  const next = { ...stage };
  renameKeys(next, STAGE_KEY_RENAMES);
  if (STAGE_STATUS_RENAMES[next.stageStatus]) next.stageStatus = STAGE_STATUS_RENAMES[next.stageStatus];
  return next;
}

/**
 * Canonicalise a project document.
 * @param {object} project
 * @param {{ mark?: boolean }} [options] `mark: false` keeps `_fieldsNormalised` off
 *        (used when we only want the preview values).
 */
export function normaliseProjectDoc(project, { mark = true } = {}) {
  if (!project || typeof project !== 'object') return project;
  if (mark && project._fieldsNormalised) return project;

  const next = { ...project };

  renameKeys(next, PROJECT_KEY_RENAMES);
  mergeKeys(next, PROJECT_MERGE_KEYS);
  PROJECT_DROP_KEYS.forEach((key) => {
    if (key in next) delete next[key];
  });

  if (Array.isArray(next.stages)) next.stages = next.stages.map((stage) => normaliseStageDoc(stage));

  // Idea-converted projects used to copy the full background into the short description.
  if (next.description && next.description === next.background) next.description = '';

  if (mark) next._fieldsNormalised = true;
  return next;
}

/**
 * Canonicalise an idea document. `oneLineDesc` / `shortDescription` /
 * `innovativeScore` are intentionally preserved (see IDEA_DROP_KEYS).
 */
export function normaliseIdeaDoc(idea, { mark = true } = {}) {
  if (!idea || typeof idea !== 'object') return idea;
  if (mark && idea._fieldsNormalised) return idea;

  const next = { ...idea };
  renameKeys(next, IDEA_KEY_RENAMES);
  mergeKeys(next, PROJECT_MERGE_KEYS);
  IDEA_DROP_KEYS.forEach((key) => {
    if (key in next) delete next[key];
  });

  if (mark) next._fieldsNormalised = true;
  return next;
}

/** `{ legacy: canonical }` maps, exported for tests / diagnostics. */
export const NORMALISATION_MAPS = { PROJECT_KEY_RENAMES, PROJECT_MERGE_KEYS, PROJECT_DROP_KEYS, IDEA_KEY_RENAMES };

/**
 * Build the Firestore `setDoc(..., { merge: true })` payload for a normalised doc:
 * the canonical values plus a deleteField() sentinel for every legacy key.
 * @param {object} original  the document as loaded from Firestore
 * @param {object} normalised the result of normaliseProjectDoc / normaliseIdeaDoc
 * @param {Function} deleteFieldFn the Firestore `deleteField` sentinel factory
 */
export function buildNormalisationPayload(original, normalised, deleteFieldFn) {
  const payload = { ...normalised };
  Object.keys(original || {}).forEach((key) => {
    if (!(key in payload)) payload[key] = deleteFieldFn();
  });
  delete payload.id; // never rewrite the document id
  return payload;
}
