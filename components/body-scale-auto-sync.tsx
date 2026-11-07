import { useEffect, useRef } from "react";
import { useBodyStore } from "@/lib/body-store";
import { syncBodyWeighIns } from "@/lib/health-connect-body-sync";

/**
 * Автосинхронизация умных весов при запуске приложения: после готовности
 * локальных хранилищ один раз тянет взвешивания из Health Connect.
 * Частота ограничена внутри syncBodyWeighIns (не чаще раза в 10 минут),
 * а ручная синхронизация из настроек идёт в обход троттлинга.
 */
export function BodyScaleAutoSync() {
  const { ready, addMeasurement } = useBodyStore();
  const addMeasurementRef = useRef(addMeasurement);
  useEffect(() => {
    addMeasurementRef.current = addMeasurement;
  });
  useEffect(() => {
    if (!ready) return;
    void syncBodyWeighIns({ addMeasurement: (input) => addMeasurementRef.current(input) }).catch(() => undefined);
  }, [ready]);
  return null;
}
