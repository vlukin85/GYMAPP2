import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { useWorkoutStore } from "@/lib/workout-store";

const PENDING_BACKUP_KEY = "gym-diary-pending-backup-v1";

export function TrainingBackupSync() {
  const { ready, oneRmFormula, plateStepKg, barbellProfile, personalRecords, restoreTrainingBackup } = useWorkoutStore();
  const restored = useRef(false);
  const lastQueuedSnapshot = useRef("");
  const backupQuery = trpc.trainingBackup.get.useQuery(undefined, { enabled: ready });
  const saveMutation = trpc.trainingBackup.save.useMutation();

  useEffect(() => {
    if (!ready || backupQuery.isLoading || restored.current) return;
    restored.current = true;
    if (!backupQuery.data?.snapshotJson || Object.keys(personalRecords).length > 0) return;
    try {
      restoreTrainingBackup(JSON.parse(backupQuery.data.snapshotJson));
    } catch {
      // The local profile remains usable when an old or malformed snapshot cannot be parsed.
    }
  }, [ready, backupQuery.isLoading, backupQuery.data, personalRecords, restoreTrainingBackup]);

  useEffect(() => {
    if (!ready || backupQuery.isLoading || !restored.current) return;
    const snapshotJson = JSON.stringify({ oneRmFormula, plateStepKg, barbellProfile, personalRecords });
    if (snapshotJson === lastQueuedSnapshot.current) return;
    lastQueuedSnapshot.current = snapshotJson;
    const timer = setTimeout(() => { saveMutation.mutate({ snapshotJson }, { onSuccess: () => AsyncStorage.removeItem(PENDING_BACKUP_KEY), onError: () => AsyncStorage.setItem(PENDING_BACKUP_KEY, snapshotJson) }); }, 700);
    return () => clearTimeout(timer);
  }, [ready, backupQuery.isLoading, oneRmFormula, plateStepKg, barbellProfile, personalRecords, saveMutation]);

  useEffect(() => {
    if (!ready || backupQuery.isLoading || !restored.current) return;
    AsyncStorage.getItem(PENDING_BACKUP_KEY).then((snapshotJson) => {
      if (!snapshotJson) return;
      saveMutation.mutate({ snapshotJson }, { onSuccess: () => AsyncStorage.removeItem(PENDING_BACKUP_KEY) });
    });
  }, [ready, backupQuery.isLoading, saveMutation]);

  return null;
}
