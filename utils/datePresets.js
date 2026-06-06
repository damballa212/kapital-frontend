// Calcula los 5 rangos de fecha para el selector de Reports.
// Acepta `now` para poder ser testeado con fechas fijas.
export function getDatePresets(now = new Date()) {
  const today    = now.toISOString().split("T")[0];
  const firstDay = today.slice(0, 8) + "01";

  const lm1 = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
  const lm2 = new Date(now.getFullYear(), now.getMonth(),     0).toISOString().split("T")[0];
  const d90 = new Date(+now - 90 * 86_400_000).toISOString().split("T")[0];

  // ISO week: lunes=inicio. getDay() retorna 0=Dom, por eso el caso especial.
  const dayOfWeek  = now.getDay();
  const daysToMon  = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mon = new Date(now);
  mon.setDate(now.getDate() - daysToMon);

  return [
    ["Hoy",              today,                          today  ],
    ["Esta semana",      mon.toISOString().split("T")[0], today  ],
    ["Mes actual",       firstDay,                        today  ],
    ["Mes pasado",       lm1,                             lm2   ],
    ["Últimos 90 días",  d90,                             today  ],
  ];
}
