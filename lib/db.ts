import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Neon HTTP (serverless) SQL client.
 *
 * IMPORTANT: the plain HTTP driver does NOT propagate the Neon Auth JWT to the
 * database, so it connects as the role baked into `DATABASE_URL` (not as the
 * end user). Queries must therefore filter by `user_id` EXPLICITLY in app code.
 * The Row-Level-Security policies on `form_submissions` are defense-in-depth, not
 * the primary access boundary for this driver.
 *
 * LAZY ON PURPOSE: in this version `neon()` THROWS immediately if no connection
 * string is given, so calling it at import time would break `next build` when
 * `DATABASE_URL` is unset (env is runtime-only here). We build the client on the
 * first query via a Proxy. Usage is unchanged — `sql\`SELECT ...\`` works as a
 * tagged template, and `sql.query(...)` etc. are forwarded too.
 */
let client: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!client) {
    client = neon(process.env.DATABASE_URL!);
  }
  return client;
}

export const sql = new Proxy(function () {} as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, argArray) {
    // Tagged-template call: sql`...`
    return (getSql() as (...a: unknown[]) => unknown)(...argArray);
  },
  get(_target, prop, receiver) {
    return Reflect.get(getSql(), prop, receiver);
  },
}) as NeonQueryFunction<false, false>;
