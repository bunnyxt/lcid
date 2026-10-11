import { copyFileSync } from 'node:fs';

// The crawler commits this file before deployment. Serve the exact deployed
// snapshot from the CDN instead of invoking a function for the full catalog.
copyFileSync('problems_all.json', 'build/info.json');
