# ST-09 — واکنش و پیگیری

- Angular Material responsive single worklist for nurse, doctor and HV manager. All events read from scoped SQL APIs; no simulated success or client database.
- Nurse: report a physically observed delayed event linked to a real stopped/completed transfusion and record symptom codes, summary, urgent actions.
- Doctor: independent diagnosis/severity/causality assessment with user-supplied clinical judgment, not automatic calculation.
- HV: evidence investigations, confirm/close with reason; open RCA, append causes, assign corrective action, independently verify completion and close the RCA case.
- Events, physician assessments and investigations are immutable append-only historical records; workflows use rowversion to reject stale changes.
- Workflow cannot autonomously stop blood flow, trigger an on-call response, or submit a national report. Hospital clinical SOP and UAT remain release gates.
