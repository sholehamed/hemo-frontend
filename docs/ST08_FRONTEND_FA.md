# ST-08 | Angular Material ward transfusion

- Role and resource guard: NURSE, DOCTOR, HV_MANAGER or SYSTEM_ADMIN may navigate; actual permission and facility/department/encounter scope are enforced by Backend per request.
- NURSE may prepare a received issue, document baseline, verify bedside checklist, record vitals, then start, stop or complete (according to Backend permissions).
- Database maintains append-only vitals and actions and an independently signed finished record.
- Doctor sees authorized monitoring data, without the nurse's start/complete permissions.
- No heuristic patient-specific clinical threshold or automatic compatibility diagnosis. Explicit manual AlertFlag is a documented observation, not a validated clinical alarm.
- Dates are saved UTC; displayed Jalali. Actual physical bedside verification, validated barcode reader, approved SOP and clinical UAT remain required before go-live.
