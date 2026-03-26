# Debug Session: Zap ReferenceError

## symptoms
- **expected**: `JobCard` renders with a Zap icon in the "Unlock Growth Phase" button.
- **actual**: App crashes with `ReferenceError: Zap is not defined`.
- **errors**: `Uncaught ReferenceError: Zap is not defined at JobCard (JobCard.jsx:103:10)`.
- **reproduction**: Navigate to Discovery page where jobs are rendered in `JobCard` components.
- **timeline**: Occurred immediately after adding the Growth action button.

## investigation
- `JobCard.jsx` uses `<Zap ... />` in the new Growth button.
- Checking imports in `JobCard.jsx`: `import { MapPin, DollarSign, Building2, ExternalLink, Sparkles, Send, Globe } from 'lucide-react';`
- `Zap` is missing from the destructuring import.

## root cause
Missing `Zap` import in `JobCard.jsx`.

## resolution
Fixed by adding `Zap` to the `lucide-react` import in `JobCard.jsx`.
Refactored `DiscoveryPage.jsx` to use centralized `api` service for consistency.
Verification: Component now renders correctly without ReferenceError.

Status: RESOLVED
