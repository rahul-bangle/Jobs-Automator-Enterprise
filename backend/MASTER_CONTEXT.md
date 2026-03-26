# MASTER_CONTEXT.md

## Workspace Overview
- **Project**: Jobs-Automator-Enterprise
- **Root**: `d:\Projects\Workspaces\job automatic appllications`
- **Backend Status**: Port 8001
- **Critical Components**: `DiscoveryEngine`, `ScoringService`, `ATSEngineV2`

## Conversation Log
| # | Role | Message |
|---|------|---------|
| 1 | User | [Previous Traceback Reporting AttributeError and RuntimeWarning] |
| 3 | Agent | I resolved the `ERR_CONNECTION_REFUSED` error by updating the hardcoded API fallback port in `DiscoveryPage.jsx` from 8000 to 8001. Frontend suggestions should now work correctly. |

## Terminal Log
- `netstat -ano | findstr :8001` (Found PID 9140)
- `taskkill /F /PID 9140`
- `uvicorn app.main:app` (Running on 8001)
