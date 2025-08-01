import * as Sentry from "@sentry/node"
import { sentryKey } from './secrets.mjs'

const sentry = Sentry.init({
  dsn: sentryKey,
});

export default sentry;