import { ensureSchema, sql } from './database'
import type { LaunchWorkspace, LaunchWorkspaceInput } from './launch-workspace'

let schemaReady: Promise<void> | undefined
export function ensureLaunchSchema(): Promise<void> {
  if (!schemaReady) schemaReady = (async () => {
    await ensureSchema()
    await sql`create table if not exists launch_workspaces (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      title text not null,
      payload jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`
    await sql`create index if not exists launch_workspaces_user_idx on launch_workspaces(user_id)`
  })().catch(error => { schemaReady = undefined; throw error })
  return schemaReady
}
export class LaunchLimitError extends Error {
  constructor(public limit: number) { super(`Your plan allows ${limit} launch workspaces. Remove a workspace or upgrade to continue.`) }
}
function mapRow(row: Record<string, unknown>): LaunchWorkspace {
  return { id: String(row.id), title: String(row.title), payload: row.payload as LaunchWorkspaceInput, createdAt: new Date(row.created_at as string).toISOString(), updatedAt: new Date(row.updated_at as string).toISOString() }
}
export async function listLaunches(userId: string): Promise<LaunchWorkspace[]> {
  await ensureLaunchSchema()
  const rows = await sql`select id,title,payload,created_at,updated_at from launch_workspaces where user_id=${userId} order by updated_at desc`
  return rows.map(mapRow)
}
export async function createLaunch(userId: string, payload: LaunchWorkspaceInput): Promise<LaunchWorkspace> {
  await ensureLaunchSchema()
  return sql.begin(async tx => {
    // Lock the account row so concurrent creates cannot bypass plan capacity.
    const users = await tx`select plan from users where id=${userId} for update`
    if (!users.length) throw new Error('Account unavailable')
    const limit = users[0].plan === 'pro' ? 50 : 3
    const counts = await tx`select count(*)::int as count from launch_workspaces where user_id=${userId}`
    if (Number(counts[0]?.count ?? 0) >= limit) throw new LaunchLimitError(limit)
    const rows = await tx`insert into launch_workspaces(user_id,title,payload) values(${userId},${payload.title},${tx.json(payload as never)}) returning id,title,payload,created_at,updated_at`
    return mapRow(rows[0])
  })
}
export async function getLaunch(userId: string, id: string): Promise<LaunchWorkspace | null> {
  await ensureLaunchSchema()
  const rows = await sql`select id,title,payload,created_at,updated_at from launch_workspaces where user_id=${userId} and id=${id}`
  return rows[0] ? mapRow(rows[0]) : null
}
export async function updateLaunch(userId: string, id: string, payload: LaunchWorkspaceInput): Promise<LaunchWorkspace | null> {
  await ensureLaunchSchema()
  const rows = await sql`update launch_workspaces set title=${payload.title},payload=${sql.json(payload as never)},updated_at=now() where user_id=${userId} and id=${id} returning id,title,payload,created_at,updated_at`
  return rows[0] ? mapRow(rows[0]) : null
}
export async function deleteLaunch(userId: string, id: string): Promise<boolean> {
  await ensureLaunchSchema()
  const rows = await sql`delete from launch_workspaces where user_id=${userId} and id=${id} returning id`
  return rows.length > 0
}
