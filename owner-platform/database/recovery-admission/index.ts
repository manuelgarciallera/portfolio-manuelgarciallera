import { migrations as objects } from '../object-storage';
import * as migration_20260911_062311_recovery_admission from './20260911_062311_recovery_admission';

export const migrations = [
  ...objects,
  {
    up: migration_20260911_062311_recovery_admission.up,
    down: migration_20260911_062311_recovery_admission.down,
    name: '20260911_062311_recovery_admission'
  },
];
