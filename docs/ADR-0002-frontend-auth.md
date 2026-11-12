# ADR-0002: Hemo BFF frontend auth

Frontend now has a real user/password form. It obtains an XSRF-TOKEN cookie through /api/v1/auth/csrf, posts login with the Angular HttpClient X-XSRF-TOKEN header, then queries /api/v1/auth/session. No token or password is stored in localStorage/sessionStorage. Session state is memory-only; browser cookie is HttpOnly, signed and encrypted by ASP.NET Core. On refresh, the guard fetches session from the backend.

UI areas are filtered by role grants returned by the backend and guards block unauthorized *navigation*. This is a convenience only; every clinical endpoint must check permission and facility/department scope independently on the server. The listed area pages remain placeholder screens.

A SQL Server instance with the existing Hemo sec.* schema and an explicitly bootstrapped System Administrator is required to exercise the successful login flow. The Backend SQL Server 2022 workflow now validates real login, session, global permission and logout against the full baseline. Frontend build and smoke tests do not prove browser E2E or multi-facility role isolation.

Deployment must use a same-origin web/API proxy, HTTPS, persisted ASP.NET Core Data Protection keys, and a hardened reverse proxy. Login errors are generic to avoid user enumeration.
