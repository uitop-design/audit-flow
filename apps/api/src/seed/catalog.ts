/**
 * Fictional organisation used for demo data. Emails use reserved example domains and IP addresses
 * come from the RFC 5737 documentation ranges, so nothing points at real people or hosts.
 */

export interface SeedActor {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: 'OWNER' | 'ADMIN' | 'MEMBER';
  readonly ipAddress: string;
  readonly userAgent: string;
}

const UA = {
  chromeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  firefoxLinux: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  cli: 'auditflow-cli/2.4.1 (darwin-arm64)',
} as const;

export const ACTORS: readonly SeedActor[] = [
  {
    id: 'usr_01h8amara',
    email: 'amara.okafor@northwind.example',
    name: 'Amara Okafor',
    role: 'OWNER',
    ipAddress: '203.0.113.24',
    userAgent: UA.chromeMac,
  },
  {
    id: 'usr_01h8lucas',
    email: 'lucas.meyer@northwind.example',
    name: 'Lucas Meyer',
    role: 'ADMIN',
    ipAddress: '198.51.100.17',
    userAgent: UA.firefoxLinux,
  },
  {
    id: 'usr_01h8priya',
    email: 'priya.raman@northwind.example',
    name: 'Priya Raman',
    role: 'ADMIN',
    ipAddress: '203.0.113.88',
    userAgent: UA.chromeMac,
  },
  {
    id: 'usr_01h8sofia',
    email: 'sofia.alvarez@northwind.example',
    name: 'Sofia Álvarez',
    role: 'MEMBER',
    ipAddress: '192.0.2.45',
    userAgent: UA.safariIphone,
  },
  {
    id: 'usr_01h8kenji',
    email: 'kenji.watanabe@northwind.example',
    name: 'Kenji Watanabe',
    role: 'MEMBER',
    ipAddress: '198.51.100.62',
    userAgent: UA.edgeWindows,
  },
  {
    id: 'usr_01h8olena',
    email: 'olena.kovalenko@northwind.example',
    name: 'Olena Kovalenko',
    role: 'MEMBER',
    ipAddress: '203.0.113.140',
    userAgent: UA.firefoxLinux,
  },
  {
    id: 'usr_01h8david',
    email: 'david.chen@northwind.example',
    name: 'David Chen',
    role: 'MEMBER',
    ipAddress: '192.0.2.201',
    userAgent: UA.cli,
  },
  {
    id: 'usr_01h8fatou',
    email: 'fatou.diallo@northwind.example',
    name: 'Fatou Diallo',
    role: 'MEMBER',
    ipAddress: '198.51.100.233',
    userAgent: UA.chromeMac,
  },
  {
    id: 'usr_01h8noah',
    email: 'noah.lindqvist@northwind.example',
    name: 'Noah Lindqvist',
    role: 'MEMBER',
    ipAddress: '2001:db8:85a3::8a2e:370:7334',
    userAgent: UA.safariIphone,
  },
  {
    id: 'usr_01h8grace',
    email: 'grace.mensah@northwind.example',
    name: 'Grace Mensah',
    role: 'ADMIN',
    ipAddress: '203.0.113.9',
    userAgent: UA.edgeWindows,
  },
];

/** People who are invited during the demo period and did not exist before. */
export const INVITEES: readonly { readonly email: string; readonly name: string }[] = [
  { email: 'mateo.rossi@northwind.example', name: 'Mateo Rossi' },
  { email: 'hana.kim@northwind.example', name: 'Hana Kim' },
  { email: 'ewan.mcgregor@contractor.example', name: 'Ewan Gregor' },
  { email: 'zainab.yusuf@northwind.example', name: 'Zainab Yusuf' },
  { email: 'tomas.novak@contractor.example', name: 'Tomáš Novák' },
];

export interface SeedProject {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export const PROJECTS: readonly SeedProject[] = [
  { id: 'prj_01h9atlas', name: 'Atlas', slug: 'atlas' },
  { id: 'prj_01h9beacon', name: 'Beacon', slug: 'beacon' },
  { id: 'prj_01h9cobalt', name: 'Cobalt Checkout', slug: 'cobalt-checkout' },
  { id: 'prj_01h9delta', name: 'Delta Reporting', slug: 'delta-reporting' },
  { id: 'prj_01h9ember', name: 'Ember Mobile', slug: 'ember-mobile' },
  { id: 'prj_01h9fjord', name: 'Fjord Data Pipeline', slug: 'fjord-data-pipeline' },
];

export const API_KEY_SCOPES = [
  ['events:write'],
  ['events:read'],
  ['events:read', 'events:write'],
  ['projects:read'],
  ['projects:read', 'projects:write'],
] as const;

export const SIGN_IN_FAILURE_REASONS = [
  'invalid_password',
  'mfa_code_invalid',
  'account_locked',
] as const;

export const SYSTEM_SOURCES = {
  scheduler: 'scheduler',
  billing: 'billing-service',
} as const;
