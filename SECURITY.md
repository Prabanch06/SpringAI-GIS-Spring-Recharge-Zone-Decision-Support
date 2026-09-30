# SpringAI-GIS Security Policy & Hardening Baseline (MVP-AC-050)

## 1. Authentication & Session Security
- **JWT Token Lifetime**: Access tokens expire in 60 minutes; refresh tokens expire in 7 days.
- **Refresh Token Rotation**: Each token refresh cycle invalidates the previous refresh token, mitigating replay attacks.
- **Password Storage**: Passwords hashed using Argon2id / PBKDF2 with salt.
- **Role-Based Access Control (RBAC)**: Enforces role permissions (Viewer cannot alter springs, upload datasets, train models, or approve ground-truth observations).

## 2. Injection & Input Sanitization
- **SQL & PostGIS Injection**: Parameterized SQL queries via ORM / Knex / PostGIS bindings; raw string concatenations strictly prohibited.
- **Cross-Site Scripting (XSS)**: Automatic React DOM escaping and strict `Content-Security-Policy`.
- **Cross-Origin Resource Sharing (CORS)**: Restricted origins configured via environment variables.

## 3. Geospatial File Upload Security
- **MIME & Magic Byte Verification**: Uploaded GeoJSON, GeoTIFF, and CSV files are validated by parser headers before storage.
- **CRS Validation**: Coordinate Reference Systems strictly checked against EPSG registry (`EPSG:4326`, `EPSG:32644`, `EPSG:3857`). Malformed or out-of-bounds geometries are rejected.
- **File Size Limits**: Max payload size capped at 25MB to prevent memory exhaustion DoS attacks.

## 4. Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production HTTPS)

## 5. Audit Logging & Provenance
- All authentication events, role transitions, spring registrations, springshed delineations, and field validation decisions are immutably logged with timestamp, user ID, role, and model version.
