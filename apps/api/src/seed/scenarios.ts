import type { JsonObject } from '../common/json.js';
import {
  ACTORS,
  API_KEY_SCOPES,
  INVITEES,
  PROJECTS,
  type SeedActor,
  SIGN_IN_FAILURE_REASONS,
  SYSTEM_SOURCES,
} from './catalog.js';
import type { Random } from './random.js';

/**
 * One event within a flow. Actor fields default to the flow's actor. When both `before` and `after`
 * are present they describe the same fields, so a diff shows what changed rather than what was omitted.
 */
export interface ScenarioStep {
  /** Seconds after the flow starts. */
  readonly offsetSeconds: number;
  readonly eventType: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string | null;
  readonly description: string;
  readonly source: string;
  readonly metadata?: JsonObject;
  readonly before?: JsonObject | null;
  readonly after?: JsonObject | null;
  /** `null` marks a system process with no human actor. */
  readonly actor?: SeedActor | null;
  /** For unauthenticated steps, e.g. a failed sign-in knows the email but not the user id. */
  readonly anonymousEmail?: string;
}

/** A before/after pair for scenarios that pick one of several kinds of change. */
interface Change {
  readonly label: string;
  readonly before: JsonObject;
  readonly after: JsonObject;
}

export interface Scenario {
  readonly name: string;
  /** Relative frequency. */
  readonly weight: number;
  build(random: Random): readonly ScenarioStep[];
}

const admins = ACTORS.filter((actor) => actor.role !== 'MEMBER');
const anyone = (random: Random) => random.pick(ACTORS);
const anAdmin = (random: Random) => random.pick(admins);
const otherThan = (random: Random, actor: SeedActor) =>
  random.pick(ACTORS.filter((candidate) => candidate.id !== actor.id));
const sessionId = (random: Random) => `ses_${random.hex(12)}`;
const keyPrefix = (random: Random) => `af_live_${random.hex(6)}`;

export const SCENARIOS: readonly Scenario[] = [
  {
    name: 'sign in',
    weight: 18,
    build(random) {
      const actor = anyone(random);
      const method = random.pick(['password', 'sso', 'passkey']);
      return [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'AUTH',
          action: 'USER_SIGNED_IN',
          resourceType: 'SESSION',
          resourceId: sessionId(random),
          description: `Signed in with ${method === 'sso' ? 'SSO' : method}`,
          source: 'auth-service',
          metadata: { method, mfa: method !== 'passkey' && random.chance(0.7) },
        },
      ];
    },
  },
  {
    name: 'failed sign-in',
    weight: 6,
    build(random) {
      const actor = anyone(random);
      const reason = random.pick(SIGN_IN_FAILURE_REASONS);
      const attempts = random.int(1, 3);
      const steps: ScenarioStep[] = Array.from({ length: attempts }, (_, attempt) => ({
        offsetSeconds: attempt * random.int(8, 25),
        actor,
        anonymousEmail: actor.email,
        eventType: 'AUTH',
        action: 'USER_SIGN_IN_FAILED',
        resourceType: 'SESSION',
        resourceId: null,
        description:
          reason === 'account_locked'
            ? 'Sign-in blocked: account temporarily locked'
            : `Sign-in failed: ${reason === 'mfa_code_invalid' ? 'invalid MFA code' : 'invalid password'}`,
        source: 'auth-service',
        metadata: { reason, attempt: attempt + 1 },
      }));
      if (reason !== 'account_locked' && random.chance(0.75)) {
        steps.push({
          offsetSeconds: attempts * 30 + random.int(5, 40),
          actor,
          eventType: 'AUTH',
          action: 'USER_SIGNED_IN',
          resourceType: 'SESSION',
          resourceId: sessionId(random),
          description: 'Signed in with password',
          source: 'auth-service',
          metadata: { method: 'password', mfa: true, previousFailures: attempts },
        });
      }
      return steps;
    },
  },
  {
    name: 'sign out',
    weight: 5,
    build(random) {
      return [
        {
          offsetSeconds: 0,
          actor: anyone(random),
          eventType: 'AUTH',
          action: 'USER_SIGNED_OUT',
          resourceType: 'SESSION',
          resourceId: sessionId(random),
          description: 'Signed out',
          source: 'auth-service',
        },
      ];
    },
  },
  {
    name: 'enable MFA',
    weight: 2,
    build(random) {
      const actor = anyone(random);
      return [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'AUTH',
          action: 'MFA_ENABLED',
          resourceType: 'USER',
          resourceId: actor.id,
          description: 'Enabled two-factor authentication',
          source: 'web-app',
          before: { mfaEnabled: false, method: null },
          after: { mfaEnabled: true, method: random.pick(['totp', 'webauthn']) },
        },
      ];
    },
  },
  {
    name: 'change password',
    weight: 2,
    build(random) {
      const actor = anyone(random);
      return [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'AUTH',
          action: 'PASSWORD_CHANGED',
          resourceType: 'USER',
          resourceId: actor.id,
          // Credentials are never recorded, not even hashed: only that the change happened.
          description: 'Changed account password',
          source: 'web-app',
          metadata: { otherSessionsRevoked: random.chance(0.6) },
        },
      ];
    },
  },
  {
    name: 'update profile',
    weight: 6,
    build(random) {
      const actor = anyone(random);
      const change = random.pick<Change>([
        {
          label: 'time zone',
          before: { timezone: 'Europe/Berlin' },
          after: { timezone: 'Europe/Lisbon' },
        },
        { label: 'locale', before: { locale: 'en-US' }, after: { locale: 'en-GB' } },
        {
          label: 'notification preferences',
          before: { notifications: { email: true, weeklyDigest: true } },
          after: { notifications: { email: true, weeklyDigest: false } },
        },
        { label: 'job title', before: { title: 'Engineer' }, after: { title: 'Senior Engineer' } },
      ]);
      return [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'USER',
          action: 'USER_PROFILE_UPDATED',
          resourceType: 'USER',
          resourceId: actor.id,
          description: `Updated ${change.label}`,
          source: 'web-app',
          before: change.before,
          after: change.after,
        },
      ];
    },
  },
  {
    name: 'onboard teammate',
    weight: 5,
    build(random) {
      const admin = anAdmin(random);
      const invitee = random.pick(INVITEES);
      const project = random.pick(PROJECTS);
      const userId = `usr_01j${random.hex(6)}`;
      const steps: ScenarioStep[] = [
        {
          offsetSeconds: 0,
          actor: admin,
          eventType: 'USER',
          action: 'USER_INVITED',
          resourceType: 'USER',
          resourceId: userId,
          description: `Invited ${invitee.name} to the organization`,
          source: 'admin-dashboard',
          after: { email: invitee.email, name: invitee.name, role: 'MEMBER', status: 'invited' },
          metadata: { inviteExpiresInDays: 7 },
        },
        {
          offsetSeconds: random.int(20, 90),
          actor: admin,
          eventType: 'PERMISSION',
          action: 'MEMBER_ADDED_TO_PROJECT',
          resourceType: 'PROJECT',
          resourceId: project.id,
          description: `Added ${invitee.name} to ${project.name} as viewer`,
          source: 'admin-dashboard',
          after: { userId, projectRole: 'VIEWER' },
        },
      ];
      if (random.chance(0.5)) {
        steps.push({
          offsetSeconds: random.int(120, 400),
          actor: admin,
          eventType: 'PERMISSION',
          action: 'PROJECT_ROLE_CHANGED',
          resourceType: 'PROJECT',
          resourceId: project.id,
          description: `Changed ${invitee.name}'s role in ${project.name} from viewer to editor`,
          source: 'admin-dashboard',
          before: { userId, projectRole: 'VIEWER' },
          after: { userId, projectRole: 'EDITOR' },
        });
      }
      return steps;
    },
  },
  {
    name: 'change organization role',
    weight: 4,
    build(random) {
      const admin = anAdmin(random);
      const target = otherThan(random, admin);
      const [from, to] = random.pick([
        ['MEMBER', 'ADMIN'],
        ['ADMIN', 'MEMBER'],
        ['MEMBER', 'BILLING_MANAGER'],
      ] as const);
      return [
        {
          offsetSeconds: 0,
          actor: admin,
          eventType: 'PERMISSION',
          action: 'ROLE_CHANGED',
          resourceType: 'USER',
          resourceId: target.id,
          description: `Changed ${target.name}'s organization role from ${from.toLowerCase()} to ${to.toLowerCase().replace('_', ' ')}`,
          source: 'admin-dashboard',
          before: { role: from },
          after: { role: to },
          metadata: { targetEmail: target.email },
        },
      ];
    },
  },
  {
    name: 'remove project member',
    weight: 2,
    build(random) {
      const admin = anAdmin(random);
      const target = otherThan(random, admin);
      const project = random.pick(PROJECTS);
      return [
        {
          offsetSeconds: 0,
          actor: admin,
          eventType: 'PERMISSION',
          action: 'MEMBER_REMOVED_FROM_PROJECT',
          resourceType: 'PROJECT',
          resourceId: project.id,
          description: `Removed ${target.name} from ${project.name}`,
          source: 'admin-dashboard',
          before: { userId: target.id, projectRole: random.pick(['EDITOR', 'VIEWER']) },
          after: null,
        },
      ];
    },
  },
  {
    name: 'create project',
    weight: 4,
    build(random) {
      const actor = anyone(random);
      const project = random.pick(PROJECTS);
      return [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'PROJECT',
          action: 'PROJECT_CREATED',
          resourceType: 'PROJECT',
          resourceId: `${project.id}_${random.hex(4)}`,
          description: `Created project ${project.name}`,
          source: 'web-app',
          after: {
            name: project.name,
            slug: project.slug,
            visibility: random.pick(['private', 'internal']),
            region: random.pick(['eu-central-1', 'us-east-1']),
          },
        },
      ];
    },
  },
  {
    name: 'update project settings',
    weight: 7,
    build(random) {
      const actor = anyone(random);
      const project = random.pick(PROJECTS);
      const change = random.pick<Change>([
        {
          label: 'default branch',
          before: { defaultBranch: 'master' },
          after: { defaultBranch: 'main' },
        },
        {
          label: 'log retention',
          before: { logRetentionDays: 30 },
          after: { logRetentionDays: 90 },
        },
        {
          label: 'visibility',
          before: { visibility: 'internal' },
          after: { visibility: 'private' },
        },
        {
          label: 'deployment protection',
          before: { deployments: { requireApproval: false, approvers: [] } },
          after: { deployments: { requireApproval: true, approvers: ['team:platform'] } },
        },
      ]);
      return [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'PROJECT',
          action: 'PROJECT_SETTINGS_UPDATED',
          resourceType: 'PROJECT',
          resourceId: project.id,
          description: `Changed ${change.label} for ${project.name}`,
          source: 'web-app',
          before: change.before,
          after: change.after,
        },
      ];
    },
  },
  {
    name: 'rename project',
    weight: 2,
    build(random) {
      const project = random.pick(PROJECTS);
      const newName = `${project.name} ${random.pick(['v2', 'Platform', 'Core'])}`;
      return [
        {
          offsetSeconds: 0,
          actor: anAdmin(random),
          eventType: 'PROJECT',
          action: 'PROJECT_RENAMED',
          resourceType: 'PROJECT',
          resourceId: project.id,
          description: `Renamed project ${project.name} to ${newName}`,
          source: 'web-app',
          before: { name: project.name },
          after: { name: newName },
        },
      ];
    },
  },
  {
    name: 'archive and delete project',
    weight: 2,
    build(random) {
      const admin = anAdmin(random);
      const project = random.pick(PROJECTS);
      const resourceId = `${project.id}_${random.hex(4)}`;
      const name = `${project.name} Sandbox`;
      const steps: ScenarioStep[] = [
        {
          offsetSeconds: 0,
          actor: admin,
          eventType: 'PROJECT',
          action: 'PROJECT_ARCHIVED',
          resourceType: 'PROJECT',
          resourceId,
          description: `Archived project ${name}`,
          source: 'web-app',
          before: { status: 'active' },
          after: { status: 'archived' },
        },
        {
          offsetSeconds: random.int(600, 3000),
          actor: admin,
          eventType: 'PROJECT',
          action: 'PROJECT_DELETED',
          resourceType: 'PROJECT',
          resourceId,
          description: `Deleted project ${name}`,
          source: 'web-app',
          before: { name, slug: `${project.slug}-sandbox`, status: 'archived' },
          after: null,
          metadata: { confirmation: 'typed_project_name' },
        },
      ];
      return steps;
    },
  },
  {
    name: 'create API key',
    weight: 4,
    build(random) {
      const actor = anyone(random);
      const project = random.pick(PROJECTS);
      const scopes = [...random.pick(API_KEY_SCOPES)];
      return [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'API_KEY',
          action: 'API_KEY_CREATED',
          resourceType: 'API_KEY',
          resourceId: `key_${random.hex(10)}`,
          description: `Created API key for ${project.name}`,
          source: actor.userAgent.startsWith('auditflow-cli') ? 'api' : 'web-app',
          // Only the non-secret prefix is recorded; the key itself is shown once and never stored.
          after: {
            name: `${project.slug}-ci`,
            prefix: keyPrefix(random),
            scopes,
            expiresInDays: 90,
          },
          metadata: { projectId: project.id },
        },
      ];
    },
  },
  {
    name: 'rotate API key',
    weight: 3,
    build(random) {
      const actor = anAdmin(random);
      const project = random.pick(PROJECTS);
      const scopes = [...random.pick(API_KEY_SCOPES)];
      const oldPrefix = keyPrefix(random);
      const steps: ScenarioStep[] = [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'API_KEY',
          action: 'API_KEY_CREATED',
          resourceType: 'API_KEY',
          resourceId: `key_${random.hex(10)}`,
          description: `Created replacement API key for ${project.name}`,
          source: 'web-app',
          after: {
            name: `${project.slug}-deploy`,
            prefix: keyPrefix(random),
            scopes,
            expiresInDays: 90,
          },
          metadata: { projectId: project.id, rotation: true },
        },
        {
          offsetSeconds: random.int(30, 300),
          actor,
          eventType: 'API_KEY',
          action: 'API_KEY_REVOKED',
          resourceType: 'API_KEY',
          resourceId: `key_${random.hex(10)}`,
          description: `Revoked previous API key for ${project.name}`,
          source: 'web-app',
          before: { name: `${project.slug}-deploy`, prefix: oldPrefix, status: 'active' },
          after: { name: `${project.slug}-deploy`, prefix: oldPrefix, status: 'revoked' },
          metadata: { projectId: project.id, reason: 'rotation' },
        },
      ];
      return steps;
    },
  },
  {
    name: 'expire API key',
    weight: 2,
    build(random) {
      const project = random.pick(PROJECTS);
      const prefix = keyPrefix(random);
      return [
        {
          offsetSeconds: 0,
          actor: null,
          eventType: 'API_KEY',
          action: 'API_KEY_EXPIRED',
          resourceType: 'API_KEY',
          resourceId: `key_${random.hex(10)}`,
          description: `API key for ${project.name} expired after 90 days`,
          source: SYSTEM_SOURCES.scheduler,
          before: { prefix, status: 'active' },
          after: { prefix, status: 'expired' },
          metadata: { projectId: project.id, job: 'api-key-expiry' },
        },
      ];
    },
  },
  {
    name: 'update payment method',
    weight: 2,
    build(random) {
      const owner = ACTORS.filter((actor) => actor.role === 'OWNER');
      return [
        {
          offsetSeconds: 0,
          actor: random.pick(owner),
          eventType: 'BILLING',
          action: 'PAYMENT_METHOD_UPDATED',
          resourceType: 'BILLING_ACCOUNT',
          resourceId: 'acct_northwind',
          description: 'Replaced the default payment card',
          source: SYSTEM_SOURCES.billing,
          // Card details limited to brand, last four digits and expiry, as a payment provider exposes them.
          before: { brand: 'visa', last4: '4242', expMonth: 3, expYear: 2027 },
          after: {
            brand: 'mastercard',
            last4: String(random.int(1000, 9999)),
            expMonth: random.int(1, 12),
            expYear: 2029,
          },
        },
      ];
    },
  },
  {
    name: 'change subscription',
    weight: 1,
    build(random) {
      return [
        {
          offsetSeconds: 0,
          actor: random.pick(admins),
          eventType: 'BILLING',
          action: 'SUBSCRIPTION_PLAN_CHANGED',
          resourceType: 'BILLING_ACCOUNT',
          resourceId: 'acct_northwind',
          description: 'Upgraded from Team to Business plan',
          source: SYSTEM_SOURCES.billing,
          before: { plan: 'team', seats: 10, billingCycle: 'monthly' },
          after: { plan: 'business', seats: 25, billingCycle: 'annual' },
          metadata: { prorated: true },
        },
      ];
    },
  },
  {
    name: 'manage webhook',
    weight: 4,
    build(random) {
      const actor = anyone(random);
      const project = random.pick(PROJECTS);
      const webhookId = `whk_${random.hex(10)}`;
      const config = {
        url: `https://hooks.northwind.example/${project.slug}`,
        events: random.pick([
          ['deployment.succeeded'],
          ['deployment.failed', 'deployment.succeeded'],
        ]),
      };
      const steps: ScenarioStep[] = [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'INTEGRATION',
          action: 'WEBHOOK_CREATED',
          resourceType: 'WEBHOOK',
          resourceId: webhookId,
          description: `Created webhook for ${project.name}`,
          source: 'web-app',
          after: config,
          metadata: { projectId: project.id },
        },
      ];
      if (random.chance(0.4)) {
        steps.push({
          offsetSeconds: random.int(900, 3600),
          actor,
          eventType: 'INTEGRATION',
          action: 'WEBHOOK_DELETED',
          resourceType: 'WEBHOOK',
          resourceId: webhookId,
          description: `Deleted webhook for ${project.name}`,
          source: 'web-app',
          before: config,
          after: null,
          metadata: { projectId: project.id },
        });
      }
      return steps;
    },
  },
  {
    name: 'export data',
    weight: 2,
    build(random) {
      const actor = anAdmin(random);
      const exportId = `exp_${random.hex(10)}`;
      const rows = random.int(1_200, 48_000);
      const steps: ScenarioStep[] = [
        {
          offsetSeconds: 0,
          actor,
          eventType: 'DATA',
          action: 'DATA_EXPORT_REQUESTED',
          resourceType: 'EXPORT',
          resourceId: exportId,
          description: 'Requested an export of audit events',
          source: 'web-app',
          metadata: { format: random.pick(['csv', 'jsonl']), range: 'last_90_days' },
        },
        {
          offsetSeconds: random.int(40, 240),
          actor: null,
          eventType: 'DATA',
          action: 'DATA_EXPORT_COMPLETED',
          resourceType: 'EXPORT',
          resourceId: exportId,
          description: `Export finished: ${rows.toLocaleString('en-US')} rows`,
          source: SYSTEM_SOURCES.scheduler,
          metadata: { rows, requestedBy: actor.id },
        },
      ];
      return steps;
    },
  },
  {
    name: 'session cleanup',
    weight: 3,
    build(random) {
      return [
        {
          offsetSeconds: 0,
          actor: null,
          eventType: 'SYSTEM',
          action: 'SESSION_CLEANUP_COMPLETED',
          resourceType: 'JOB',
          resourceId: 'job_session_cleanup',
          description: 'Removed expired sessions',
          source: SYSTEM_SOURCES.scheduler,
          metadata: { expiredSessions: random.int(3, 140), durationMs: random.int(80, 900) },
        },
      ];
    },
  },
];
