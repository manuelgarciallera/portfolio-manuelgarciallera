import { migrations as baseline } from '../baseline';
import * as migration_20260910_133129_object_storage from './20260910_133129_object_storage';

export const migrations = [
  ...baseline,
  {
    up: migration_20260910_133129_object_storage.up,
    down: migration_20260910_133129_object_storage.down,
    name: '20260910_133129_object_storage'
  },
];
